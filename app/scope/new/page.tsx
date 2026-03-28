"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { INDUSTRY_TEMPLATES } from "@/lib/industryTemplates";

export default function NewScopePage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedIndustry, setSelectedIndustry] = useState<string>("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [enquiry, setEnquiry] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [limitError, setLimitError] = useState(false);
  const [focused, setFocused] = useState(false);
  const [devSessionId, setDevSessionId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("dev_session");
      if (stored) {
        const parsed = JSON.parse(stored) as { sessionId?: string };
        setDevSessionId(parsed.sessionId ?? null);
      }
    } catch { /* ignore */ }
  }, []);

  const industryId = selectedIndustry || "general";
  const selectedTemplate = INDUSTRY_TEMPLATES.find((t) => t.id === industryId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!enquiry.trim()) return;
    setLoading(true); setError(""); setLimitError(false);
    try {
      const body: Record<string, string> = { enquiry: enquiry.trim(), industryId };
      if (devSessionId) body.devSessionId = devSessionId;

      const res = await fetch("/api/scope/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        if (res.status === 429) { setLimitError(true); setLoading(false); return; }
        throw new Error(d.error || "Failed to analyse enquiry");
      }
      const { projectId } = await res.json();
      router.push(`/scope/${projectId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  if (step === 1) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
        <Sidebar />
        <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", padding: "80px 24px" }}>
          <div style={{ width: "100%", maxWidth: 720 }}>
            <a href="/scope" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text4)", display: "inline-block", marginBottom: 48 }}>
              ← Back to projects
            </a>

            <h1 style={{ fontSize: 40, fontWeight: 800, color: "var(--text)", margin: "0 0 12px", letterSpacing: "-0.04em", lineHeight: 1.1 }}>
              What type of project is this?
            </h1>
            <p style={{ fontSize: 15, color: "var(--text3)", margin: "0 0 48px", lineHeight: 1.7 }}>
              Choose the closest match — this helps tailor the scope and contract clauses.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {INDUSTRY_TEMPLATES.map((t) => {
                const isSelected = selectedIndustry === t.id;
                const isHovered = hoveredId === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedIndustry(t.id)}
                    onMouseEnter={() => setHoveredId(t.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{
                      background: isSelected ? "#0a1a00" : "#000000",
                      border: isSelected || isHovered ? "1px solid #c8f135" : "1px solid #1f1f1f",
                      boxShadow: isSelected || isHovered ? "0 0 0 1px #c8f135" : "none",
                      padding: "20px",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "border 0.15s ease, box-shadow 0.15s ease, background 0.15s ease",
                    }}
                  >
                    <div
                      style={{ color: isSelected ? "#c8f135" : "var(--text3)", marginBottom: 12, lineHeight: 0 }}
                      dangerouslySetInnerHTML={{ __html: t.icon }}
                    />
                    <div style={{ fontSize: 14, fontWeight: 700, color: isSelected ? "#c8f135" : "var(--text)", marginBottom: 4 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text4)", lineHeight: 1.5 }}>{t.description}</div>
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: 32, display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setStep(2)}
                disabled={!selectedIndustry}
                style={{
                  background: selectedIndustry ? "var(--accent)" : "var(--bg3)",
                  color: selectedIndustry ? "var(--accent-text)" : "var(--text4)",
                  border: "none",
                  padding: "14px 32px",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: selectedIndustry ? "pointer" : "not-allowed",
                  letterSpacing: "0.02em",
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                Continue →
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", padding: "80px 24px" }}>
        <div style={{ width: "100%", maxWidth: 680 }}>

          <a href="/scope" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text4)", display: "inline-block", marginBottom: 48 }}>
            ← Back to projects
          </a>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <span style={{ fontSize: 13, padding: "4px 10px", background: "var(--bg3)", color: "var(--text3)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
              {selectedTemplate?.name}
            </span>
            <button
              onClick={() => setStep(1)}
              style={{ fontSize: 12, color: "var(--text4)", background: "none", border: "none", cursor: "pointer", fontWeight: 600, padding: 0, letterSpacing: "0.02em" }}
            >
              Change
            </button>
          </div>

          <h1 style={{ fontSize: 40, fontWeight: 800, color: "var(--text)", margin: "0 0 12px", letterSpacing: "-0.04em", lineHeight: 1.1 }}>
            Paste the client enquiry
          </h1>
          <p style={{ fontSize: 15, color: "var(--text3)", margin: "0 0 48px", lineHeight: 1.7 }}>
            Drop in the email, message, or brief exactly as received. No formatting needed.
          </p>

          {limitError && (
            <div style={{ border: "1px solid #f59e0b", padding: "20px 24px", marginBottom: 24, background: "rgba(245,158,11,0.06)" }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#f59e0b", margin: "0 0 6px" }}>
                You&rsquo;ve reached your monthly limit for enquiry analysis (80/80)
              </p>
              <p style={{ fontSize: 13, color: "#92400e", margin: "0 0 6px" }}>
                Your usage resets on the 1st of {(() => { const d = new Date(); d.setMonth(d.getMonth() + 1, 1); return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" }); })()}
              </p>
              <p style={{ fontSize: 13, color: "#92400e", margin: 0 }}>
                Need more? <a href="mailto:support@scopeapp.io" style={{ color: "#f59e0b", fontWeight: 600 }}>Contact support.</a>
              </p>
            </div>
          )}
          {error && !limitError && (
            <div style={{ border: "1px solid #fecaca", padding: "12px 16px", fontSize: 14, color: "#991b1b", marginBottom: 24, background: "#fef2f2" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ position: "relative" }}>
              <textarea
                value={enquiry}
                onChange={(e) => setEnquiry(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Hi, I need a website for my restaurant. We want online ordering, a menu page, and a booking system. The site needs to be ready by end of next month..."
                style={{
                  width: "100%",
                  minHeight: 300,
                  border: "1px solid var(--border)",
                  borderTop: focused ? "3px solid var(--text)" : "1px solid var(--border)",
                  padding: focused ? "14px 16px 40px" : "16px 16px 40px",
                  fontSize: 15,
                  lineHeight: 1.7,
                  resize: "vertical",
                  outline: "none",
                  color: "var(--text)",
                  background: "var(--surface)",
                  boxSizing: "border-box",
                }}
              />
              <div style={{ position: "absolute", bottom: 12, right: 16, fontSize: 12, color: "var(--text4)", fontWeight: 500, letterSpacing: "0.04em" }}>
                {enquiry.length} chars
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !enquiry.trim()}
              style={{
                width: "100%",
                background: "var(--accent)",
                color: "var(--accent-text)",
                border: "none",
                padding: 0,
                height: 56,
                fontSize: 15,
                fontWeight: 700,
                cursor: loading || !enquiry.trim() ? "not-allowed" : "pointer",
                opacity: !enquiry.trim() ? 0.4 : 1,
                marginTop: 0,
                letterSpacing: "0.02em",
              }}
            >
              {loading ? "Analysing..." : "Analyse enquiry →"}
            </button>
          </form>

        </div>
      </main>
    </div>
  );
}
