import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import { Greeting } from "./Greeting";

type Project = { id: string; title: string; status: string; created_at: string };

export default async function DashboardPage() {
  const cookieStore = await cookies();

  let name = "there";
  let isDevAccount = false;
  let projects: Project[] = [];

  const devSessionCookieId = cookieStore.get("dev_session")?.value;

  if (devSessionCookieId) {
    // Real user wins — if a real auth session exists, ignore the dev cookie
    const authCheck = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
    );
    const { data: { user: realUser } } = await authCheck.auth.getUser();

    if (!realUser) {
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: devSession } = await adminClient
      .from("dev_sessions")
      .select("id, label, is_active")
      .eq("id", devSessionCookieId)
      .eq("is_active", true)
      .single();

    if (devSession) {
      name = devSession.label;
      isDevAccount = true;
      const { data: devProjects } = await adminClient
        .from("scope_projects")
        .select("id, title, status, created_at")
        .eq("user_id", devSession.id)
        .order("created_at", { ascending: false });
      projects = devProjects ?? [];
    }
    } // end !realUser
  } // end devSessionCookieId

  if (!isDevAccount) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    isDevAccount = user.email?.endsWith("@scopeapp.internal") === true;

    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const [{ data: userProjects }, { data: profile }] = await Promise.all([
      serviceClient
        .from("scope_projects")
        .select("id, title, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      serviceClient
        .from("profiles")
        .select("full_name, business_name")
        .eq("id", user.id)
        .single(),
    ]);

    projects = userProjects ?? [];
    name = profile?.full_name || profile?.business_name || user.email?.split("@")[0] || "there";
  }

  const total = projects.length;
  const drafts = projects.filter((p) => p.status === "draft").length;
  const complete = projects.filter((p) => p.status === "complete").length;
  const recent = projects.slice(0, 5);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "64px 48px" }}>

        {isDevAccount && (
          <div style={{ display: "flex", alignItems: "center", background: "#0a1a00", border: "1px solid rgba(200,241,53,0.2)", padding: "10px 16px", marginBottom: 32 }}>
            <span style={{ fontSize: 13, color: "#c8f135", fontWeight: 600 }}>DEV MODE — {name}</span>
          </div>
        )}

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 64, borderBottom: "1px solid var(--border)", paddingBottom: 40 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text4)", margin: "0 0 12px" }}>Dashboard</p>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--text)", margin: 0, letterSpacing: "-0.03em" }}><Greeting name={name} /></h1>
          </div>
          <Link href="/scope/new" style={{ background: "var(--accent)", color: "var(--accent-text)", padding: "12px 24px", fontSize: 14, fontWeight: 700, display: "inline-block", letterSpacing: "0.02em" }}>
            New project →
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 64, borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
          {[
            { label: "Total projects", value: total },
            { label: "In progress", value: drafts },
            { label: "Completed", value: complete },
          ].map((stat, i) => (
            <div key={stat.label} style={{ padding: "40px 0", borderRight: i < 2 ? "1px solid var(--border)" : "none", paddingLeft: i > 0 ? 40 : 0 }}>
              <div style={{ fontSize: 48, fontWeight: 800, color: "var(--text)", lineHeight: 1, letterSpacing: "-0.04em", marginBottom: 8 }}>{stat.value}</div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text4)" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Recent projects */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text4)", margin: 0 }}>Recent projects</p>
            <Link href="/scope" style={{ fontSize: 13, color: "var(--text3)", fontWeight: 500 }}>View all →</Link>
          </div>

          <div style={{ borderTop: "1px solid var(--border)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 120px 40px", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
              {["Project", "Status", "Date", ""].map((h) => (
                <div key={h} style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text4)" }}>{h}</div>
              ))}
            </div>

            {recent.length === 0 ? (
              <div style={{ padding: "80px 0", textAlign: "center" }}>
                <p style={{ fontSize: 15, color: "var(--text4)", margin: "0 0 24px" }}>No projects yet.</p>
                <Link href="/scope/new" style={{ background: "var(--accent)", color: "var(--accent-text)", padding: "12px 24px", fontSize: 14, fontWeight: 700, display: "inline-block" }}>
                  Create your first project →
                </Link>
              </div>
            ) : (
              recent.map((p) => (
                <Link
                  key={p.id}
                  href={`/scope/${p.id}`}
                  style={{ display: "grid", gridTemplateColumns: "1fr 100px 120px 40px", padding: "20px 0", borderBottom: "1px solid var(--border)", color: "inherit", alignItems: "center" }}
                >
                  <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em" }}>{p.title || "Untitled project"}</span>
                  <span style={{
                    fontSize: 11, padding: "3px 8px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
                    background: p.status === "complete" ? "var(--accent)" : "var(--bg3)",
                    color: p.status === "complete" ? "var(--accent-text)" : "var(--text3)",
                    display: "inline-block", width: "fit-content"
                  }}>
                    {p.status === "complete" ? "Complete" : "Draft"}
                  </span>
                  <span style={{ fontSize: 13, color: "var(--text4)" }}>{new Date(p.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                  <span style={{ fontSize: 16, color: "var(--text4)" }}>→</span>
                </Link>
              ))
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
