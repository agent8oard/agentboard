import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";

export default async function ScopePage() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const serviceSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );

  const { data: projects } = await serviceSupabase
    .from("scope_projects")
    .select("id, title, status, created_at, original_enquiry")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "64px 48px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 48, borderBottom: "1px solid var(--border)", paddingBottom: 40 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text4)", margin: "0 0 12px" }}>All projects</p>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--text)", margin: 0, letterSpacing: "-0.03em" }}>Projects</h1>
          </div>
          <Link href="/scope/new" style={{ background: "var(--accent)", color: "var(--accent-text)", padding: "12px 24px", fontSize: 14, fontWeight: 700, display: "inline-block", letterSpacing: "0.02em" }}>
            New project →
          </Link>
        </div>

        {!projects || projects.length === 0 ? (
          <div style={{ paddingTop: 80, textAlign: "center" }}>
            <p style={{ fontSize: 32, fontWeight: 800, color: "var(--bg3)", letterSpacing: "-0.03em", margin: "0 0 24px" }}>No projects yet</p>
            <Link href="/scope/new" style={{ background: "var(--accent)", color: "var(--accent-text)", padding: "12px 24px", fontSize: 14, fontWeight: 700, display: "inline-block" }}>
              Create your first project →
            </Link>
          </div>
        ) : (
          <div style={{ borderTop: "1px solid var(--border)" }}>
            {/* Table header */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 140px 40px", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
              {["Project", "Status", "Date", ""].map((h) => (
                <div key={h} style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text4)" }}>{h}</div>
              ))}
            </div>
            {projects.map((p) => (
              <Link
                key={p.id}
                href={`/scope/${p.id}`}
                style={{ display: "grid", gridTemplateColumns: "1fr 100px 140px 40px", padding: "20px 0", borderBottom: "1px solid var(--border)", color: "inherit", alignItems: "center" }}
              >
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em", marginBottom: 4 }}>{p.title || "Untitled project"}</div>
                  {p.original_enquiry && (
                    <div style={{ fontSize: 13, color: "var(--text4)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", maxWidth: 400 }}>
                      {p.original_enquiry}
                    </div>
                  )}
                </div>
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
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
