import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

async function getClients() {
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

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  return { authClient, serviceClient };
}

export async function GET(req: NextRequest) {
  try {
    const { authClient, serviceClient } = await getClients();

    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "No ID" }, { status: 400 });

    const { data, error } = await serviceClient.from("scope_projects").select("*").eq("id", id).eq("user_id", user.id).single();
    if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(data);
  } catch (err: unknown) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { authClient, serviceClient } = await getClients();

    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, ...fields } = await req.json();
    if (!projectId) return NextResponse.json({ error: "No project ID" }, { status: 400 });

    const allowedFields = ["title", "clarification_answers", "proposal", "status", "scope"];
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const key of allowedFields) {
      if (key in fields) update[key] = fields[key];
    }

    const { error } = await serviceClient.from("scope_projects").update(update).eq("id", projectId).eq("user_id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
