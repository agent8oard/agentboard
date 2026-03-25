import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";
import { rateLimit, getIp } from "@/lib/rateLimit";
import { sanitizeText } from "@/lib/sanitize";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const allowed = await rateLimit(`explain:${getIp(req)}`, 30, 60);
    if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

    const body = await req.json();
    const { selectedText, projectId, devSessionId } = body;

    let userId = "";
    let monthKey = "";
    let usageCount = 0;

    // Dev session path
    if (devSessionId) {
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { data: devSession } = await adminClient
        .from("dev_sessions")
        .select("id, is_active")
        .eq("id", devSessionId)
        .eq("is_active", true)
        .single();
      if (!devSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      // Dev session valid — skip usage limits, fall through to AI call below
    } else {
      const cookieStore = await cookies();
      const authClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
      );
      const { data: { user } } = await authClient.auth.getUser();
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      userId = user.id;

      // Monthly usage check
      const serviceClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const now = new Date();
      monthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
      const { data: usageData } = await serviceClient
        .from("api_usage")
        .select("count")
        .eq("user_id", userId)
        .eq("action", "explain")
        .eq("month", monthKey)
        .single();
      usageCount = usageData?.count || 0;
      if (usageCount >= 200) {
        return NextResponse.json({ error: "Monthly limit reached. Your limit resets on the 1st of next month." }, { status: 429 });
      }
    }

    if (!selectedText || typeof selectedText !== "string" || !selectedText.trim()) {
      return NextResponse.json({ error: "selectedText is required" }, { status: 400 });
    }

    const cleanText = sanitizeText(selectedText, 5000);
    if (!cleanText) return NextResponse.json({ error: "selectedText cannot be empty" }, { status: 400 });

    void projectId;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      messages: [{
        role: "user",
        content: `You are a freelance business advisor. A freelancer is reviewing this text from a client proposal:

"${cleanText}"

In 2-3 sentences, explain why this specific point matters for the freelancer — what risk, opportunity, or implication it carries. Be direct and practical.`
      }]
    });

    const content = message.content[0];
    if (content.type !== "text") throw new Error("Unexpected response");

    // Increment monthly usage (skip for dev sessions)
    if (!devSessionId && userId && monthKey) {
      const serviceClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      await serviceClient.from("api_usage").upsert({
        user_id: userId,
        action: "explain",
        month: monthKey,
        count: usageCount + 1,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,action,month" });
    }

    return NextResponse.json({ explanation: content.text });
  } catch (err: unknown) {
    console.error("Explain keypoint error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
