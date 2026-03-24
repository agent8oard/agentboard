"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import DevBanner from "./DevBanner";
import { Greeting } from "./Greeting";

export default function DevModeGuard() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("dev_token")) {
      setReady(true);
    } else {
      router.replace("/auth");
    }
  }, [router]);

  if (!ready) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "64px 48px" }}>
        <DevBanner />

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 64, borderBottom: "1px solid var(--border)", paddingBottom: 40 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text4)", margin: "0 0 12px" }}>Dashboard</p>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--text)", margin: 0, letterSpacing: "-0.03em" }}>
              <Greeting name="Developer" />
            </h1>
          </div>
          <Link href="/scope/new" style={{ background: "var(--accent)", color: "var(--accent-text)", padding: "12px 24px", fontSize: 14, fontWeight: 700, display: "inline-block", letterSpacing: "0.02em" }}>
            New project →
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 64, borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
          {[
            { label: "Total projects", value: 0 },
            { label: "In progress", value: 0 },
            { label: "Completed", value: 0 },
          ].map((stat, i) => (
            <div key={stat.label} style={{ padding: "40px 0", borderRight: i < 2 ? "1px solid var(--border)" : "none", paddingLeft: i > 0 ? 40 : 0 }}>
              <div style={{ fontSize: 48, fontWeight: 800, color: "var(--text)", lineHeight: 1, letterSpacing: "-0.04em", marginBottom: 8 }}>{stat.value}</div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text4)" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Recent projects */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text4)", margin: 0 }}>Recent projects</p>
            <Link href="/scope" style={{ fontSize: 13, color: "var(--text3)", fontWeight: 500 }}>View all →</Link>
          </div>
          <div style={{ borderTop: "1px solid var(--border)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 120px 40px", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
              {["Project", "Status", "Date", ""].map((h) => (
                <div key={h} style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text4)" }}>{h}</div>
              ))}
            </div>
            <div style={{ padding: "80px 0", textAlign: "center" }}>
              <p style={{ fontSize: 15, color: "var(--text4)", margin: "0 0 24px" }}>No projects yet.</p>
              <Link href="/scope/new" style={{ background: "var(--accent)", color: "var(--accent-text)", padding: "12px 24px", fontSize: 14, fontWeight: 700, display: "inline-block" }}>
                Create your first project →
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
