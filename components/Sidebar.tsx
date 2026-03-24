"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import DarkModeToggle from "./DarkModeToggle";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [isDeveloper, setIsDeveloper] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Dev mode — cookie-only, no DB check
    if (localStorage.getItem("dev_mode") === "true") {
      setFullName("Developer");
      setIsDeveloper(true);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const u = data.session?.user;
      if (!u) return;
      setEmail(u.email || "");
      supabase.from("profiles").select("full_name").eq("id", u.id).single().then(({ data: p }) => {
        if (mounted && p) {
          setFullName(p.full_name || "");
        }
      });
    });
    return () => { mounted = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/");
  }

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
      <div style={{ padding: "20px 24px", borderTop: "1px solid var(--border)" }}>
        <div style={{ marginBottom: 12 }}>
          {fullName ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "-0.01em" }}>{fullName}</div>
                {isDeveloper && (
                  <span style={{ background: "#c8f135", color: "#000", fontSize: 10, fontWeight: 700, padding: "2px 6px", letterSpacing: "0.04em", flexShrink: 0 }}>DEV</span>
                )}
              </div>
              <div style={{ fontSize: 11, color: "var(--text4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "0.02em" }}>{email}</div>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ fontSize: 11, color: "var(--text4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "0.02em" }}>{email}</div>
              {isDeveloper && (
                <span style={{ background: "#c8f135", color: "#000", fontSize: 10, fontWeight: 700, padding: "2px 6px", letterSpacing: "0.04em", flexShrink: 0 }}>DEV</span>
              )}
            </div>
          )}
        </div>
        <DarkModeToggle />
        <button
          onClick={signOut}
          style={{ background: "none", border: "1px solid var(--border)", padding: "8px 14px", fontSize: 13, color: "var(--text3)", cursor: "pointer", width: "100%", marginTop: 8, fontWeight: 500, letterSpacing: "0.01em" }}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
