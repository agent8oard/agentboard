"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

interface ScopeData {
  included?: string[];
  excluded?: string[];
  deliverables?: string[];
  phases?: { name: string; tasks: string[]; duration: string }[];
  timeline?: { phase: string; duration: string; milestone: string }[];
  assumptions?: string[];
  contract_clauses?: string[];
}

interface KeyPoint {
  id: string;
  text: string;
  explanation: string;
  sectionName: string;
  loading?: boolean;
}

interface Project {
  id: string;
  title: string;
  proposal: string;
  proposal_email: string;
  scope: ScopeData;
  key_points: KeyPoint[];
  extracted_info: {
    project_type?: string;
    goals?: string[];
  };
}

interface SelectionPopup {
  x: number;
  y: number;
  text: string;
  sectionName: string;
}

const SECTION_IDS = ["summary", "scope", "deliverables", "timeline", "terms"] as const;
type SectionId = typeof SECTION_IDS[number];

const SECTIONS = [
  { id: "section-summary", label: "Project Summary" },
  { id: "section-scope", label: "Scope of Work" },
  { id: "section-deliverables", label: "Deliverables" },
  { id: "section-timeline", label: "Timeline" },
  { id: "section-terms", label: "Terms & Conditions" },
];

export default function ProposalPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [proposal, setProposal] = useState("");
  const [proposalEmail, setProposalEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [keyPoints, setKeyPoints] = useState<KeyPoint[]>([]);
  const [selectionPopup, setSelectionPopup] = useState<SelectionPopup | null>(null);
  const documentRef = useRef<HTMLDivElement>(null);
  const [format, setFormat] = useState<"formal" | "email">("formal");
  const [exportMode, setExportMode] = useState(false);
  const [selectedSections, setSelectedSections] = useState<Set<SectionId>>(new Set(SECTION_IDS));

  useEffect(() => {
    const projectId = params.id;
    if (!projectId) return;

    supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) => {
      if (!data.user) { router.push("/auth"); return; }
    });

    supabase
      .from("scope_projects")
      .select("*")
      .eq("id", projectId)
      .single()
      .then(({ data, error }: { data: Project | null; error: unknown }) => {
        console.log("Proposal page fetch - error:", error, "data:", data);
        if (error || !data) { setLoading(false); return; }
        console.log("Proposal:", data.proposal);
        console.log("Proposal email:", data.proposal_email);
        console.log("Scope:", data.scope);
        setProject(data);
        setProposal(data.proposal || "");
        setProposalEmail(data.proposal_email || "");
        if (data.key_points && Array.isArray(data.key_points)) {
          setKeyPoints(data.key_points);
        }
        setLoading(false);
      });
  }, [params.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      setSelectionPopup(null);
      return;
    }
    const selectedText = selection.toString().trim();
    if (selectedText.length < 20) { setSelectionPopup(null); return; }
    if (!documentRef.current) return;
    const range = selection.getRangeAt(0);
    if (!documentRef.current.contains(range.commonAncestorContainer)) { setSelectionPopup(null); return; }

    let sectionName = "Proposal";
    let node: Node | null = range.commonAncestorContainer;
    while (node && node !== documentRef.current) {
      if (node instanceof HTMLElement && node.dataset.sectionName) { sectionName = node.dataset.sectionName; break; }
      node = node.parentNode;
    }

    const rect = range.getBoundingClientRect();
    setSelectionPopup({ x: rect.left + rect.width / 2, y: rect.top + window.scrollY - 52, text: selectedText, sectionName });
  }, []);

  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseUp]);

  async function addKeyPoint() {
    if (!selectionPopup || !project) return;
    const { text, sectionName } = selectionPopup;
    setSelectionPopup(null);
    const id = `kp-${Date.now()}`;
    const newKeyPoint: KeyPoint = { id, text, explanation: "", sectionName, loading: true };
    const updated = [...keyPoints, newKeyPoint];
    setKeyPoints(updated);
    try {
      const res = await fetch("/api/scope/explain-keypoint", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ selectedText: text, projectId: project.id }) });
      const data = await res.json();
      const explanation = data.explanation || "No explanation available.";
      const finalKeyPoints = updated.map((kp) => kp.id === id ? { ...kp, explanation, loading: false } : kp);
      setKeyPoints(finalKeyPoints);
      await fetch("/api/scope/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: project.id, key_points: finalKeyPoints.map(({ id, text, explanation, sectionName }) => ({ id, text, explanation, sectionName })) }) });
    } catch {
      setKeyPoints((prev) => prev.map((kp) => kp.id === id ? { ...kp, explanation: "Failed to load explanation.", loading: false } : kp));
    }
  }

  async function deleteKeyPoint(id: string) {
    if (!project) return;
    const updated = keyPoints.filter((kp) => kp.id !== id);
    setKeyPoints(updated);
    await fetch("/api/scope/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: project.id, key_points: updated.map(({ id, text, explanation, sectionName }) => ({ id, text, explanation, sectionName })) }) });
  }

  async function saveProposal() {
    if (!project) return;
    await fetch("/api/scope/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: project.id, proposal }) });
  }

  async function saveProposalEmail(value: string) {
    if (!project) return;
    await fetch("/api/scope/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: project.id, proposal_email: value }) });
  }

  async function copyText() {
    await navigator.clipboard.writeText(format === "email" ? proposalEmail : proposal);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function toggleSection(sectionId: SectionId) {
    setSelectedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) { next.delete(sectionId); } else { next.add(sectionId); }
      return next;
    });
  }

  function sectionPrintClass(sectionId: SectionId): string {
    return exportMode && !selectedSections.has(sectionId) ? "no-print" : "";
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--bg)" }}>
      <p style={{ color: "var(--text4)", fontSize: 13, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>Loading...</p>
    </div>
  );
  if (!project) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--bg)" }}>
      <p style={{ color: "var(--text4)" }}>Proposal not found.</p>
    </div>
  );

  const scope = project.scope || {};
  const selectedCount = selectedSections.size;
  const totalSections = SECTION_IDS.length;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Sticky header */}
      <div style={{ position: "sticky", top: 0, zIndex: 30, background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "0 48px", height: 60, display: "flex", alignItems: "center", gap: 16 }}>
        <Link href={`/scope/${params.id}`} style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text4)", whiteSpace: "nowrap" }}>← Back</Link>
        <span style={{ color: "var(--border)" }}>|</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", flex: 1, letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{project.title || "Proposal"}</span>
        {exportMode && (
          <span style={{ fontSize: 12, color: "var(--text4)", whiteSpace: "nowrap" }}>
            {selectedCount}/{totalSections} sections
          </span>
        )}
        <div style={{ display: "flex", gap: 0, flexShrink: 0 }}>
          <button onClick={() => { setEditing(!editing); if (editing) saveProposal(); }} style={{ background: "none", border: "1px solid var(--border)", padding: "8px 14px", fontSize: 13, fontWeight: 600, color: "var(--text)", cursor: "pointer", borderRight: "none" }}>
            {editing ? "Save ✓" : "Edit"}
          </button>
          <button onClick={copyText} style={{ background: "none", border: "1px solid var(--border)", padding: "8px 14px", fontSize: 13, fontWeight: 600, color: "var(--text)", cursor: "pointer", borderRight: "none" }}>
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            onClick={() => setExportMode((v) => !v)}
            style={{ background: exportMode ? "var(--text3)" : "none", color: exportMode ? "var(--bg)" : "var(--text)", border: "1px solid var(--border)", padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", borderRight: "none" }}
          >
            {exportMode ? "Done" : "Customize"}
          </button>
          <button onClick={() => window.print()} style={{ background: "var(--accent)", color: "var(--accent-text)", border: "none", padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: "0.02em" }}>
            {exportMode ? `Export (${selectedCount})` : "Export PDF"}
          </button>
        </div>
      </div>

      {/* Selection popup */}
      {selectionPopup && (
        <div
          style={{ position: "absolute", left: selectionPopup.x, top: selectionPopup.y, transform: "translateX(-50%)", zIndex: 100, background: "var(--accent)", color: "var(--accent-text)", padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", userSelect: "none", letterSpacing: "0.02em" }}
          onMouseDown={(e) => e.preventDefault()}
          onClick={addKeyPoint}
        >
          Add key point ✦
        </div>
      )}

      {/* Three-column layout */}
      <div style={{ display: "flex", maxWidth: 1320, margin: "0 auto", padding: "0 48px" }}>

        {/* Left sidebar — outline */}
        <aside style={{ width: 220, flexShrink: 0, paddingTop: 48 }}>
          <div style={{ position: "sticky", top: 80 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text4)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>Outline</div>
            {/* Format toggle */}
            <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: 32, border: "1px solid var(--border)" }}>
              <button
                onClick={() => setFormat("formal")}
                style={{ background: format === "formal" ? "var(--accent)" : "transparent", color: format === "formal" ? "var(--accent-text)" : "var(--text3)", border: "none", borderBottom: "1px solid var(--border)", padding: "10px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "left", letterSpacing: "0.01em" }}
              >
                Formal Document
              </button>
              <button
                onClick={() => setFormat("email")}
                style={{ background: format === "email" ? "var(--accent)" : "transparent", color: format === "email" ? "var(--accent-text)" : "var(--text3)", border: "none", padding: "10px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "left", letterSpacing: "0.01em" }}
              >
                Email Draft
              </button>
            </div>
            {SECTIONS.map((s) => (
              <a key={s.id} href={`#${s.id}`} style={{ display: "block", fontSize: 13, color: "var(--text3)", padding: "6px 0", lineHeight: 1.5, borderBottom: "1px solid var(--border)" }}>
                {s.label}
              </a>
            ))}
          </div>
        </aside>

        {/* Center — document */}
        <main style={{ flex: 1, maxWidth: 700, padding: "48px 48px 80px" }} className="print-content">

          {/* Email format view */}
          {format === "email" && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div style={{ padding: "20px 28px", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text4)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Email Draft</span>
              </div>
              <div style={{ padding: "28px 28px" }}>
                {proposalEmail ? (
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => { const val = e.currentTarget.innerText; setProposalEmail(val); saveProposalEmail(val); }}
                    style={{ fontSize: 15, color: "var(--text2)", lineHeight: 1.8, whiteSpace: "pre-wrap", outline: "none", minHeight: 200 }}
                  >
                    {proposalEmail}
                  </div>
                ) : (
                  <p style={{ fontSize: 15, color: "var(--text4)", fontStyle: "italic", margin: 0 }}>
                    Email draft will generate when you build the scope.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Formal document view */}
          {format === "formal" && (
            editing ? (
              <textarea
                value={proposal}
                onChange={(e) => setProposal(e.target.value)}
                style={{ width: "100%", minHeight: "80vh", border: "1px solid var(--border)", padding: 28, fontSize: 15, lineHeight: 1.8, outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box", background: "var(--surface)", color: "var(--text)" }}
              />
            ) : (
              <div ref={documentRef} style={{ userSelect: "text" }}>
                {/* Document header */}
                <div style={{ marginBottom: 56, borderBottom: "1px solid var(--border)", paddingBottom: 40 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text4)", margin: "0 0 16px" }}>
                    {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                  <h1 style={{ fontSize: 40, fontWeight: 800, color: "var(--text)", margin: "0 0 8px", letterSpacing: "-0.04em", lineHeight: 1.1 }}>Project Proposal</h1>
                  <h2 style={{ fontSize: 20, fontWeight: 400, color: "var(--text3)", margin: 0, letterSpacing: "-0.01em" }}>{project.title}</h2>
                </div>

                {/* Project Summary */}
                {project.extracted_info?.goals && project.extracted_info.goals.length > 0 && (
                  <div id="section-summary" data-section-name="Project Summary" className={sectionPrintClass("summary")} style={{ position: "relative" }}>
                    {exportMode && <SectionCheckbox checked={selectedSections.has("summary")} onChange={() => toggleSection("summary")} />}
                    <DocSection title="Project Summary">
                      <p style={{ fontSize: 15, color: "var(--text2)", lineHeight: 1.8, margin: 0 }}>
                        This proposal outlines the scope, deliverables, timeline, and terms for {project.extracted_info.project_type ? `a ${project.extracted_info.project_type} project` : "this project"}.
                      </p>
                    </DocSection>
                  </div>
                )}

                {/* Proposal text */}
                {proposal && (
                  <div id="section-proposal" data-section-name="Proposal">
                    <DocSection title="Proposal">
                      <div style={{ fontSize: 15, color: "var(--text2)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{proposal}</div>
                    </DocSection>
                  </div>
                )}

                {/* Scope of Work */}
                {(scope.included || scope.excluded) && (
                  <div id="section-scope" data-section-name="Scope of Work" className={sectionPrintClass("scope")} style={{ position: "relative" }}>
                    {exportMode && <SectionCheckbox checked={selectedSections.has("scope")} onChange={() => toggleSection("scope")} />}
                    <DocSection title="Scope of Work">
                      {scope.included && scope.included.length > 0 && (
                        <div style={{ marginBottom: 20 }}>
                          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text4)", margin: "0 0 12px" }}>Included</p>
                          {scope.included.map((item, i) => (
                            <div key={i} style={{ fontSize: 14, color: "var(--text2)", padding: "10px 0", borderBottom: "1px solid var(--border)", display: "flex", gap: 12 }}>
                              <span style={{ color: "#10b981", flexShrink: 0 }}>✓</span>{item}
                            </div>
                          ))}
                        </div>
                      )}
                      {scope.excluded && scope.excluded.length > 0 && (
                        <div>
                          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text4)", margin: "16px 0 12px" }}>Not included</p>
                          {scope.excluded.map((item, i) => (
                            <div key={i} style={{ fontSize: 14, color: "var(--text3)", padding: "10px 0", borderBottom: "1px solid var(--border)", display: "flex", gap: 12 }}>
                              <span style={{ color: "var(--text4)", flexShrink: 0 }}>×</span>{item}
                            </div>
                          ))}
                        </div>
                      )}
                    </DocSection>
                  </div>
                )}

                {/* Deliverables */}
                {scope.deliverables && scope.deliverables.length > 0 && (
                  <div id="section-deliverables" data-section-name="Deliverables" className={sectionPrintClass("deliverables")} style={{ position: "relative" }}>
                    {exportMode && <SectionCheckbox checked={selectedSections.has("deliverables")} onChange={() => toggleSection("deliverables")} />}
                    <DocSection title="Deliverables">
                      {scope.deliverables.map((d, i) => (
                        <div key={i} style={{ fontSize: 14, color: "var(--text2)", padding: "12px 0", borderBottom: "1px solid var(--border)", display: "flex", gap: 16, alignItems: "flex-start" }}>
                          <span style={{ fontWeight: 700, color: "var(--text4)", flexShrink: 0, width: 20 }}>{i + 1}.</span>
                          {d}
                        </div>
                      ))}
                    </DocSection>
                  </div>
                )}

                {/* Timeline */}
                {scope.timeline && scope.timeline.length > 0 && (
                  <div id="section-timeline" data-section-name="Timeline" className={sectionPrintClass("timeline")} style={{ position: "relative" }}>
                    {exportMode && <SectionCheckbox checked={selectedSections.has("timeline")} onChange={() => toggleSection("timeline")} />}
                    <DocSection title="Timeline">
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid var(--border)" }}>
                            {["Phase", "Duration", "Milestone"].map((h) => (
                              <th key={h} style={{ textAlign: "left", padding: "10px 0", fontWeight: 600, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text4)" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {scope.timeline.map((row, i) => (
                            <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                              <td style={{ padding: "14px 0", color: "var(--text2)", fontWeight: 600 }}>{row.phase}</td>
                              <td style={{ padding: "14px 0", color: "var(--text3)" }}>{row.duration}</td>
                              <td style={{ padding: "14px 0", color: "var(--text3)" }}>{row.milestone}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </DocSection>
                  </div>
                )}

                {/* Terms */}
                {scope.contract_clauses && scope.contract_clauses.length > 0 && (
                  <div id="section-terms" data-section-name="Terms & Conditions" className={sectionPrintClass("terms")} style={{ position: "relative" }}>
                    {exportMode && <SectionCheckbox checked={selectedSections.has("terms")} onChange={() => toggleSection("terms")} />}
                    <DocSection title="Terms and Conditions">
                      {scope.contract_clauses.map((clause, i) => (
                        <p key={i} style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7, margin: "0 0 14px", paddingBottom: 14, borderBottom: i < scope.contract_clauses!.length - 1 ? "1px solid var(--border)" : "none" }}>{clause}</p>
                      ))}
                    </DocSection>
                  </div>
                )}

                {/* Assumptions — internal only */}
                {scope.assumptions && scope.assumptions.length > 0 && (
                  <div style={{ marginTop: 40, background: "var(--bg2)", border: "2px dashed var(--border)", padding: "24px 28px" }} className="no-print">
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text4)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
                      For your reference only — not included in export
                    </div>
                    <p style={{ fontSize: 12, color: "var(--text4)", fontStyle: "italic", margin: "0 0 16px" }}>
                      These assumptions were made when generating this scope. Review before sending.
                    </p>
                    {scope.assumptions.map((a, i) => (
                      <div key={i} style={{ fontSize: 13, color: "var(--text3)", fontStyle: "italic", padding: "8px 0", borderBottom: i < scope.assumptions!.length - 1 ? "1px solid var(--border)" : "none" }}>
                        — {a}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          )}
        </main>

        {/* Right panel — key points */}
        <aside style={{ width: 260, flexShrink: 0, paddingTop: 48 }} className="no-print">
          <div style={{ position: "sticky", top: 80 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text4)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>
              Key Points {keyPoints.length > 0 && `(${keyPoints.length})`}
            </div>
            {keyPoints.length === 0 && (
              <p style={{ fontSize: 13, color: "var(--text4)", lineHeight: 1.7, margin: 0 }}>
                Select any text in the proposal to add a key point and get AI insight.
              </p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "calc(100vh - 160px)", overflowY: "auto" }}>
              {keyPoints.map((kp, idx) => (
                <div key={kp.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "16px", position: "relative" }}>
                  <button
                    onClick={() => deleteKeyPoint(kp.id)}
                    style={{ position: "absolute", top: 10, right: 10, background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--text4)", lineHeight: 1, padding: "2px 4px" }}
                    title="Remove"
                  >
                    ×
                  </button>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10, paddingRight: 20 }}>
                    <span style={{ width: 20, height: 20, background: "var(--accent)", color: "var(--accent-text)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                      {idx + 1}
                    </span>
                    <p style={{ fontSize: 12, color: "var(--text4)", fontStyle: "italic", margin: 0, lineHeight: 1.5 }}>
                      &ldquo;{kp.text.length > 80 ? kp.text.slice(0, 80) + "…" : kp.text}&rdquo;
                    </p>
                  </div>
                  {kp.loading ? (
                    <div style={{ fontSize: 13, color: "var(--text4)", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid var(--border)", borderTopColor: "var(--text3)", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                      Analysing...
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6, margin: 0 }}>{kp.explanation}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media print {
          aside { display: none !important; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function DocSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 48 }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: "0 0 20px", paddingBottom: 16, borderBottom: "1px solid var(--border)", letterSpacing: "-0.02em" }}>{title}</h2>
      {children}
    </div>
  );
}

function SectionCheckbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div style={{ position: "absolute", top: 4, left: -28, zIndex: 2 }}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ width: 16, height: 16, cursor: "pointer", accentColor: "var(--accent)" }} />
    </div>
  );
}
