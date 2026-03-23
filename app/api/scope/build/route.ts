import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const accessToken = allCookies.find((c) => c.name.includes("access-token"))?.value;
    const refreshToken = allCookies.find((c) => c.name.includes("refresh-token"))?.value;

    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    if (accessToken && refreshToken) {
      await authClient.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    }

    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { projectId, answers } = await req.json();
    if (!projectId) return NextResponse.json({ error: "No project ID" }, { status: 400 });

    const { data: project } = await supabase.from("scope_projects").select("*").eq("id", projectId).eq("user_id", user.id).single();
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const questionsAndAnswers = (project.clarifying_questions || [])
      .map((q: string, i: number) => `Q: ${q}\nA: ${(answers || {})[i] || "(no answer provided)"}`)
      .join("\n\n");

    const prompt = `You are an expert project manager and proposal writer. Based on the following client enquiry and answers to clarifying questions, generate a comprehensive project scope and proposal.

Original enquiry:
"""
${project.original_enquiry}
"""

Extracted information:
${JSON.stringify(project.extracted_info, null, 2)}

Clarifying questions and answers:
${questionsAndAnswers}

Respond with ONLY a valid JSON object (no markdown, no code blocks) with these exact fields:
{
  "scope": {
    "included": ["list of what is explicitly included in the project"],
    "excluded": ["list of what is explicitly NOT included"],
    "deliverables": ["numbered list of specific deliverables the client will receive"],
    "phases": [
      {
        "name": "phase name",
        "duration": "estimated duration",
        "tasks": ["specific tasks in this phase"]
      }
    ],
    "timeline": [
      {
        "phase": "phase name",
        "duration": "duration",
        "milestone": "key milestone or output"
      }
    ],
    "assumptions": ["list of assumptions the scope is based on"],
    "contract_clauses": ["3-5 contract clauses appropriate for this project type"]
  },
  "proposal": "A professional 3-4 paragraph proposal text ready to send to the client. Cover: project understanding, approach, why you're the right choice, and next steps."
}`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }]
    });

    const content = message.content[0];
    if (content.type !== "text") throw new Error("Unexpected AI response");

    let result;
    try {
      result = JSON.parse(content.text);
    } catch {
      const match = content.text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Failed to parse AI response");
      result = JSON.parse(match[0]);
    }

    await supabase.from("scope_projects").update({
      scope: result.scope,
      proposal: result.proposal,
      clarification_answers: answers || {},
      status: "complete",
      updated_at: new Date().toISOString(),
    }).eq("id", projectId);

    return NextResponse.json({ scope: result.scope, proposal: result.proposal, status: "complete" });
  } catch (err: unknown) {
    console.error("Build error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Server error" }, { status: 500 });
  }
}
