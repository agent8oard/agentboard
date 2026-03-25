"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function DevPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.signOut();
    setPassword("");
    setError("");
    localStorage.removeItem("dev_session");
    document.cookie = "dev_session=; path=/; max-age=0; SameSite=Lax";
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/dev/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid password");
        setLoading(false);
        return;
      }

      const { sessionId, label } = data;
      localStorage.setItem("dev_session", JSON.stringify({ sessionId, label }));
      document.cookie = `dev_session=${sessionId}; path=/; max-age=86400; SameSite=Lax`;
      window.location.href = "/dashboard";
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div style={containerStyle}>
      <a href="/" style={backLinkStyle}>← Back</a>

      <div style={cardStyle}>
        <p style={labelStyle}>DEVELOPER ACCESS</p>
        <h1 style={headingStyle}>Enter your access password</h1>
        <p style={subtitleStyle}>Each password provides independent access</p>

        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          <input
            type="password"
            placeholder="Your access password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            style={inputStyle}
            className="dev-input"
            autoFocus
            autoComplete="off"
            disabled={loading}
          />
          {error && (
            <p style={{ color: "#f44336", fontSize: 13, margin: "8px 0 0", fontWeight: 500 }}>
              {error}
            </p>
          )}
          <button type="submit" style={buttonStyle} disabled={loading || !password.trim()}>
            {loading ? "Verifying..." : "Continue →"}
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
  maxWidth: 400,
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
  lineHeight: "52px",
  textAlign: "center",
  boxSizing: "border-box",
};
