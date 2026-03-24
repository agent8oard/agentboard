import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { rateLimit, getIp } from "@/lib/rateLimit";
import { sanitizeText } from "@/lib/sanitize";

async function getClients() {
  const cookieStore = await cookies();

  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );

  const serviceClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );

  return { authClient, serviceClient };
}

export async function GET(req: NextRequest) {
  try {
    const allowed = await rateLimit(`save-get:${getIp(req)}`, 30, 60);
    if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

    const { authClient, serviceClient } = await getClients();

    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = req.nextUrl.searchParams.get("id");
    if (!id || typeof id !== "string") return NextResponse.json({ error: "id is required" }, { status: 400 });

    const { data, error } = await serviceClient
      .from("scope_projects")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();
    if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const allowed = await rateLimit(`save-post:${getIp(req)}`, 30, 60);
    if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

    const { authClient, serviceClient } = await getClients();

    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { projectId, ...fields } = body;

    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const allowedFields = ["title", "clarification_answers", "proposal", "proposal_email", "status", "scope", "key_points"];
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const key of allowedFields) {
      if (key in fields) {
        // Sanitize string fields with appropriate length limits
        if (key === "title" && typeof fields[key] === "string") {
          update[key] = sanitizeText(fields[key] as string, 200);
        } else {
          update[key] = fields[key];
        }
      }
    }

    const { error } = await serviceClient
      .from("scope_projects")
      .update(update)
      .eq("id", projectId)
      .eq("user_id", user.id);
    if (error) {
      console.error("Save error:", error);
      return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
