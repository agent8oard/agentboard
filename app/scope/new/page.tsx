"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function NewScopePage() {
  const router = useRouter();
  const [enquiry, setEnquiry] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!enquiry.trim()) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/scope/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enquiry: enquiry.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to analyse enquiry");
      }
      const { projectId } = await res.json();
      router.push(`/scope/${projectId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", padding: "80px 24px" }}>
        <div style={{ width: "100%", maxWidth: 680 }}>

          <a href="/scope" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text4)", display: "inline-block", marginBottom: 48 }}>
            ← Back to projects
          </a>

          <h1 style={{ fontSize: 40, fontWeight: 800, color: "var(--text)", margin: "0 0 12px", letterSpacing: "-0.04em", lineHeight: 1.1 }}>
            Paste the client enquiry
          </h1>
          <p style={{ fontSize: 15, color: "var(--text3)", margin: "0 0 48px", lineHeight: 1.7 }}>
            Drop in the email, message, or brief exactly as received. No formatting needed.
          </p>

          {error && (
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
