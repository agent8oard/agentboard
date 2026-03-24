"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const FEATURES = [
  "Unlimited projects",
  "AI scope generation",
  "Risk flag detection",
  "Professional proposals",
  "PDF export",
  "Contract clauses",
];

export default function PaymentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubscribe() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }
      router.push(data.url);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

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
      <div style={{ width: "100%", maxWidth: 480, textAlign: "center" }}>
        <p style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.18em",
          textTransform: "uppercase", color: "#c8f135", margin: "0 0 20px",
        }}>
          SCOPE PRO
        </p>
        <h1 style={{
          fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 800, color: "#fff",
          letterSpacing: "-0.03em", margin: "0 0 16px", lineHeight: 1.1,
        }}>
          Start writing better proposals today
        </h1>
        <p style={{
          fontSize: 15, color: "rgba(255,255,255,0.4)", lineHeight: 1.65,
          margin: "0 0 48px", maxWidth: 380, marginLeft: "auto", marginRight: "auto",
        }}>
          Join freelancers who use Scope to win better clients and protect their work.
        </p>

        {/* Price card */}
        <div style={{
          background: "#0d0d0d",
          border: "1px solid #2a2a2a",
          padding: "40px",
          textAlign: "left",
        }}>
          {/* Price */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginBottom: 32 }}>
            <span style={{ fontSize: 64, fontWeight: 800, color: "#fff", letterSpacing: "-0.05em", lineHeight: 1 }}>
              $19
            </span>
            <span style={{ fontSize: 16, color: "rgba(255,255,255,0.35)", fontWeight: 400, paddingBottom: 8 }}>
              /month
            </span>
          </div>

          {/* Features */}
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", display: "flex", flexDirection: "column", gap: 14 }}>
            {FEATURES.map((f) => (
              <li key={f} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>
                <span style={{ color: "#c8f135", fontSize: 16, flexShrink: 0 }}>✓</span>
                {f}
              </li>
            ))}
          </ul>

          {error && (
            <p style={{ color: "#f44336", fontSize: 13, margin: "0 0 16px", fontWeight: 500 }}>{error}</p>
          )}

          {/* Subscribe button */}
          <button
            onClick={handleSubscribe}
            disabled={loading}
            style={{
              display: "block",
              width: "100%",
              background: loading ? "#9ab52a" : "#c8f135",
              color: "#000",
              border: "none",
              height: 56,
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: "0.02em",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Redirecting to checkout..." : "Subscribe now →"}
          </button>

          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", textAlign: "center", margin: "16px 0 0" }}>
            Cancel anytime. No lock-in.
          </p>
        </div>

        <p style={{ marginTop: 32, fontSize: 11, color: "#333333", textAlign: "center" }}>
          <a href="/dev" style={{ color: "#333333", textDecoration: "none" }}>Developer access</a>
        </p>
      </div>
    </div>
  );
}
