"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
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
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const redirect = searchParams.get("redirect") || "/dashboard";
        router.replace(redirect);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = { width: "100%", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", fontSize: 15, outline: "none", background: "#fff", color: "#0a0a0a", boxSizing: "border-box" };

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <a href="/" style={{ display: "block", fontWeight: 700, fontSize: 22, color: "#0a0a0a", marginBottom: 40, textAlign: "center" }}>Scope</a>
        <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "36px 32px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0a0a0a", margin: "0 0 6px" }}>
            {mode === "signin" ? "Welcome back" : mode === "signup" ? "Create account" : "Reset password"}
          </h1>
          <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 28px" }}>
            {mode === "signin" ? "Sign in to your account" : mode === "signup" ? "Start turning briefs into proposals" : "We'll send you a reset link"}
          </p>
          {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 14, color: "#991b1b", marginBottom: 20 }}>{error}</div>}
          {success && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", fontSize: 14, color: "#166534", marginBottom: 20 }}>{success}</div>}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <input style={inputStyle} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            {mode !== "reset" && (
              <input style={inputStyle} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            )}
            <button type="submit" disabled={loading} style={{ background: "#0a0a0a", color: "#fff", border: "none", borderRadius: 8, padding: "11px 20px", fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, marginTop: 4 }}>
              {loading ? "Please wait..." : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
            </button>
          </form>
          <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 8, textAlign: "center" }}>
            {mode === "signin" && (
              <>
                <button onClick={() => setMode("signup")} style={{ background: "none", border: "none", fontSize: 13, color: "#6b7280", cursor: "pointer" }}>No account? <span style={{ color: "#0a0a0a", fontWeight: 600 }}>Sign up</span></button>
                <button onClick={() => setMode("reset")} style={{ background: "none", border: "none", fontSize: 13, color: "#6b7280", cursor: "pointer" }}>Forgot password?</button>
              </>
            )}
            {mode !== "signin" && (
              <button onClick={() => setMode("signin")} style={{ background: "none", border: "none", fontSize: 13, color: "#6b7280", cursor: "pointer" }}>Back to <span style={{ color: "#0a0a0a", fontWeight: 600 }}>sign in</span></button>
            )}
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
