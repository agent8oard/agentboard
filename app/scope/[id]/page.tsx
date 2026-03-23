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

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "28px 32px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  marginTop: 24,
};

const sectionLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: "#9ca3af",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  marginBottom: 16,
  display: "block",
};

function FadeIn({ children, show }: { children: React.ReactNode; show: boolean }) {
  return (
    <div style={{
      opacity: show ? 1 : 0,
      transform: show ? "translateY(0)" : "translateY(8px)",
      transition: "opacity 0.3s ease, transform 0.3s ease",
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
      setProject((prev) => prev ? { ...prev, ...data, status: "complete" } : prev);
      setTimeout(() => setScopeVisible(true), 50);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBuilding(false);
    }
  }

  const hasAnswers = Object.values(answers).some((v) => v.trim().length > 0);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb" }}>
      <p style={{ color: "#9ca3af", fontSize: 15 }}>Loading project...</p>
    </div>
  );

  if (!project) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb" }}>
      <p style={{ color: "#9ca3af" }}>Project not found. <Link href="/scope" style={{ color: "#0a0a0a", fontWeight: 600 }}>Back to projects</Link></p>
    </div>
  );

  const info = project.extracted_info || {};
  const scope = project.scope || {};
  const isComplete = project.status === "complete";

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
      <style>{`
        @media (max-width: 640px) {
          .scope-body { padding: 16px !important; }
          .analysis-cols { flex-direction: column !important; }
          .header-right { gap: 8px !important; }
        }
        details > summary { list-style: none; }
        details > summary::-webkit-details-marker { display: none; }
      `}</style>

      {/* Sticky header */}
      <div style={{ position: "sticky", top: 0, zIndex: 20, background: "#fff", borderBottom: "1px solid #e5e7eb", height: 60, display: "flex", alignItems: "center", padding: "0 40px", gap: 12 }}>
        <Link href="/scope" style={{ fontSize: 13, color: "#9ca3af", whiteSpace: "nowrap", flexShrink: 0 }}>← Projects</Link>
        <span style={{ color: "#e5e7eb", flexShrink: 0 }}>|</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          {editTitle ? (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => e.key === "Enter" && saveTitle()}
              autoFocus
              style={{ fontSize: 15, fontWeight: 600, border: "1px solid #e5e7eb", borderRadius: 6, padding: "4px 10px", color: "#0a0a0a", outline: "none", width: "100%", maxWidth: 400 }}
            />
          ) : (
            <button
              onClick={() => setEditTitle(true)}
              style={{ background: "none", border: "none", fontSize: 15, fontWeight: 600, color: "#0a0a0a", cursor: "text", padding: 0, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}
            >
              {title || "Untitled project"}
              <span style={{ fontSize: 11, color: "#d1d5db", marginLeft: 6 }}>✎</span>
            </button>
          )}
        </div>
        <div className="header-right" style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 100, background: isComplete ? "#0a0a0a" : "#f3f4f6", color: isComplete ? "#fff" : "#6b7280", fontWeight: 600, whiteSpace: "nowrap" }}>
            {isComplete ? "Complete" : "Draft"}
          </span>
          {isComplete && (
            <Link href={`/scope/${project.id}/proposal`} style={{ background: "#0a0a0a", color: "#fff", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
              Generate proposal →
            </Link>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="scope-body" style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* Section 1 — Original enquiry */}
        <div style={card}>
          <span style={sectionLabel}>Client Enquiry</span>
          <div style={{ position: "relative" }}>
            <div style={{
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: "16px 20px",
              fontSize: 15,
              lineHeight: 1.7,
              color: "#374151",
              overflow: "hidden",
              maxHeight: enquiryExpanded ? "none" : "6.8em",
            }}>
              {project.original_enquiry}
            </div>
            {project.original_enquiry.length > 300 && (
              <button
                onClick={() => setEnquiryExpanded(!enquiryExpanded)}
                style={{ background: "none", border: "none", fontSize: 13, color: "#6b7280", cursor: "pointer", padding: "8px 0 0", fontWeight: 500 }}
              >
                {enquiryExpanded ? "Show less ↑" : "Show more ↓"}
              </button>
            )}
          </div>
        </div>

        {/* Section 2 — Analysis */}
        <div style={card}>
          <span style={sectionLabel}>Analysis</span>
          {/* Chips row */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
            {info.project_type && (
              <span style={{ background: "#0a0a0a", color: "#fff", borderRadius: 100, padding: "4px 14px", fontSize: 13, fontWeight: 500 }}>
                {info.project_type}
              </span>
            )}
            {info.deadline && (
              <span style={{ background: "#fffbeb", border: "1px solid #fcd34d", color: "#92400e", borderRadius: 100, padding: "4px 14px", fontSize: 13, fontWeight: 500 }}>
                📅 {info.deadline}
              </span>
            )}
            {info.budget_mentioned && (
              <span style={{ background: "#fffbeb", border: "1px solid #fcd34d", color: "#92400e", borderRadius: 100, padding: "4px 14px", fontSize: 13, fontWeight: 500 }}>
                💰 {info.budget_mentioned}
              </span>
            )}
          </div>
          {/* Two columns */}
          <div className="analysis-cols" style={{ display: "flex", gap: 32, marginBottom: info.missing_details && info.missing_details.length > 0 ? 20 : 0 }}>
            {info.goals && info.goals.length > 0 && (
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Goals</div>
                {info.goals.map((g, i) => (
                  <div key={i} style={{ fontSize: 14, color: "#374151", lineHeight: 2, display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ color: "#d1d5db", marginTop: 2, flexShrink: 0 }}>•</span>{g}
                  </div>
                ))}
              </div>
            )}
            {info.features_requested && info.features_requested.length > 0 && (
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Features Requested</div>
                {info.features_requested.map((f, i) => (
                  <div key={i} style={{ fontSize: 14, color: "#374151", lineHeight: 2, display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ color: "#d1d5db", marginTop: 2, flexShrink: 0 }}>•</span>{f}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Missing details */}
          {info.missing_details && info.missing_details.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Missing Details</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {info.missing_details.map((d, i) => (
                  <span key={i} style={{ background: "#fffbeb", border: "1px solid #fcd34d", color: "#92400e", borderRadius: 6, padding: "3px 10px", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 4 }}>
                    ⚠ {d}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section 3 — Risk flags */}
        {project.risk_flags && project.risk_flags.length > 0 && (
          <div style={card}>
            <span style={sectionLabel}>Risk Flags</span>
            {project.risk_flags.map((r, i) => (
              <div key={i} style={{ borderLeft: "3px solid #f59e0b", background: "#fffbeb", padding: "12px 16px", borderRadius: 8, marginBottom: 8, display: "flex", gap: 12, alignItems: "flex-start" }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                  <path d="M8 1.5L14.5 13H1.5L8 1.5Z" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1" strokeLinejoin="round"/>
                  <path d="M8 6v3.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="8" cy="11" r="0.75" fill="#fff"/>
                </svg>
                <span style={{ fontSize: 14, color: "#92400e", lineHeight: 1.5 }}>{r}</span>
              </div>
            ))}
          </div>
        )}

        {/* Section 4 — Clarifying questions */}
        {project.clarifying_questions && project.clarifying_questions.length > 0 && (
          <div style={card}>
            <span style={sectionLabel}>Clarifying Questions</span>
            <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 20px", lineHeight: 1.6 }}>Answer these to strengthen your scope before building.</p>
            {project.clarifying_questions.map((q, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "20px 24px", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10, gap: 12 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flex: 1 }}>
                    <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: "#9ca3af", marginTop: 3, flexShrink: 0 }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span style={{ fontSize: 15, fontWeight: 600, color: "#0a0a0a", lineHeight: 1.5 }}>{q}</span>
                  </div>
                </div>
                <textarea
                  key={`answer-${i}`}
                  defaultValue={answers[i] || ""}
                  onBlur={(e) => saveAnswer(i, e.target.value)}
                  placeholder="Your answer..."
                  style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", fontSize: 14, minHeight: 80, resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.6, color: "#374151" }}
                />
              </div>
            ))}
            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "12px 16px", fontSize: 14, color: "#991b1b", marginBottom: 16 }}>{error}</div>
            )}
            <button
              onClick={buildScope}
              disabled={building}
              style={{ width: "100%", background: "#0a0a0a", color: "#fff", border: "none", borderRadius: 10, height: 52, fontSize: 16, fontWeight: 700, cursor: building ? "not-allowed" : "pointer", opacity: building ? 0.7 : 1, marginTop: 8 }}
            >
              {building ? "Building scope..." : "Build scope →"}
            </button>
          </div>
        )}

        {/* Sections 5-9 — shown after scope is built */}
        <FadeIn show={scopeVisible}>

          {/* Section 5 — Scope of work */}
          {(scope.included || scope.excluded) && (
            <div style={card}>
              <span style={sectionLabel}>Scope of Work</span>
              <div className="analysis-cols" style={{ display: "flex", gap: 32 }}>
                {scope.included && scope.included.length > 0 && (
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Included</div>
                    {scope.included.map((item, i) => (
                      <div key={i} style={{ fontSize: 14, color: "#374151", lineHeight: 2, display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 4 }}>
                          <circle cx="8" cy="8" r="7" fill="#d1fae5"/>
                          <path d="M5 8l2.5 2.5L11 5.5" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {item}
                      </div>
                    ))}
                  </div>
                )}
                {scope.excluded && scope.excluded.length > 0 && (
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Not Included</div>
                    {scope.excluded.map((item, i) => (
                      <div key={i} style={{ fontSize: 14, color: "#6b7280", lineHeight: 2, display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 4 }}>
                          <circle cx="8" cy="8" r="7" fill="#f3f4f6"/>
                          <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
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
            <div style={card}>
              <span style={sectionLabel}>Deliverables</span>
              {scope.deliverables.map((d, i) => (
                <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "10px 0", borderBottom: i < scope.deliverables!.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                  <span style={{ width: 26, height: 26, background: "#0a0a0a", color: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                    {i + 1}
                  </span>
                  <span style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, paddingTop: 3 }}>{d}</span>
                </div>
              ))}
            </div>
          )}

          {/* Section 7 — Project phases */}
          {scope.phases && scope.phases.length > 0 && (
            <div style={card}>
              <span style={sectionLabel}>Project Phases</span>
              {scope.phases.map((phase, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <button
                    onClick={() => setExpandedPhases((prev) => ({ ...prev, [i]: !prev[i] }))}
                    style={{ width: "100%", background: expandedPhases[i] ? "#f9fafb" : "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", textAlign: "left" }}
                  >
                    <span style={{ width: 28, height: 28, background: "#0a0a0a", color: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                      {i + 1}
                    </span>
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "#0a0a0a" }}>{phase.name}</span>
                    <span style={{ fontSize: 12, color: "#9ca3af", marginRight: 8 }}>{phase.duration}</span>
                    <span style={{ color: "#9ca3af", fontSize: 12 }}>{expandedPhases[i] ? "▲" : "▼"}</span>
                  </button>
                  {expandedPhases[i] && (
                    <div style={{ border: "1px solid #e5e7eb", borderTop: "none", borderRadius: "0 0 8px 8px", padding: "12px 16px 12px 58px", background: "#f9fafb" }}>
                      {phase.tasks.map((task, j) => (
                        <div key={j} style={{ fontSize: 13, color: "#374151", padding: "4px 0", lineHeight: 1.6 }}>• {task}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Section 8 — Timeline */}
          {scope.timeline && scope.timeline.length > 0 && (
            <div style={card}>
              <span style={sectionLabel}>Timeline</span>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr>
                    {["Phase", "Duration", "Milestone"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#6b7280", fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid #e5e7eb" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {scope.timeline.map((row, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                      <td style={{ padding: "12px", color: "#374151", fontWeight: 500 }}>{row.phase}</td>
                      <td style={{ padding: "12px", color: "#6b7280" }}>{row.duration}</td>
                      <td style={{ padding: "12px", color: "#6b7280" }}>{row.milestone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Section 9 — Contract clauses */}
          {scope.contract_clauses && scope.contract_clauses.length > 0 && (
            <div style={card}>
              <span style={sectionLabel}>Contract Clauses</span>
              {scope.contract_clauses.map((clause, i) => (
                <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "14px 0", borderBottom: i < scope.contract_clauses!.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                    <path d="M9 1.5L15.5 4.5V9C15.5 12.5 12.5 15.5 9 16.5C5.5 15.5 2.5 12.5 2.5 9V4.5L9 1.5Z" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1"/>
                    <path d="M6.5 9l2 2 3-3" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, margin: 0 }}>{clause}</p>
                </div>
              ))}
            </div>
          )}

          {/* Bottom CTA */}
          {isComplete && (
            <div style={{ marginTop: 32 }}>
              <Link
                href={`/scope/${project.id}/proposal`}
                style={{ display: "block", width: "100%", background: "#0a0a0a", color: "#fff", borderRadius: 10, height: 52, fontSize: 16, fontWeight: 700, textAlign: "center", lineHeight: "52px", boxSizing: "border-box" }}
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
