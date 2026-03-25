import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";
import { rateLimit, getIp } from "@/lib/rateLimit";
import { sanitizeText } from "@/lib/sanitize";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
    );

    const body = await req.json();
    const rawEnquiry = body?.enquiry;
    const devSessionId = body?.devSessionId as string | undefined;

    if (!rawEnquiry || typeof rawEnquiry !== "string" || !rawEnquiry.trim()) {
      return NextResponse.json({ error: "enquiry is required" }, { status: 400 });
    }

    const enquiry = sanitizeText(rawEnquiry, 10000);
    if (!enquiry) return NextResponse.json({ error: "enquiry cannot be empty" }, { status: 400 });

    let userId: string;

    if (devSessionId) {
      // Dev mode: verify session against dev_sessions table
      const { data: devSession } = await supabase
        .from("dev_sessions")
        .select("id, is_active, label")
        .eq("id", devSessionId)
        .eq("is_active", true)
        .single();

      if (!devSession) {
        return NextResponse.json({ error: "Invalid dev session" }, { status: 401 });
      }

      // Rate limit by dev session
      const allowed = await rateLimit(`extract:dev:${devSession.id}`, 10, 60);
      if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

      // Ensure a profile exists for this dev session (satisfies FK constraint)
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", devSession.id)
        .single();

      if (!existingProfile) {
        await supabase.from("profiles").insert({
          id: devSession.id,
          full_name: devSession.label || "Developer",
          subscription_status: "active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      userId = devSession.id;
    } else {
      // Normal auth path
      const authClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
      );

      const { data: { user } } = await authClient.auth.getUser();
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const allowed = await rateLimit(`extract:${user.id}`, 10, 60);
      if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

      userId = user.id;

      // Ensure profile exists before inserting project
      const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).single();
      if (!profile) {
        await supabase.from("profiles").insert({
          id: user.id,
          full_name: user.user_metadata?.full_name || "",
          subscription_status: "inactive",
          updated_at: new Date().toISOString(),
        });
      }
    }

    const { data: project, error: insertError } = await supabase
      .from("scope_projects")
      .insert({ user_id: userId, original_enquiry: enquiry, status: "draft" })
      .select()
      .single();

    if (insertError || !project) {
      console.error("Insert error:", insertError);
      return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{
        role: "user",
        content: `You are an expert project scoper. Analyse this client enquiry and extract structured information.

Client enquiry:
"""
${enquiry}
"""

Respond with ONLY a valid JSON object (no markdown, no code blocks) with these exact fields:
{
  "suggested_title": "concise project title",
  "project_type": "type of project (e.g. Website, Mobile App, Branding, etc.)",
  "goals": ["array of main project goals"],
  "features_requested": ["array of specific features/requirements mentioned"],
  "deadline": "deadline if mentioned, else null",
  "budget_mentioned": "budget if mentioned, else null",
  "missing_details": ["array of important details that are unclear or missing"],
  "risk_flags": ["array of potential risks or concerns for the project"],
  "clarifying_questions": ["array of 3-5 specific questions to ask the client to fill in the gaps"]
}`
      }]
    });

    const content = message.content[0];
    if (content.type !== "text") throw new Error("Unexpected response from AI");

    let extracted;
    try {
      extracted = JSON.parse(content.text);
    } catch {
      const match = content.text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Failed to parse AI response");
      extracted = JSON.parse(match[0]);
    }

    const { suggested_title, clarifying_questions, risk_flags, ...extractedInfo } = extracted;

    await supabase.from("scope_projects").update({
      title: suggested_title,
      extracted_info: extractedInfo,
      clarifying_questions: clarifying_questions || [],
      risk_flags: risk_flags || [],
      updated_at: new Date().toISOString(),
    }).eq("id", project.id);

    return NextResponse.json({ projectId: project.id, title: suggested_title, extracted: extractedInfo });
  } catch (err: unknown) {
    console.error("Extract error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
