"use client";
import { useState } from "react";
import Link from "next/link";
import { detectRedFlags } from "@/lib/redFlags";
import { getTemplateById } from "@/lib/industryTemplates";

interface Project {
  id: string;
  title: string;
  status: string;
  created_at: string;
  original_enquiry: string;
  portal_status?: string | null;
  portal_sent_at?: string | null;
  extracted_info?: { industry_id?: string } | null;
}

function DeleteModal({ projectId, onClose, onDeleted }: { projectId: string; onClose: () => void; onDeleted: (id: string) => void }) {
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const valid = confirm === "DELETE";

  async function handleDelete() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/scope/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to delete");
      }
      onDeleted(projectId);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: "#0d0d0d", border: "1px solid var(--border)", padding: "40px 36px", width: "100%", maxWidth: 420 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", margin: "0 0 8px", letterSpacing: "-0.03em" }}>Delete project</h2>
        <p style={{ fontSize: 14, color: "var(--text3)", margin: "0 0 28px", lineHeight: 1.6 }}>
          This action cannot be undone. Type <span style={{ fontWeight: 700, color: "var(--text)" }}>DELETE</span> to confirm.
        </p>
        <input
          type="text"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Type DELETE"
          style={{ width: "100%", border: "1px solid var(--border2)", padding: "12px 14px", fontSize: 14, background: "var(--bg)", color: "var(--text)", outline: "none", boxSizing: "border-box", marginBottom: 16 }}
        />
        {error && (
          <div style={{ background: "var(--err-bg)", border: "1px solid var(--err-bdr)", padding: "10px 14px", fontSize: 13, color: "var(--err-text)", marginBottom: 16 }}>
            {error}
          </div>
        )}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={handleDelete}
            disabled={!valid || loading}
            style={{
              flex: 1,
              height: 44,
              background: valid ? "#ef4444" : "var(--bg3)",
              color: valid ? "#ffffff" : "var(--text4)",
              border: "none",
              fontSize: 14,
              fontWeight: 700,
              cursor: valid && !loading ? "pointer" : "not-allowed",
              letterSpacing: "0.02em",
              transition: "background 0.15s, color 0.15s",
            }}
          >
            {loading ? "Deleting..." : "Delete project"}
          </button>
          <button
            onClick={onClose}
            style={{ flex: 1, height: 44, background: "none", border: "1px solid var(--border)", color: "var(--text3)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProjectsClient({ initialProjects }: { initialProjects: Project[] }) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleDeleted(id: string) {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  if (projects.length === 0) {
    return (
      <div style={{ paddingTop: 80, textAlign: "center" }}>
        <p style={{ fontSize: 32, fontWeight: 800, color: "var(--bg3)", letterSpacing: "-0.03em", margin: "0 0 24px" }}>No projects yet</p>
        <Link href="/scope/new" style={{ background: "var(--accent)", color: "var(--accent-text)", padding: "12px 24px", fontSize: 14, fontWeight: 700, display: "inline-block" }}>
          Create your first project →
        </Link>
      </div>
    );
  }

  return (
    <>
      {deletingId && (
        <DeleteModal
          projectId={deletingId}
          onClose={() => setDeletingId(null)}
          onDeleted={handleDeleted}
        />
      )}
      <div style={{ borderTop: "1px solid var(--border)" }}>
        {/* Table header */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 130px 140px 40px 44px", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
          {["Project", "Status", "Risk", "Portal", "Date", "", ""].map((h, i) => (
            <div key={i} style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text4)" }}>{h}</div>
          ))}
        </div>
        {projects.map((p) => {
          const flags = p.original_enquiry ? detectRedFlags(p.original_enquiry) : [];
          const highCount = flags.filter((f) => f.flag.severity === "high").length;
          const otherCount = flags.filter((f) => f.flag.severity !== "high").length;
          const industryTemplate = p.extracted_info?.industry_id
            ? getTemplateById(p.extracted_info.industry_id)
            : undefined;

          return (
          <div
            key={p.id}
            style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 130px 140px 40px 44px", borderBottom: "1px solid var(--border)", alignItems: "center" }}
          >
            <Link
              href={`/scope/${p.id}`}
              style={{ display: "contents", color: "inherit" }}
            >
              <div style={{ padding: "20px 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em" }}>{p.title || "Untitled project"}</div>
                  {industryTemplate && industryTemplate.id !== "general" && (
                    <span style={{ fontSize: 11, padding: "2px 7px", background: "var(--bg3)", color: "var(--text4)", fontWeight: 600, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
                      {industryTemplate.name}
                    </span>
                  )}
                </div>
                {p.original_enquiry && (
                  <div style={{ fontSize: 13, color: "var(--text4)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", maxWidth: 400 }}>
                    {p.original_enquiry}
                  </div>
                )}
              </div>
              <div style={{ padding: "20px 0" }}>
                <span style={{
                  fontSize: 11, padding: "3px 8px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
                  background: p.status === "complete" || p.status === "accepted" ? "var(--accent)" : "var(--bg3)",
                  color: p.status === "complete" || p.status === "accepted" ? "var(--accent-text)" : "var(--text3)",
                  display: "inline-block",
                }}>
                  {p.status === "accepted" ? "Accepted" : p.status === "complete" ? "Complete" : "Draft"}
                </span>
              </div>
              <div style={{ padding: "20px 0" }}>
                {highCount > 0 ? (
                  <span style={{ fontSize: 11, padding: "3px 8px", fontWeight: 700, letterSpacing: "0.04em", background: "#3d0000", color: "#ff6b6b", border: "1px solid #ef444444", display: "inline-block" }}>
                    ⚠ {highCount} risk{highCount !== 1 ? "s" : ""}
                  </span>
                ) : otherCount > 0 ? (
                  <span style={{ fontSize: 11, padding: "3px 8px", fontWeight: 700, letterSpacing: "0.04em", background: "#2d1a00", color: "#fbbf24", border: "1px solid #f59e0b44", display: "inline-block" }}>
                    ! {otherCount} flag{otherCount !== 1 ? "s" : ""}
                  </span>
                ) : null}
              </div>
              <div style={{ padding: "20px 0" }}>
                {p.portal_status === "accepted" ? (
                  <span style={{ fontSize: 11, padding: "3px 8px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", display: "inline-block" }}>
                    Accepted
                  </span>
                ) : p.portal_status === "pending" ? (
                  <span style={{ fontSize: 11, padding: "3px 8px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", display: "inline-block" }}>
                    Portal sent
                  </span>
                ) : null}
              </div>
              <div style={{ padding: "20px 0", fontSize: 13, color: "var(--text4)" }}>
                {new Date(p.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </div>
              <div style={{ padding: "20px 0", fontSize: 16, color: "var(--text4)" }}>→</div>
            </Link>
            <div style={{ padding: "20px 0" }}>
              <button
                onClick={() => setDeletingId(p.id)}
                style={{ background: "none", border: "none", color: "var(--text4)", cursor: "pointer", fontSize: 16, padding: "4px 6px", lineHeight: 1 }}
                title="Delete project"
              >
                ×
              </button>
            </div>
          </div>
          );
        })}
      </div>
    </>
  );
}
