"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const u = data.session?.user ?? null;
      if (!u) { router.replace("/auth"); return; }
      setUser({ id: u.id, email: u.email });
      supabase.from("profiles").select("full_name").eq("id", u.id).single().then(({ data: p }: { data: { full_name?: string } | null }) => {
        if (mounted && p) setFullName(p.full_name || "");
      });
    });
    return () => { mounted = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function saveProfile() {
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").upsert({ id: user.id, full_name: fullName, updated_at: new Date().toISOString() });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function deleteAccount() {
    if (deleteConfirm !== "delete") return;
    await fetch("/api/delete-account", { method: "POST" });
    await supabase.auth.signOut();
    router.push("/");
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    border: "1px solid var(--border)",
    padding: "12px 16px",
    fontSize: 15,
    outline: "none",
    background: "var(--surface)",
    color: "var(--text)",
    boxSizing: "border-box",
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "64px 48px", maxWidth: 640 }}>

        <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: 40, marginBottom: 48 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text4)", margin: "0 0 12px" }}>Account</p>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--text)", margin: 0, letterSpacing: "-0.03em" }}>Settings</h1>
        </div>

        {/* Profile */}
        <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: 48, marginBottom: 48 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text4)", margin: "0 0 24px" }}>Profile</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text3)", marginBottom: 8, letterSpacing: "0.02em" }}>Full name</label>
              <input style={inputStyle} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text3)", marginBottom: 8, letterSpacing: "0.02em" }}>Email</label>
              <input style={{ ...inputStyle, background: "var(--bg2)", color: "var(--text4)" }} value={user?.email || ""} disabled />
            </div>
          </div>
          <button
            onClick={saveProfile}
            disabled={saving}
            style={{ marginTop: 24, background: "var(--accent)", color: "var(--accent-text)", border: "none", padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", letterSpacing: "0.02em" }}
          >
            {saving ? "Saving..." : saved ? "Saved ✓" : "Save changes"}
          </button>
        </div>

        {/* Danger zone */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#991b1b", margin: "0 0 16px" }}>Danger zone</p>
          <p style={{ fontSize: 14, color: "var(--text3)", margin: "0 0 20px", lineHeight: 1.7 }}>Permanently delete your account and all projects. This cannot be undone.</p>
          {!showDelete ? (
            <button
              onClick={() => setShowDelete(true)}
              style={{ background: "none", border: "1px solid #fecaca", color: "#991b1b", padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
            >
              Delete account
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ fontSize: 13, color: "var(--text3)", margin: 0 }}>Type <strong>delete</strong> to confirm:</p>
              <input style={inputStyle} value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="delete" />
              <div style={{ display: "flex", gap: 0 }}>
                <button
                  onClick={deleteAccount}
                  disabled={deleteConfirm !== "delete"}
                  style={{ background: "#991b1b", color: "#fff", border: "none", padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: deleteConfirm !== "delete" ? 0.5 : 1 }}
                >
                  Confirm delete
                </button>
                <button
                  onClick={() => { setShowDelete(false); setDeleteConfirm(""); }}
                  style={{ background: "none", border: "1px solid var(--border)", color: "var(--text)", padding: "10px 20px", fontSize: 14, cursor: "pointer", borderLeft: "none" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
