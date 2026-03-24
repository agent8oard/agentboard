import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { rateLimit, getIp } from "@/lib/rateLimit";

export async function DELETE(request: NextRequest) {
  try {
    const allowed = await rateLimit(`delete:${getIp(request)}`, 30, 60);
    if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

    const body = await request.json();
    const { projectId } = body;
    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify ownership via anon client (respects RLS)
    const { data: project } = await supabase
      .from("scope_projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const serviceSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
    );

    const { error } = await serviceSupabase
      .from("scope_projects")
      .delete()
      .eq("id", projectId);

    if (error) {
      console.error("Delete error:", error);
      return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
