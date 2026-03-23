"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";

interface Profile {
  full_name: string;
  business_name: string;
  avatar_url: string;
  default_revision_rounds: number | "";
  default_payment_terms: string;
  default_hourly_rate: number | "";
  default_proposal_format: string;
}

const EMPTY: Profile = {
  full_name: "",
  business_name: "",
  avatar_url: "",
  default_revision_rounds: "",
  default_payment_terms: "",
  default_hourly_rate: "",
  default_proposal_format: "detailed",
};

const FORMAT_OPTIONS = [
  { value: "detailed", label: "Detailed — full breakdown with phases and clauses" },
  { value: "concise", label: "Concise — clear scope without exhaustive detail" },
  { value: "executive", label: "Executive — high-level summary for decision makers" },
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid var(--border2)",
  padding: "12px 16px",
  fontSize: 15,
  outline: "none",
  background: "var(--bg)",
  color: "var(--text)",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--text4)",
  marginBottom: 8,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

function SectionHeader({ title }: { title: string }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text4)", margin: "0 0 28px", paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
      {title}
    </p>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile>(EMPTY);
  const [avatarPreview, setAvatarPreview] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const u = data.session?.user ?? null;
      if (!u) { router.replace("/auth"); return; }
      setUserId(u.id);
      setEmail(u.email || "");

      supabase
        .from("profiles")
        .select("full_name, business_name, avatar_url, default_revision_rounds, default_payment_terms, default_hourly_rate, default_proposal_format")
        .eq("id", u.id)
        .single()
        .then(({ data: p }) => {
          if (!mounted || !p) return;
          setProfile({
            full_name: p.full_name || "",
            business_name: p.business_name || "",
            avatar_url: p.avatar_url || "",
            default_revision_rounds: p.default_revision_rounds ?? "",
            default_payment_terms: p.default_payment_terms || "",
            default_hourly_rate: p.default_hourly_rate ?? "",
            default_proposal_format: p.default_proposal_format || "detailed",
          });
          if (p.avatar_url) setAvatarPreview(p.avatar_url);
        });
    });
    return () => { mounted = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function set<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (file.size > 5 * 1024 * 1024) {
      setFormError("Avatar must be under 5MB.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setFormError("Please upload an image file.");
      return;
    }
    setFormError("");
    setUploadingAvatar(true);

    // Local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);

    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      setFormError("Avatar upload failed: " + uploadError.message);
      setUploadingAvatar(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = urlData.publicUrl + `?t=${Date.now()}`;
    set("avatar_url", publicUrl);
    setAvatarPreview(publicUrl);
    setUploadingAvatar(false);
  }

  async function saveProfile() {
    if (!userId) return;
    setFormError("");

    const hourlyRate = profile.default_hourly_rate === "" ? null : Number(profile.default_hourly_rate);
    const revisions = profile.default_revision_rounds === "" ? null : Number(profile.default_revision_rounds);

    if (hourlyRate !== null && (isNaN(hourlyRate) || hourlyRate < 0)) {
      setFormError("Hourly rate must be a positive number.");
      return;
    }
    if (revisions !== null && (isNaN(revisions) || revisions < 0 || revisions > 99)) {
      setFormError("Revision rounds must be between 0 and 99.");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      full_name: profile.full_name.trim() || null,
      business_name: profile.business_name.trim() || null,
      avatar_url: profile.avatar_url || null,
      default_revision_rounds: revisions,
      default_payment_terms: profile.default_payment_terms.trim() || null,
      default_hourly_rate: hourlyRate,
      default_proposal_format: profile.default_proposal_format,
      updated_at: new Date().toISOString(),
    });

    setSaving(false);
    if (error) {
      setFormError("Save failed: " + error.message);
      setSaveStatus("error");
    } else {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  }

  async function deleteAccount() {
    if (deleteConfirm !== "delete" || !userId) return;
    setDeletingAccount(true);
    await fetch("/api/delete-account", { method: "POST" });
    await supabase.auth.signOut();
    router.push("/");
  }

  const initials = profile.full_name
    ? profile.full_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : email.slice(0, 2).toUpperCase();

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "64px 48px 100px", maxWidth: 700 }}>

        {/* Page header */}
        <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: 40, marginBottom: 56 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text4)", margin: "0 0 12px" }}>Account</p>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--text)", margin: 0, letterSpacing: "-0.03em" }}>Settings</h1>
        </div>

        {/* ── Section: Profile ── */}
        <div style={{ marginBottom: 56 }}>
          <SectionHeader title="Profile" />

          {/* Avatar */}
          <div style={{ display: "flex", alignItems: "center", gap: 28, marginBottom: 32 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div
                style={{
                  width: 80, height: 80,
                  background: avatarPreview ? "transparent" : "var(--bg3)",
                  border: "1px solid var(--border2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: 20, fontWeight: 800, color: "var(--text3)", letterSpacing: "-0.02em" }}>{initials}</span>
                )}
                {uploadingAvatar && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>...</span>
                  </div>
                )}
              </div>
            </div>
            <div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                style={{ background: "var(--bg3)", border: "1px solid var(--border2)", color: "var(--text2)", padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", letterSpacing: "0.02em", marginBottom: 6, display: "block" }}
              >
                {uploadingAvatar ? "Uploading..." : "Upload photo"}
              </button>
              <span style={{ fontSize: 12, color: "var(--text4)" }}>JPG, PNG or WebP. Max 5MB.</span>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
            </div>
          </div>

          {/* Name + business */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            <div>
              <label style={labelStyle}>Full name</label>
              <input style={inputStyle} value={profile.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="Jane Smith" />
            </div>
            <div>
              <label style={labelStyle}>Business name</label>
              <input style={inputStyle} value={profile.business_name} onChange={(e) => set("business_name", e.target.value)} placeholder="Acme Studio" />
            </div>
          </div>

          {/* Email readonly */}
          <div>
            <label style={labelStyle}>Email</label>
            <input style={{ ...inputStyle, background: "var(--bg2)", color: "var(--text4)", cursor: "not-allowed" }} value={email} disabled />
          </div>
        </div>

        {/* ── Section: Proposal Defaults ── */}
        <div style={{ marginBottom: 56 }}>
          <SectionHeader title="Proposal Defaults" />
          <p style={{ fontSize: 14, color: "var(--text3)", margin: "-12px 0 28px", lineHeight: 1.7 }}>
            These values are used as starting points when generating proposals. You can override them per project.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            <div>
              <label style={labelStyle}>Default hourly rate</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--text4)", pointerEvents: "none" }}>$</span>
                <input
                  style={{ ...inputStyle, paddingLeft: 28 }}
                  type="number"
                  min="0"
                  step="5"
                  value={profile.default_hourly_rate}
                  onChange={(e) => set("default_hourly_rate", e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="150"
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Default revision rounds</label>
              <input
                style={inputStyle}
                type="number"
                min="0"
                max="99"
                value={profile.default_revision_rounds}
                onChange={(e) => set("default_revision_rounds", e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="2"
              />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Default payment terms</label>
            <input
              style={inputStyle}
              value={profile.default_payment_terms}
              onChange={(e) => set("default_payment_terms", e.target.value)}
              placeholder="e.g. 50% upfront, 50% on delivery"
            />
          </div>

          <div>
            <label style={labelStyle}>Default proposal format</label>
            <select
              value={profile.default_proposal_format}
              onChange={(e) => set("default_proposal_format", e.target.value)}
              style={{ ...inputStyle, cursor: "pointer", appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23808080' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 16px center" }}
            >
              {FORMAT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Save button + feedback */}
        {formError && (
          <div style={{ background: "var(--err-bg)", border: "1px solid var(--err-bdr)", padding: "12px 16px", fontSize: 14, color: "var(--err-text)", marginBottom: 20 }}>
            {formError}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 56 }}>
          <button
            onClick={saveProfile}
            disabled={saving || uploadingAvatar}
            style={{
              background: saveStatus === "saved" ? "var(--ok-bg)" : "var(--accent)",
              color: saveStatus === "saved" ? "var(--ok-text)" : "var(--accent-text)",
              border: saveStatus === "saved" ? "1px solid var(--ok-bdr)" : "none",
              padding: "13px 28px",
              fontSize: 14,
              fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
              letterSpacing: "0.02em",
              transition: "background 0.2s, color 0.2s",
            }}
          >
            {saving ? "Saving..." : saveStatus === "saved" ? "Saved ✓" : "Save changes"}
          </button>
          {saveStatus === "error" && (
            <span style={{ fontSize: 13, color: "var(--err-text)" }}>Failed to save. Try again.</span>
          )}
        </div>

        {/* ── Section: Danger zone ── */}
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 40 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#ef4444", margin: "0 0 12px" }}>Danger zone</p>
          <p style={{ fontSize: 14, color: "var(--text3)", margin: "0 0 20px", lineHeight: 1.7 }}>
            Permanently delete your account and all associated projects. This cannot be undone.
          </p>
          {!showDelete ? (
            <button
              onClick={() => setShowDelete(true)}
              style={{ background: "none", border: "1px solid #ef4444", color: "#ef4444", padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
            >
              Delete account
            </button>
          ) : (
            <div style={{ background: "var(--err-bg)", border: "1px solid var(--err-bdr)", padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16, maxWidth: 440 }}>
              <p style={{ fontSize: 14, color: "var(--err-text)", margin: 0, lineHeight: 1.6 }}>
                Type <strong>delete</strong> to confirm permanent deletion of your account and all data.
              </p>
              <input
                style={{ ...inputStyle, border: "1px solid var(--err-bdr)" }}
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="delete"
              />
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={deleteAccount}
                  disabled={deleteConfirm !== "delete" || deletingAccount}
                  style={{
                    background: deleteConfirm === "delete" ? "#ef4444" : "var(--bg3)",
                    color: deleteConfirm === "delete" ? "#fff" : "var(--text4)",
                    border: "none",
                    padding: "10px 20px",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: deleteConfirm === "delete" ? "pointer" : "not-allowed",
                    transition: "background 0.15s, color 0.15s",
                  }}
                >
                  {deletingAccount ? "Deleting..." : "Confirm delete"}
                </button>
                <button
                  onClick={() => { setShowDelete(false); setDeleteConfirm(""); }}
                  style={{ background: "none", border: "1px solid var(--border)", color: "var(--text3)", padding: "10px 20px", fontSize: 14, cursor: "pointer" }}
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
