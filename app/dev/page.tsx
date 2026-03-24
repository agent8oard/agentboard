"use client";
import { useState } from "react";

export default function DevPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    if (password !== "VitaminC2014") {
      setError("Incorrect password");
      setLoading(false);
      return;
    }
    localStorage.setItem("dev_mode", "true");
    document.cookie = "dev_mode=true; path=/; max-age=31536000";
    window.location.href = "/dashboard";
  }

  return (
    <div style={containerStyle}>
      <a href="/" style={backLinkStyle}>← Back to home</a>
      <div style={cardStyle}>
        <p style={labelStyle}>DEVELOPER ACCESS</p>
        <h1 style={headingStyle}>Developer Portal</h1>
        <p style={subtitleStyle}>Enter the developer password to access the full app</p>

        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          <input
            type="password"
            placeholder="Enter developer password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            style={inputStyle}
            className="dev-input"
            autoFocus
          />
          {error && (
            <p style={{ color: "#f44336", fontSize: 13, margin: "8px 0 0", fontWeight: 500 }}>
              {error}
            </p>
          )}
          <button type="submit" disabled={loading} style={{ ...buttonStyle, background: loading ? "#9ab52a" : "#c8f135", cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Verifying..." : "Enter developer mode →"}
          </button>
        </form>
      </div>
      <style>{`.dev-input:focus { border-color: #c8f135 !important; outline: none; }`}</style>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#000",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
  position: "relative",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const backLinkStyle: React.CSSProperties = {
  position: "absolute",
  top: 28,
  left: 32,
  fontSize: 13,
  color: "rgba(255,255,255,0.35)",
  textDecoration: "none",
  fontWeight: 500,
};

const cardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 420,
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
};

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "#c8f135",
  margin: "0 0 20px",
};

const headingStyle: React.CSSProperties = {
  fontSize: 32,
  fontWeight: 800,
  color: "#fff",
  margin: "0 0 10px",
  letterSpacing: "-0.03em",
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 14,
  color: "rgba(255,255,255,0.4)",
  margin: "0 0 32px",
  lineHeight: 1.6,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#000",
  border: "1px solid #2a2a2a",
  color: "#fff",
  padding: "14px 16px",
  fontSize: 14,
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const buttonStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  background: "#c8f135",
  color: "#000",
  border: "none",
  height: 52,
  fontSize: 15,
  fontWeight: 700,
  letterSpacing: "0.02em",
  cursor: "pointer",
  marginTop: 12,
};
