"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function AuthForm() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    try {
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/update-password` });
        if (error) throw error;
        setSuccess("Check your email for a reset link.");
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user && fullName.trim()) {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            full_name: fullName.trim(),
            updated_at: new Date().toISOString(),
          });
        }
        if (data.session) {
          window.location.href = "/dashboard";
        } else {
          setSuccess("Check your email to confirm your account.");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.session) {
          const redirect = searchParams.get("redirect") || "/dashboard";
          window.location.href = redirect;
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    border: "1px solid var(--border2)",
    padding: "13px 16px",
    fontSize: 15,
    outline: "none",
    background: "var(--bg)",
    color: "var(--text)",
    boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <style>{`
        .auth-input:focus { border-color: var(--accent) !important; }
        .auth-link:hover { color: var(--text) !important; }
        .auth-back:hover { color: var(--text) !important; }
      `}</style>
      <a href="/" className="auth-back" style={{ position: "absolute", top: 24, left: 24, fontSize: 13, color: "var(--text3)", textDecoration: "none", fontWeight: 500 }}>
        ← Back
      </a>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <a href="/" style={{ display: "block", fontWeight: 800, fontSize: 22, color: "var(--text)", marginBottom: 48, textAlign: "center", letterSpacing: "-0.03em" }}>
          Scope
        </a>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "40px 36px" }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", margin: "0 0 6px", letterSpacing: "-0.03em" }}>
            {mode === "signin" ? "Welcome back" : mode === "signup" ? "Create account" : "Reset password"}
          </h1>
          <p style={{ fontSize: 14, color: "var(--text3)", margin: "0 0 32px", lineHeight: 1.5 }}>
            {mode === "signin" ? "Sign in to your account" : mode === "signup" ? "Start turning briefs into proposals" : "We'll send you a reset link"}
          </p>

          {error && (
            <div style={{ background: "var(--err-bg)", border: "1px solid var(--err-bdr)", padding: "10px 14px", fontSize: 14, color: "var(--err-text)", marginBottom: 20 }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ background: "var(--ok-bg)", border: "1px solid var(--ok-bdr)", padding: "10px 14px", fontSize: 14, color: "var(--ok-text)", marginBottom: 20 }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {mode === "signup" && (
              <input
                className="auth-input"
                style={inputStyle}
                type="text"
                placeholder="Your name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
              />
            )}
            <input
              className="auth-input"
              style={inputStyle}
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {mode !== "reset" && (
              <input
                className="auth-input"
                style={inputStyle}
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            )}
            <button
              type="submit"
              disabled={loading}
              style={{
                background: "var(--accent)",
                color: "var(--accent-text)",
                border: "none",
                height: 52,
                fontSize: 15,
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                marginTop: 4,
                letterSpacing: "0.02em",
                width: "100%",
              }}
            >
              {loading ? "Please wait..." : mode === "signin" ? "Sign in →" : mode === "signup" ? "Create account →" : "Send reset link →"}
            </button>
          </form>

          <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 10, textAlign: "center" }}>
            {mode === "signin" && (
              <>
                <button
                  onClick={() => setMode("signup")}
                  className="auth-link"
                  style={{ background: "none", border: "none", fontSize: 13, color: "var(--text3)", cursor: "pointer", padding: 0 }}
                >
                  No account? <span style={{ color: "var(--text)", fontWeight: 700 }}>Sign up</span>
                </button>
                <button
                  onClick={() => setMode("reset")}
                  className="auth-link"
                  style={{ background: "none", border: "none", fontSize: 13, color: "var(--text3)", cursor: "pointer", padding: 0 }}
                >
                  Forgot password?
                </button>
              </>
            )}
            {mode !== "signin" && (
              <button
                onClick={() => setMode("signin")}
                className="auth-link"
                style={{ background: "none", border: "none", fontSize: 13, color: "var(--text3)", cursor: "pointer", padding: 0 }}
              >
                Back to <span style={{ color: "var(--text)", fontWeight: 700 }}>sign in</span>
              </button>
            )}
            <a href="/dev" style={{ fontSize: 11, color: "#333333", textDecoration: "none", marginTop: 4 }}>
              Developer access
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}
