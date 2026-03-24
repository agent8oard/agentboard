import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";
import { rateLimit, getIp } from "@/lib/rateLimit";
import { sanitizeText } from "@/lib/sanitize";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const allowed = await rateLimit(`explain:${getIp(req)}`, 30, 60);
    if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

    const cookieStore = await cookies();
    const authClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
    );
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { selectedText, projectId } = body;

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

    return NextResponse.json({ explanation: content.text });
  } catch (err: unknown) {
    console.error("Explain keypoint error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
