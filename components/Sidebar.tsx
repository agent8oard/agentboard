"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import DarkModeToggle from "./DarkModeToggle";

interface DevSession {
  sessionId: string;
  label: string;
}

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [devSession, setDevSession] = useState<DevSession | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const init = async () => {
      // Use getUser() (not getSession()) for authoritative server-verified check
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Real authenticated user — clear any stale dev session
        setEmail(user.email || "");
        localStorage.removeItem("dev_session");
        document.cookie = "dev_session=; path=/; max-age=0; SameSite=Lax";
        supabase.from("profiles").select("full_name").eq("id", user.id).single().then(({ data: p }) => {
          setFullName(p?.full_name || "");
        });
      } else {
        // No real user — check for dev session in localStorage
        try {
          const stored = localStorage.getItem("dev_session");
          if (stored) {
            const parsed = JSON.parse(stored) as DevSession;
            if (parsed.sessionId && parsed.label) setDevSession(parsed);
          }
        } catch { /* ignore */ }
      }

      setAuthChecked(true);
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  function exitDevMode() {
    localStorage.removeItem("dev_session");
    document.cookie = "dev_session=; path=/; max-age=0";
    window.location.href = "/";
  }

  // Password-only dev users have no Supabase auth session — email stays empty
  const showDevMode = authChecked && devSession !== null && email === "";
  // @scopeapp.internal accounts are real Supabase users with a special email domain
  const isDevAccount = authChecked && email.endsWith("@scopeapp.internal");

  const nav = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Projects", href: "/scope" },
    { label: "Settings", href: "/settings" },
  ];

  return (
    <aside style={{ width: 220, minHeight: "100vh", background: "var(--surface)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
      <div style={{ padding: "28px 24px", borderBottom: "1px solid var(--border)" }}>
        <span style={{ fontWeight: 800, fontSize: 18, color: "var(--text)", letterSpacing: "-0.03em" }}>Scope</span>
      </div>
      <nav style={{ flex: 1, padding: "24px 0" }}>
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <a
              key={item.href}
              href={item.href}
              style={{
                display: "block",
                padding: "10px 24px",
                fontSize: 14,
                fontWeight: active ? 700 : 400,
                color: active ? "var(--text)" : "var(--text3)",
                background: "transparent",
                borderLeft: active ? "3px solid var(--text)" : "3px solid transparent",
                letterSpacing: active ? "-0.01em" : "normal",
              }}
            >
              {item.label}
            </a>
          );
        })}
      </nav>

      {showDevMode ? (
        <div style={{ padding: "20px 24px", borderTop: "1px solid var(--border)" }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span style={{ background: "#c8f135", color: "#000", fontSize: 9, fontWeight: 700, padding: "2px 6px", letterSpacing: "0.08em" }}>DEV MODE</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em" }}>{devSession!.label}</div>
          </div>
          <DarkModeToggle />
          <button
            onClick={exitDevMode}
            style={{ background: "none", border: "1px solid var(--border)", padding: "8px 14px", fontSize: 13, color: "var(--text3)", cursor: "pointer", width: "100%", marginTop: 8, fontWeight: 500, letterSpacing: "0.01em" }}
          >
            Exit dev mode
          </button>
        </div>
      ) : (
        <div style={{ padding: "20px 24px", borderTop: "1px solid var(--border)" }}>
          <div style={{ marginBottom: 12 }}>
            {isDevAccount && (
              <span style={{ background: "#c8f135", color: "#000", fontSize: 9, fontWeight: 700, padding: "2px 6px", letterSpacing: "0.08em", display: "inline-block", marginBottom: 6 }}>DEV</span>
            )}
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "-0.01em" }}>
              {fullName}
            </div>
            <div style={{ fontSize: 11, color: "var(--text4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "0.02em" }}>{email}</div>
          </div>
          <DarkModeToggle />
          <button
            onClick={signOut}
            style={{ background: "none", border: "1px solid var(--border)", padding: "8px 14px", fontSize: 13, color: "var(--text3)", cursor: "pointer", width: "100%", marginTop: 8, fontWeight: 500, letterSpacing: "0.01em" }}
          >
            Sign out
          </button>
        </div>
      )}
    </aside>
  );
}
