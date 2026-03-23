"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface Project {
  id: string;
  title: string;
  original_enquiry: string;
  extracted_info: {
    project_type?: string;
    goals?: string[];
    features_requested?: string[];
    deadline?: string;
    budget_mentioned?: string;
    missing_details?: string[];
  };
  clarifying_questions: string[];
  clarification_answers: Record<string, string>;
  scope: {
    included?: string[];
    excluded?: string[];
    deliverables?: string[];
    phases?: { name: string; tasks: string[]; duration: string; milestone?: string }[];
    timeline?: { phase: string; duration: string; milestone: string }[];
    assumptions?: string[];
    contract_clauses?: string[];
  };
  risk_flags: string[];
  proposal: string;
  status: string;
}

const label: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "var(--text4)",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  marginBottom: 20,
  display: "block",
};

const section: React.CSSProperties = {
  borderTop: "1px solid var(--border)",
  paddingTop: 40,
  paddingBottom: 40,
};

function FadeIn({ children, show }: { children: React.ReactNode; show: boolean }) {
  return (
    <div style={{
      opacity: show ? 1 : 0,
      transform: show ? "translateY(0)" : "translateY(12px)",
      transition: "opacity 0.4s ease, transform 0.4s ease",
    }}>
      {children}
    </div>
  );
}

