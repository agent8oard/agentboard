export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 48px", borderBottom: "1px solid var(--border)" }}>
        <span style={{ fontWeight: 800, fontSize: 18, color: "var(--text)", letterSpacing: "-0.02em" }}>Scope</span>
        <div style={{ display: "flex", gap: 0 }}>
          <a href="/dashboard" style={{ padding: "10px 20px", border: "1px solid var(--border)", fontSize: 14, fontWeight: 600, color: "var(--text)", letterSpacing: "0.02em" }}>Dashboard</a>
          <a href="/auth" style={{ padding: "10px 20px", background: "var(--accent)", color: "var(--accent-text)", fontSize: 14, fontWeight: 700, letterSpacing: "0.02em", borderLeft: "none" }}>Get started</a>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ padding: "120px 48px 80px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 900 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text4)", margin: "0 0 32px" }}>
            Built for freelancers &amp; agencies
          </p>
          <h1 style={{ fontSize: "clamp(48px, 8vw, 96px)", fontWeight: 800, lineHeight: 1.0, letterSpacing: "-0.04em", color: "var(--text)", margin: "0 0 32px" }}>
            Turn client briefs<br />into airtight<br />proposals
          </h1>
          <p style={{ fontSize: 18, color: "var(--text3)", lineHeight: 1.7, margin: "0 0 48px", maxWidth: 480 }}>
            Paste any client enquiry. Get a structured scope, risk analysis, and ready-to-send proposal in minutes.
          </p>
          <div style={{ display: "flex", gap: 0 }}>
            <a href="/auth" style={{ display: "inline-block", background: "var(--accent)", color: "var(--accent-text)", padding: "16px 32px", fontSize: 15, fontWeight: 700, letterSpacing: "0.02em" }}>
              Get started →
            </a>
            <a href="#how" style={{ display: "inline-block", padding: "16px 32px", border: "1px solid var(--border)", fontSize: 15, fontWeight: 600, color: "var(--text)", letterSpacing: "0.02em", borderLeft: "none" }}>
              See how it works
            </a>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div id="how" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderBottom: "1px solid var(--border)" }}>
        {[
          { step: "01", title: "Paste the enquiry", desc: "Drop in the email, message, or brief exactly as received. No formatting needed." },
          { step: "02", title: "Clarify and scope", desc: "AI extracts goals, flags risks, and asks the right clarifying questions to fill the gaps." },
          { step: "03", title: "Export the proposal", desc: "Get a structured scope of work, deliverables, timeline, and contract-ready proposal." },
        ].map((item, i) => (
          <div key={item.step} style={{ padding: "64px 48px", borderRight: i < 2 ? "1px solid var(--border)" : "none", position: "relative" }}>
            <div style={{ fontSize: 72, fontWeight: 800, color: "var(--bg3)", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 32, userSelect: "none" }}>{item.step}</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", margin: "0 0 12px", letterSpacing: "-0.02em" }}>{item.title}</h3>
            <p style={{ fontSize: 15, color: "var(--text3)", lineHeight: 1.7, margin: 0 }}>{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "28px 48px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 800, fontSize: 16, color: "var(--text)", letterSpacing: "-0.02em" }}>Scope</span>
        <span style={{ fontSize: 13, color: "var(--text4)" }}>© 2025 Scope. All rights reserved.</span>
      </footer>
    </div>
  );
}
