"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface ScopeData {
  included?: string[];
  excluded?: string[];
  deliverables?: string[];
  timeline?: { phase: string; duration: string; milestone: string }[];
  contract_clauses?: string[];
}

interface PortalData {
  portal: {
    id: string;
    status: string;
    client_name?: string;
    client_email?: string;
    message?: string;
    accepted_at?: string;
    created_at: string;
  };
  project: {
    id: string;
    title: string;
    scope: ScopeData;
    proposal: string;
    extracted_info: { project_type?: string; goals?: string[] };
    created_at: string;
  } | null;
  freelancer: {
    name: string;
    email: string | null;
  };
}

export default function PortalPage() {
  const params = useParams();
  const token = params.token as string;

  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState("");
  const [acceptedAt, setAcceptedAt] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/portal/${token}`)
      .then((r) => {
        if (!r.ok) { setNotFound(true); setLoading(false); return null; }
        return r.json();
      })
      .then((d: PortalData | null) => {
        if (!d) return;
        setData(d);
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [token]);

  async function handleAccept() {
    if (!clientName.trim()) { setAcceptError("Please enter your full name."); return; }
    if (!clientEmail.trim() || !clientEmail.includes("@")) { setAcceptError("Please enter a valid email address."); return; }
    setAccepting(true);
    setAcceptError("");
    try {
      const res = await fetch("/api/portal/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, clientName: clientName.trim(), clientEmail: clientEmail.trim() }),
      });
      const d = await res.json();
      if (!res.ok) { setAcceptError(d.error || "Something went wrong."); return; }
      setAcceptedAt(d.acceptedAt);
      if (data) {
        setData({
          ...data,
          portal: {
            ...data.portal,
            status: "accepted",
            client_name: clientName.trim(),
            accepted_at: d.acceptedAt,
          },
        });
      }
    } catch {
      setAcceptError("Something went wrong. Please try again.");
    } finally {
      setAccepting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ background: "#ffffff", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <p style={{ color: "#999", fontSize: 14 }}>Loading proposal...</p>
      </div>
    );
  }

  if (notFound || !data || !data.project) {
    return (
      <div style={{ background: "#ffffff", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#111", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Proposal not found</p>
          <p style={{ color: "#888", fontSize: 14 }}>This link may be invalid or expired.</p>
        </div>
      </div>
    );
  }

  const { portal, project, freelancer } = data;
  const scope = project.scope || {};
  const isAccepted = portal.status === "accepted";

  const sentDate = new Date(portal.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const acceptedDateStr = (portal.accepted_at || acceptedAt)
    ? new Date(portal.accepted_at || acceptedAt!).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  const acceptedTimeStr = (portal.accepted_at || acceptedAt)
    ? new Date(portal.accepted_at || acceptedAt!).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <>
      <style>{`body { background: #ffffff !important; }`}</style>
      <div style={{ background: "#ffffff", minHeight: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: "#111111" }}>
        <div style={{ maxWidth: 780, margin: "0 auto", padding: "48px 24px 80px" }}>

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40, paddingBottom: 24, borderBottom: "1px solid #e8e8e8" }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#111", letterSpacing: "-0.01em" }}>
              {freelancer.name}
            </span>
            <span style={{ fontSize: 13, color: "#888", fontWeight: 500 }}>Proposal</span>
          </div>

          {/* Hero */}
          <div style={{ marginBottom: 48 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111", margin: "0 0 16px", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
              {project.title}
            </h1>
            {portal.client_name && (
              <p style={{ fontSize: 15, color: "#666", margin: "0 0 6px" }}>
                Prepared for {portal.client_name}
              </p>
            )}
            <p style={{ fontSize: 14, color: "#999", margin: "0 0 20px" }}>Sent {sentDate}</p>

            {/* Status badge */}
            {isAccepted ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", fontSize: 13, fontWeight: 600, padding: "6px 14px", borderRadius: 4 }}>
                <span>✓</span> Accepted
              </span>
            ) : (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#fffbeb", border: "1px solid #fde68a", color: "#d97706", fontSize: 13, fontWeight: 600, padding: "6px 14px", borderRadius: 4 }}>
                Awaiting your acceptance
              </span>
            )}
          </div>

          {/* Personal message */}
          {portal.message && (
            <div style={{ background: "#f9f9f9", border: "1px solid #e8e8e8", borderLeft: "3px solid #111", padding: "20px 24px", marginBottom: 48 }}>
              <p style={{ fontSize: 14, color: "#444", lineHeight: 1.7, margin: 0, fontStyle: "italic" }}>
                {portal.message}
              </p>
            </div>
          )}

          {/* Project Summary */}
          {project.extracted_info?.goals && project.extracted_info.goals.length > 0 && (
            <section style={{ marginBottom: 48 }}>
              <h2 style={sectionHeading}>Project Summary</h2>
              <p style={{ fontSize: 15, color: "#444", lineHeight: 1.8, margin: 0 }}>
                This proposal outlines the scope, deliverables, timeline, and terms
                {project.extracted_info.project_type ? ` for a ${project.extracted_info.project_type} project` : ""}.
              </p>
            </section>
          )}

          {/* Proposal text */}
          {project.proposal && (
            <section style={{ marginBottom: 48 }}>
              <h2 style={sectionHeading}>Proposal</h2>
              <div style={{ fontSize: 15, color: "#444", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                {project.proposal}
              </div>
            </section>
          )}

          {/* Scope of Work */}
          {(scope.included?.length || scope.excluded?.length) ? (
            <section style={{ marginBottom: 48 }}>
              <h2 style={sectionHeading}>Scope of Work</h2>
              <div style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
                {scope.included && scope.included.length > 0 && (
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <p style={columnLabel}>Included</p>
                    {scope.included.map((item, i) => (
                      <div key={i} style={scopeRow}>
                        <span style={{ color: "#16a34a", flexShrink: 0, fontSize: 16 }}>✓</span>
                        <span style={{ fontSize: 14, color: "#333", lineHeight: 1.7 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                )}
                {scope.excluded && scope.excluded.length > 0 && (
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <p style={columnLabel}>Not included</p>
                    {scope.excluded.map((item, i) => (
                      <div key={i} style={scopeRow}>
                        <span style={{ color: "#aaa", flexShrink: 0, fontSize: 16 }}>×</span>
                        <span style={{ fontSize: 14, color: "#666", lineHeight: 1.7 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          ) : null}

          {/* Deliverables */}
          {scope.deliverables && scope.deliverables.length > 0 && (
            <section style={{ marginBottom: 48 }}>
              <h2 style={sectionHeading}>Deliverables</h2>
              {scope.deliverables.map((d, i) => (
                <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start", padding: "14px 0", borderBottom: "1px solid #f0f0f0" }}>
                  <span style={{ width: 26, height: 26, background: "#111", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0, borderRadius: 2 }}>
                    {i + 1}
                  </span>
                  <span style={{ fontSize: 15, color: "#333", lineHeight: 1.7, paddingTop: 2 }}>{d}</span>
                </div>
              ))}
            </section>
          )}

          {/* Timeline */}
          {scope.timeline && scope.timeline.length > 0 && (
            <section style={{ marginBottom: 48 }}>
              <h2 style={sectionHeading}>Timeline</h2>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #111" }}>
                    {["Phase", "Duration", "Milestone"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 0", fontWeight: 700, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#888" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {scope.timeline.map((row, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f0f0f0" }}>
                      <td style={{ padding: "16px 0", color: "#222", fontWeight: 600, fontSize: 14 }}>{row.phase}</td>
                      <td style={{ padding: "16px 0", color: "#666", fontSize: 14 }}>{row.duration}</td>
                      <td style={{ padding: "16px 0", color: "#666", fontSize: 14 }}>{row.milestone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* Terms and Conditions */}
          {scope.contract_clauses && scope.contract_clauses.length > 0 && (
            <section style={{ marginBottom: 48 }}>
              <h2 style={sectionHeading}>Terms and Conditions</h2>
              {scope.contract_clauses.map((clause, i) => (
                <p key={i} style={{ fontSize: 13, color: "#555", lineHeight: 1.8, margin: "0 0 16px", paddingBottom: 16, borderBottom: i < scope.contract_clauses!.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                  {clause}
                </p>
              ))}
            </section>
          )}

          {/* Acceptance section */}
          {!isAccepted ? (
            <div style={{ borderTop: "3px solid #111", paddingTop: 40, marginTop: 16 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111", margin: "0 0 10px", letterSpacing: "-0.02em" }}>
                Ready to proceed?
              </h2>
              <p style={{ fontSize: 15, color: "#666", margin: "0 0 32px", lineHeight: 1.6, maxWidth: 540 }}>
                By clicking accept you confirm you have read and agree to the scope, deliverables, timeline and terms outlined above.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 480, marginBottom: 24 }}>
                <input
                  type="text"
                  placeholder="Your name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                  style={{ border: "1px solid #ddd", padding: "14px 16px", fontSize: 15, outline: "none", background: "#fff", color: "#111", boxSizing: "border-box", width: "100%" }}
                />
                <input
                  type="email"
                  placeholder="Your email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  required
                  style={{ border: "1px solid #ddd", padding: "14px 16px", fontSize: 15, outline: "none", background: "#fff", color: "#111", boxSizing: "border-box", width: "100%" }}
                />
              </div>

              {acceptError && (
                <p style={{ fontSize: 13, color: "#dc2626", margin: "0 0 16px", background: "#fef2f2", border: "1px solid #fecaca", padding: "10px 14px" }}>
                  {acceptError}
                </p>
              )}

              <button
                onClick={handleAccept}
                disabled={accepting}
                style={{ width: "100%", maxWidth: 480, background: accepting ? "#15803d" : "#16a34a", color: "#ffffff", border: "none", height: 56, fontSize: 16, fontWeight: 700, cursor: accepting ? "not-allowed" : "pointer", letterSpacing: "0.01em", opacity: accepting ? 0.8 : 1 }}
              >
                {accepting ? "Processing..." : "I accept this scope →"}
              </button>
              <p style={{ fontSize: 12, color: "#aaa", margin: "12px 0 0" }}>
                This acceptance is recorded with a timestamp for your records.
              </p>
            </div>
          ) : (
            <div style={{ borderTop: "3px solid #16a34a", paddingTop: 40, marginTop: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
                <span style={{ width: 40, height: 40, background: "#16a34a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, borderRadius: "50%", flexShrink: 0 }}>✓</span>
                <div>
                  <p style={{ fontSize: 17, fontWeight: 700, color: "#111", margin: 0 }}>
                    Scope accepted by {portal.client_name || "client"}
                  </p>
                  {(portal.accepted_at || acceptedAt) && (
                    <p style={{ fontSize: 14, color: "#666", margin: "4px 0 0" }}>
                      Accepted on {acceptedDateStr} at {acceptedTimeStr}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: 64, paddingTop: 24, borderTop: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <p style={{ fontSize: 12, color: "#bbb", margin: 0 }}>Powered by Scope</p>
            {freelancer.email && (
              <a href={`mailto:${freelancer.email}`} style={{ fontSize: 12, color: "#999", textDecoration: "none" }}>
                {freelancer.email}
              </a>
            )}
          </div>

        </div>
      </div>
    </>
  );
}

const sectionHeading: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
  color: "#111",
  margin: "0 0 20px",
  paddingBottom: 14,
  borderBottom: "1px solid #e8e8e8",
  letterSpacing: "-0.02em",
};

const columnLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#999",
  margin: "0 0 12px",
};

const scopeRow: React.CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "flex-start",
  padding: "10px 0",
  borderBottom: "1px solid #f0f0f0",
};