export default function ScopeProjectPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [editTitle, setEditTitle] = useState(false);
  const [title, setTitle] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [enquiryExpanded, setEnquiryExpanded] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState<Record<number, boolean>>({});
  const [scopeVisible, setScopeVisible] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.replace("/auth"); return; }
    });
    loadProject();
  }, [params.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadProject() {
    const res = await fetch(`/api/scope/save?id=${params.id}`);
    if (!res.ok) { setLoading(false); return; }
    const data = await res.json();
    setProject(data);
    setTitle(data.title || "");
    setAnswers(data.clarification_answers || {});
    setLoading(false);
    if (data.status === "complete") setTimeout(() => setScopeVisible(true), 50);
  }

  async function saveTitle() {
    if (!project) return;
    setEditTitle(false);
    await fetch("/api/scope/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: project.id, title }) });
  }

  async function saveAnswer(index: number, value: string) {
    if (!project) return;
    const newAnswers = { ...answers, [index]: value };
    setAnswers(newAnswers);
    await fetch("/api/scope/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: project.id, clarification_answers: newAnswers }) });
  }

  async function buildScope() {
    if (!project) return;
    setBuilding(true); setError("");
    try {
      const res = await fetch("/api/scope/build", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: project.id, answers }) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to build scope"); }
      const data = await res.json();
      console.log("buildScope response:", data);
      setProject((prev) => prev ? { ...prev, ...data, status: "complete" } : prev);
      setTimeout(() => setScopeVisible(true), 50);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBuilding(false);
    }
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <p style={{ color: "var(--text4)", fontSize: 13, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>Loading...</p>
    </div>
  );

  if (!project) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <p style={{ color: "var(--text4)" }}>Project not found. <Link href="/scope" style={{ color: "var(--text)", fontWeight: 700 }}>Back to projects</Link></p>
    </div>
  );

  const info = project.extracted_info || {};
  const scope = project.scope || {};
  const isComplete = project.status === "complete";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <style>{`
        @media (max-width: 640px) {
          .scope-body { padding: 24px !important; }
          .analysis-cols { flex-direction: column !important; }
        }
        .row-hover:hover { background: var(--bg2); }
        .phase-btn:hover { background: var(--bg2) !important; }
      `}</style>

      {/* Sticky header */}
      <div style={{ position: "sticky", top: 0, zIndex: 20, background: "var(--surface)", borderBottom: "1px solid var(--border)", height: 60, display: "flex", alignItems: "center", padding: "0 48px", gap: 16 }}>
        <Link href="/scope" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text4)", whiteSpace: "nowrap", flexShrink: 0 }}>← Projects</Link>
        <span style={{ color: "var(--border)", flexShrink: 0 }}>|</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          {editTitle ? (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => e.key === "Enter" && saveTitle()}
              autoFocus
              style={{ fontSize: 15, fontWeight: 700, border: "1px solid var(--border)", padding: "4px 10px", color: "var(--text)", background: "var(--surface)", outline: "none", width: "100%", maxWidth: 400, letterSpacing: "-0.01em" }}
            />
          ) : (
            <button
              onClick={() => setEditTitle(true)}
              style={{ background: "none", border: "none", fontSize: 15, fontWeight: 700, color: "var(--text)", cursor: "text", padding: 0, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%", letterSpacing: "-0.01em" }}
            >
              {title || "Untitled project"}
              <span style={{ fontSize: 11, color: "var(--text4)", marginLeft: 8 }}>✎</span>
            </button>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <span style={{
            fontSize: 10, padding: "3px 8px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
            background: isComplete ? "var(--accent)" : "var(--bg3)",
            color: isComplete ? "var(--accent-text)" : "var(--text3)",
          }}>
            {isComplete ? "Complete" : "Draft"}
          </span>
          {isComplete && (
            <Link href={`/scope/${project.id}/proposal`} style={{ background: "var(--accent)", color: "var(--accent-text)", padding: "8px 16px", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", letterSpacing: "0.02em" }}>
              Generate proposal →
            </Link>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="scope-body" style={{ maxWidth: 860, margin: "0 auto", padding: "48px 48px 100px" }}>

        {/* Section 1 — Original enquiry */}
        <div style={section}>
          <span style={label}>Client Enquiry</span>
          <div style={{ position: "relative" }}>
            <div style={{
              background: "var(--bg2)",
              border: "1px solid var(--border)",
              padding: "20px 24px",
              fontSize: 15,
              lineHeight: 1.7,
              color: "var(--text2)",
              overflow: "hidden",
              maxHeight: enquiryExpanded ? "none" : "7em",
            }}>
              {project.original_enquiry}
            </div>
            {project.original_enquiry.length > 300 && (
              <button
                onClick={() => setEnquiryExpanded(!enquiryExpanded)}
                style={{ background: "none", border: "none", fontSize: 12, color: "var(--text3)", cursor: "pointer", padding: "10px 0 0", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}
              >
                {enquiryExpanded ? "Show less ↑" : "Show more ↓"}
              </button>
            )}
          </div>
        </div>

        {/* Section 2 — Analysis */}
        <div style={section}>
          <span style={label}>Analysis</span>
          {/* Info chips */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
            {info.project_type && (
              <span style={{ background: "var(--accent)", color: "var(--accent-text)", padding: "4px 12px", fontSize: 12, fontWeight: 600, letterSpacing: "0.04em" }}>
                {info.project_type}
              </span>
            )}
            {info.deadline && (
              <span style={{ background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text3)", padding: "4px 12px", fontSize: 12, fontWeight: 600, letterSpacing: "0.04em" }}>
                {info.deadline}
              </span>
            )}
            {info.budget_mentioned && (
              <span style={{ background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text3)", padding: "4px 12px", fontSize: 12, fontWeight: 600, letterSpacing: "0.04em" }}>
                {info.budget_mentioned}
              </span>
            )}
          </div>
          {/* Two columns */}
          <div className="analysis-cols" style={{ display: "flex", gap: 48, marginBottom: info.missing_details && info.missing_details.length > 0 ? 28 : 0 }}>
            {info.goals && info.goals.length > 0 && (
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text4)", marginBottom: 16 }}>Goals</div>
                {info.goals.map((g, i) => (
                  <div key={i} style={{ fontSize: 15, color: "var(--text2)", lineHeight: 1.7, paddingTop: 8, paddingBottom: 8, borderBottom: "1px solid var(--border)", display: "flex", gap: 12 }}>
                    <span style={{ color: "var(--text4)", flexShrink: 0, marginTop: 2 }}>—</span>{g}
                  </div>
                ))}
              </div>
            )}
            {info.features_requested && info.features_requested.length > 0 && (
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text4)", marginBottom: 16 }}>Features Requested</div>
                {info.features_requested.map((f, i) => (
                  <div key={i} style={{ fontSize: 15, color: "var(--text2)", lineHeight: 1.7, paddingTop: 8, paddingBottom: 8, borderBottom: "1px solid var(--border)", display: "flex", gap: 12 }}>
                    <span style={{ color: "var(--text4)", flexShrink: 0, marginTop: 2 }}>—</span>{f}
                  </div>
                ))}
              </div>
            )}
          </div>
          {info.missing_details && info.missing_details.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text4)", marginBottom: 12 }}>Missing Details</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {info.missing_details.map((d, i) => (
                  <span key={i} style={{ background: "#fffbeb", border: "1px solid #fcd34d", color: "#92400e", padding: "4px 10px", fontSize: 12, fontWeight: 600 }}>
                    ⚠ {d}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section 3 — Risk flags */}
        {project.risk_flags && project.risk_flags.length > 0 && (
          <div style={section}>
            <span style={label}>Risk Flags</span>
            {project.risk_flags.map((r, i) => (
              <div key={i} style={{ borderLeft: "3px solid #f59e0b", background: "#fffbeb", padding: "14px 20px", marginBottom: 8, display: "flex", gap: 12, alignItems: "flex-start" }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                  <path d="M8 1.5L14.5 13H1.5L8 1.5Z" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1" strokeLinejoin="round"/>
                  <path d="M8 6v3.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="8" cy="11" r="0.75" fill="#fff"/>
                </svg>
                <span style={{ fontSize: 14, color: "#92400e", lineHeight: 1.6 }}>{r}</span>
              </div>
            ))}
          </div>
        )}

        {/* Section 4 — Clarifying questions */}
        {project.clarifying_questions && project.clarifying_questions.length > 0 && (
          <div style={section}>
            <span style={label}>Clarifying Questions</span>
            <p style={{ fontSize: 15, color: "var(--text3)", margin: "0 0 32px", lineHeight: 1.7 }}>Answer these to strengthen your scope before building.</p>
            {project.clarifying_questions.map((q, i) => (
              <div key={i} style={{ borderTop: i === 0 ? "1px solid var(--border)" : "none", borderBottom: "1px solid var(--border)", padding: "24px 0" }}>
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 16 }}>
                  <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: "var(--text4)", marginTop: 3, flexShrink: 0, letterSpacing: "0.04em" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", lineHeight: 1.5, letterSpacing: "-0.01em" }}>{q}</span>
                </div>
                <textarea
                  key={`answer-${i}`}
                  defaultValue={answers[i] || ""}
                  onBlur={(e) => saveAnswer(i, e.target.value)}
                  placeholder="Your answer..."
                  style={{ width: "100%", border: "1px solid var(--border)", padding: "12px 16px", fontSize: 14, minHeight: 88, resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.7, color: "var(--text2)", background: "var(--bg2)" }}
                />
              </div>
            ))}
            {error && (
              <div style={{ border: "1px solid #fecaca", padding: "12px 16px", fontSize: 14, color: "#991b1b", marginTop: 16, background: "#fef2f2" }}>{error}</div>
            )}
            <button
              onClick={buildScope}
              disabled={building}
              style={{ width: "100%", background: "var(--accent)", color: "var(--accent-text)", border: "none", height: 52, fontSize: 15, fontWeight: 700, cursor: building ? "not-allowed" : "pointer", opacity: building ? 0.6 : 1, marginTop: 24, letterSpacing: "0.02em" }}
            >
              {building ? "Building scope..." : "Build scope →"}
            </button>
          </div>
        )}

        {/* Sections 5–9 — shown after scope is built */}
        <FadeIn show={scopeVisible}>

          {/* Section 5 — Scope of work */}
          {(scope.included || scope.excluded) && (
            <div style={section}>
              <span style={label}>Scope of Work</span>
              <div className="analysis-cols" style={{ display: "flex", gap: 48 }}>
                {scope.included && scope.included.length > 0 && (
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#10b981", marginBottom: 16 }}>Included</div>
                    {scope.included.map((item, i) => (
                      <div key={i} style={{ fontSize: 15, color: "var(--text2)", lineHeight: 1.7, paddingTop: 10, paddingBottom: 10, borderBottom: "1px solid var(--border)", display: "flex", gap: 12 }}>
                        <span style={{ color: "#10b981", flexShrink: 0 }}>✓</span>
                        {item}
                      </div>
                    ))}
                  </div>
                )}
                {scope.excluded && scope.excluded.length > 0 && (
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text4)", marginBottom: 16 }}>Not Included</div>
                    {scope.excluded.map((item, i) => (
                      <div key={i} style={{ fontSize: 15, color: "var(--text3)", lineHeight: 1.7, paddingTop: 10, paddingBottom: 10, borderBottom: "1px solid var(--border)", display: "flex", gap: 12 }}>
                        <span style={{ color: "var(--text4)", flexShrink: 0 }}>×</span>
                        {item}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 6 — Deliverables */}
          {scope.deliverables && scope.deliverables.length > 0 && (
            <div style={section}>
              <span style={label}>Deliverables</span>
              {scope.deliverables.map((d, i) => (
                <div key={i} style={{ display: "flex", gap: 20, alignItems: "flex-start", padding: "20px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ width: 28, height: 28, background: "var(--accent)", color: "var(--accent-text)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0, letterSpacing: "0" }}>
                    {i + 1}
                  </span>
                  <span style={{ fontSize: 15, color: "var(--text2)", lineHeight: 1.7, paddingTop: 3 }}>{d}</span>
                </div>
              ))}
            </div>
          )}

          {/* Section 7 — Project phases */}
          {scope.phases && scope.phases.length > 0 && (
            <div style={section}>
              <span style={label}>Project Phases</span>
              {scope.phases.map((phase, i) => (
                <div key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                  <button
                    className="phase-btn"
                    onClick={() => setExpandedPhases((prev) => ({ ...prev, [i]: !prev[i] }))}
                    style={{ width: "100%", background: "transparent", border: "none", padding: "20px 0", display: "flex", alignItems: "center", gap: 16, cursor: "pointer", textAlign: "left" }}
                  >
                    <span style={{ width: 28, height: 28, background: "var(--accent)", color: "var(--accent-text)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                      {i + 1}
                    </span>
                    <span style={{ flex: 1, fontSize: 15, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em" }}>{phase.name}</span>
                    <span style={{ fontSize: 12, color: "var(--text4)", fontWeight: 500 }}>{phase.duration}</span>
                    <span style={{ color: "var(--text4)", fontSize: 11, marginLeft: 4 }}>{expandedPhases[i] ? "▲" : "▼"}</span>
                  </button>
                  {expandedPhases[i] && (
                    <div style={{ padding: "0 0 20px 44px" }}>
                      {phase.tasks.map((task, j) => (
                        <div key={j} style={{ fontSize: 14, color: "var(--text3)", padding: "6px 0", lineHeight: 1.6 }}>— {task}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Section 8 — Timeline */}
          {scope.timeline && scope.timeline.length > 0 && (
            <div style={section}>
              <span style={label}>Timeline</span>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Phase", "Duration", "Milestone"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "12px 0", color: "var(--text4)", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {scope.timeline.map((row, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "20px 0", color: "var(--text2)", fontWeight: 600, fontSize: 15 }}>{row.phase}</td>
                      <td style={{ padding: "20px 0", color: "var(--text3)", fontSize: 14 }}>{row.duration}</td>
                      <td style={{ padding: "20px 0", color: "var(--text3)", fontSize: 14 }}>{row.milestone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Section 9 — Contract clauses */}
          {scope.contract_clauses && scope.contract_clauses.length > 0 && (
            <div style={section}>
              <span style={label}>Contract Clauses</span>
              {scope.contract_clauses.map((clause, i) => (
                <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start", padding: "20px 0", borderBottom: "1px solid var(--border)" }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                    <path d="M9 1.5L15.5 4.5V9C15.5 12.5 12.5 15.5 9 16.5C5.5 15.5 2.5 12.5 2.5 9V4.5L9 1.5Z" fill="var(--bg3)" stroke="var(--border)" strokeWidth="1"/>
                    <path d="M6.5 9l2 2 3-3" stroke="var(--text3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.7, margin: 0 }}>{clause}</p>
                </div>
              ))}
            </div>
          )}

          {/* Bottom CTA */}
          {isComplete && (
            <div style={{ paddingTop: 40 }}>
              <Link
                href={`/scope/${project.id}/proposal`}
                style={{ display: "block", width: "100%", background: "var(--accent)", color: "var(--accent-text)", height: 52, fontSize: 15, fontWeight: 700, textAlign: "center", lineHeight: "52px", boxSizing: "border-box", letterSpacing: "0.02em" }}
              >
                Generate proposal →
              </Link>
            </div>
          )}

        </FadeIn>
      </div>
    </div>
  );
}
