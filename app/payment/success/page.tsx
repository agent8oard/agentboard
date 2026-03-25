"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PaymentSuccessPage() {
  const [error, setError] = useState("");

  useEffect(() => {
    async function activate() {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get("session_id");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/auth";
        return;
      }

      const res = await fetch("/api/stripe/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });

      if (res.ok) {
        window.location.href = "/dashboard";
      } else {
        const data = await res.json();
        setError(data.error || "Failed to activate subscription");
      }
    }

    activate();
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#000",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ textAlign: "center", maxWidth: 400 }}>
        {!error ? (
          <>
            <div style={{
              width: 56, height: 56, margin: "0 auto 28px",
              border: "3px solid #1a1a1a",
              borderTop: "3px solid #c8f135",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }} />
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", margin: "0 0 10px" }}>
              Activating your subscription...
            </h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.3)", margin: 0 }}>
              Just a moment
            </p>
          </>
        ) : (
          <>
            <div style={{ marginBottom: 24 }}>
              <svg width="56" height="56" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="32" fill="#c8f135" />
                <path d="M18 32l10 10 18-18" stroke="#000" strokeWidth="3.5" strokeLinecap="square" strokeLinejoin="miter" />
              </svg>
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", margin: "0 0 10px" }}>
              Payment received!
            </h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", margin: "0 0 28px", lineHeight: 1.6 }}>
              Your payment was processed. There was a small delay activating — please go to dashboard.
            </p>
            <a href="/dashboard" style={{
              display: "inline-block",
              background: "#fff",
              color: "#000",
              padding: "14px 36px",
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: "0.02em",
              textDecoration: "none",
            }}>
              Go to dashboard →
            </a>
          </>
        )}
      </div>
    </div>
  );
}
