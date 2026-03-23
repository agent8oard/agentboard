export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", background: "#ffffff" }}>
      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 40px", borderBottom: "1px solid #e5e7eb" }}>
        <span style={{ fontWeight: 700, fontSize: 20, color: "#0a0a0a" }}>Scope</span>
        <div style={{ display: "flex", gap: 12 }}>
          <a href="/dashboard" style={{ padding: "8px 18px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, fontWeight: 500, color: "#0a0a0a" }}>Dashboard</a>
          <a href="/auth" style={{ padding: "8px 18px", background: "#0a0a0a", color: "#fff", borderRadius: 8, fontSize: 14, fontWeight: 600 }}>Get started</a>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "100px 24px 80px", textAlign: "center" }}>
        <div style={{ display: "inline-block", background: "#f3f4f6", borderRadius: 100, padding: "6px 16px", fontSize: 13, color: "#6b7280", marginBottom: 32, fontWeight: 500 }}>
          Built for freelancers & agencies
        </div>
        <h1 style={{ fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.03em", color: "#0a0a0a", margin: "0 0 24px" }}>
          Turn client briefs into<br />airtight proposals
        </h1>
        <p style={{ fontSize: 20, color: "#6b7280", lineHeight: 1.6, margin: "0 0 48px", maxWidth: 520, marginLeft: "auto", marginRight: "auto" }}>
          Paste any client enquiry. Get a structured scope, risk analysis, and ready-to-send proposal in minutes.
        </p>
        <a href="/auth" style={{ display: "inline-block", background: "#0a0a0a", color: "#fff", padding: "14px 32px", borderRadius: 10, fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em" }}>
          Start for free →
        </a>
      </div>

      {/* Steps */}
      <div style={{ maxWidth: 960, margin: "0 auto 100px", padding: "0 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
          {[
            { step: "01", title: "Paste the enquiry", desc: "Drop in the email, message, or brief exactly as received. No formatting needed." },
            { step: "02", title: "Clarify and scope", desc: "AI extracts goals, flags risks, and asks the right clarifying questions to fill the gaps." },
            { step: "03", title: "Export the proposal", desc: "Get a structured scope of work, deliverables, timeline, and contract-ready proposal." },
          ].map((item) => (
            <div key={item.step} style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "32px 28px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#9ca3af", marginBottom: 12, letterSpacing: "0.05em" }}>{item.step}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0a0a0a", margin: "0 0 10px" }}>{item.title}</h3>
              <p style={{ fontSize: 15, color: "#6b7280", lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #e5e7eb", padding: "32px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <span style={{ fontWeight: 700, color: "#0a0a0a" }}>Scope</span>
        <span style={{ fontSize: 13, color: "#9ca3af" }}>© 2025 Scope. All rights reserved.</span>
      </footer>
    </div>
  );
}
