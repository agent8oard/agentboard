"use client";
import { useEffect } from "react";

const LINKS = [
  { label: "New project", href: "/scope/new", desc: "Create a new scope project" },
  { label: "All projects", href: "/scope", desc: "Browse the projects list" },
  { label: "Dashboard", href: "/dashboard", desc: "Main user dashboard" },
  { label: "Settings", href: "/settings", desc: "Account & settings page" },
  { label: "Payment", href: "/payment", desc: "Subscription / payment wall" },
  { label: "Auth", href: "/auth", desc: "Sign in / sign up page" },
  { label: "Landing page", href: "/", desc: "Public marketing page" },
];

export default function DevDashboard() {
  useEffect(() => {
    if (localStorage.getItem("dev_mode") !== "true") {
      window.location.href = "/dev";
    }
  }, []);

  function exitDevMode() {
    localStorage.removeItem("dev_mode");
    document.cookie = "dev_mode=; path=/; max-age=0";
    window.location.href = "/";
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#000",
      color: "#fff",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      padding: "48px 56px",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 56, borderBottom: "1px solid #1a1a1a", paddingBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em" }}>Scope</span>
          <span style={{ background: "#c8f135", color: "#000", fontSize: 10, fontWeight: 700, padding: "3px 8px", letterSpacing: "0.1em" }}>
            DEV MODE
          </span>
        </div>
        <button
          onClick={exitDevMode}
          style={{
            background: "none",
            border: "1px solid #2a2a2a",
            color: "rgba(255,255,255,0.4)",
            fontSize: 13,
            fontWeight: 500,
            padding: "8px 16px",
            cursor: "pointer",
            fontFamily: "inherit",
            letterSpacing: "0.01em",
          }}
        >
          Exit dev mode
        </button>
      </div>

      {/* Title */}
      <div style={{ marginBottom: 48 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#c8f135", margin: "0 0 16px" }}>
          Developer Dashboard
        </p>
        <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 10px", lineHeight: 1 }}>
          App testing hub
        </h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", margin: 0 }}>
          Navigate to any page. Dev cookie active — payment wall bypassed for signed-in accounts.
        </p>
      </div>

      {/* Page links */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 1, border: "1px solid #1a1a1a" }}>
        {LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            style={{
              display: "block",
              padding: "20px 24px",
              background: "#0a0a0a",
              borderRight: "1px solid #1a1a1a",
              borderBottom: "1px solid #1a1a1a",
              textDecoration: "none",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#111")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#0a0a0a")}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em" }}>{link.label}</span>
              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.2)" }}>→</span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{link.href}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.22)", marginTop: 4 }}>{link.desc}</div>
          </a>
        ))}
      </div>

      <p style={{ marginTop: 40, fontSize: 12, color: "rgba(255,255,255,0.15)" }}>
        App pages that require a Supabase session will redirect to /auth. Sign in with a test account to use them.
      </p>
    </div>
  );
}
