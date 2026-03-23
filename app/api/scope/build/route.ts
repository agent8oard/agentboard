import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();

    const authClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    const { projectId, answers } = await req.json();
    if (!projectId) return NextResponse.json({ error: "No project ID" }, { status: 400 });

    const { data: project } = await supabase.from("scope_projects").select("*").eq("id", projectId).eq("user_id", user.id).single();
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const questionsAndAnswers = (project.clarifying_questions || [])
      .map((q: string, i: number) => `Q: ${q}\nA: ${(answers || {})[i] || "(no answer provided)"}`)
      .join("\n\n");

    const prompt = `You are an expert project manager and proposal writer for freelancers and agencies. Based on the following client enquiry and clarifying answers, generate a comprehensive project scope and TWO proposal formats.

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
    "included": ["Clear statement of what is included. Write as 'Development of X', 'Creation of Y', 'Implementation of Z'"],
    "excluded": ["Clear statement of what is excluded. Write as 'Not included: X', 'Out of scope: Y'"],
    "deliverables": ["Specific, measurable deliverable. E.g. 'Fully functional responsive website with up to 5 pages'"],
    "phases": [
      {
        "name": "Phase name",
        "duration": "X weeks",
        "tasks": ["Specific task"]
      }
    ],
    "timeline": [
      {
        "phase": "Phase name",
        "duration": "X weeks",
        "milestone": "Measurable milestone output"
      }
    ],
    "assumptions": ["Internal assumption the scope is based on — NOT for client viewing"],
    "contract_clauses": [
      "1. Revisions: This project includes [X] rounds of revisions per deliverable. Additional revisions will be billed at the agreed hourly rate.",
      "2. Payment: [Payment terms appropriate to project size and type]",
      "3. Intellectual Property: Upon receipt of final payment, all intellectual property rights for the deliverables transfer to the client.",
      "4. Delays: The project timeline is contingent on the client providing timely feedback and approvals within [X] business days.",
      "5. Cancellation: Should the client cancel this project after work has commenced, [appropriate cancellation terms]."
    ]
  },
  "proposal": "FORMAL DOCUMENT PROPOSAL:\\n\\nThis document outlines the agreed scope of work between [Freelancer] and [Client] for [project description].\\n\\nWrite 3-4 professional paragraphs. DO NOT use casual language. Use 'The Contractor shall' or 'This project includes'. End with: 'By proceeding with this project, the client acknowledges and agrees to the scope, timeline, and terms outlined in this document.'",
  "proposal_email": "EMAIL DRAFT:\\n\\nHi [Name],\\n\\nThanks for reaching out about your [project type]. Based on our conversation, here is a summary of what I am proposing.\\n\\nWrite 3-4 short paragraphs in a conversational but professional first-person tone. Summarise the scope simply, give a rough timeline, state what they get. No legal jargon.\\n\\nEnd with: 'Let me know if you would like to proceed or if you have any questions. Happy to jump on a call to discuss further.\\n\\nBest,\\n[Your name]'"
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
      proposal_email: result.proposal_email,
      clarification_answers: answers || {},
      status: "complete",
      updated_at: new Date().toISOString(),
    }).eq("id", projectId);

    return NextResponse.json({ scope: result.scope, proposal: result.proposal, proposal_email: result.proposal_email, status: "complete" });
  } catch (err: unknown) {
    console.error("Build error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Server error" }, { status: 500 });
  }
}
