"use client";
import { useState, useEffect, useRef } from "react";

const TABS = ["Paste enquiry", "AI analysis", "Clarify & scope", "Proposal output", "Key points"];
const CLIENT_BRIEF =
  "Hi, I need a website for my design studio. Something clean and modern with a portfolio section, about page, and contact form. We have some branding already. Need it done in about 6 weeks, budget is around $3,500. Let me know if you can help!";

/* ─────────────────────────────── Main showcase ─────────────────────────── */
export default function ProductShowcase() {
  const [tab, setTab] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);

  const tabRef = useRef(0);
  const transitionRef = useRef(false);

  function switchTo(newTab: number) {
    if (transitionRef.current || newTab === tabRef.current) return;

    transitionRef.current = true;
    setExiting(true);

    setTimeout(() => {
      tabRef.current = newTab;
      setTab(newTab);
      setAnimKey((k) => k + 1);
      setExiting(false);
      transitionRef.current = false;
    }, 200);
  }

  /* Blinking cursor */
  useEffect(() => {
    const id = setInterval(() => setShowCursor((c) => !c), 530);
    return () => clearInterval(id);
  }, []);

  /* Typing animation for tab 0 */
  useEffect(() => {
    if (tab !== 0) {
      setTypedText("");
      return;
    }
    setTypedText("");
    let i = 0;
    let intervalId: ReturnType<typeof setInterval>;
    const timeoutId = setTimeout(() => {
      intervalId = setInterval(() => {
        i++;
        setTypedText(CLIENT_BRIEF.slice(0, i));
        if (i >= CLIENT_BRIEF.length) clearInterval(intervalId);
      }, 16);
    }, 350);
    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [tab, animKey]);

  return (
    <section style={{ padding: "128px 0", background: "#000" }}>
      <style>{`
        @keyframes tab-enter {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes sc-stagger-in {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes sc-slide-left {
          from { opacity: 0; transform: translateX(-24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes sc-fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes sc-slide-right {
          from { opacity: 0; transform: translateX(30px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes sc-highlight {
          from { background-color: transparent; color: rgba(255,255,255,0.55); }
          to   { background-color: #fef9c3; color: #000; }
        }
        .sc-content  { animation: tab-enter 0.3s ease forwards; min-height: 440px; }
        .sc-stagger  { animation: sc-stagger-in 0.4s ease forwards; opacity: 0; }
        .sc-slide-q  { animation: sc-slide-left 0.35s ease forwards; opacity: 0; }
        .sc-fade-up  { animation: sc-fade-up 0.4s ease forwards; opacity: 0; }
        .sc-slide-r  { animation: sc-slide-right 0.4s ease forwards; opacity: 0; }
        .sc-hl       { animation: sc-highlight 0.6s ease 0.4s forwards; background-color: transparent; color: rgba(255,255,255,0.55); padding: 2px 0; font-weight: 600; }
        .sc-popup    { animation: sc-slide-right 0.3s ease 0.7s forwards; opacity: 0; }

        @media (max-width: 860px) {
          .sc-tabs     { flex-wrap: wrap !important; }
          .sc-doc-row  { flex-direction: column !important; }
          .sc-kp-row   { flex-direction: column !important; }
          .sc-proof    { flex-direction: column !important; gap: 12px !important; }
          .sc-proof > div { border-right: none !important; padding-bottom: 12px; border-bottom: 1px solid #1f1f1f; }
        }
      `}</style>

      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "0 56px" }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 56 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#c8f135", margin: "0 0 20px" }}>
            PRODUCT TOUR
          </p>
          <h2 style={{ fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 800, letterSpacing: "-0.03em", color: "#fff", margin: "0 0 16px", lineHeight: 1.05 }}>
            Everything you need to scope<br />with confidence
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.38)", margin: 0, lineHeight: 1.65 }}>
            See how Scope turns a messy client brief into a professional proposal in minutes
          </p>
        </div>

        {/* ── Tab switcher ── */}
        <div className="sc-tabs" style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {TABS.map((label, i) => (
            <button
              key={i}
              onClick={() => switchTo(i)}
              style={{
                padding: "8px 20px",
                fontSize: 13,
                fontWeight: tab === i ? 700 : 500,
                color: tab === i ? "#000" : "rgba(255,255,255,0.4)",
                background: tab === i ? "#c8f135" : "#111",
                border: `1px solid ${tab === i ? "#c8f135" : "#2a2a2a"}`,
                cursor: "pointer",
                transition: "all 0.2s ease",
                fontFamily: "inherit",
                letterSpacing: "0.01em",
                transform: tab === i ? "scale(1.02)" : "scale(1)",
              }}
              onMouseEnter={(e) => { if (tab !== i) (e.currentTarget as HTMLButtonElement).style.background = "#1a1a1a"; }}
              onMouseLeave={(e) => { if (tab !== i) (e.currentTarget as HTMLButtonElement).style.background = "#111"; }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Showcase card ── */}
        <div style={{ background: "#0a0a0a", border: "1px solid #1f1f1f", overflow: "hidden", position: "relative" }}>
          <div
            key={animKey}
            className="sc-content"
            style={
              exiting
                ? { opacity: 0, transform: "translateX(-20px)", transition: "opacity 0.2s, transform 0.2s", animation: "none", minHeight: 440 }
                : {}
            }
          >
            {tab === 0 && <Tab0 typedText={typedText} showCursor={showCursor} />}
            {tab === 1 && <Tab1 animKey={animKey} />}
            {tab === 2 && <Tab2 animKey={animKey} />}
            {tab === 3 && <Tab3 animKey={animKey} />}
            {tab === 4 && <Tab4 animKey={animKey} />}
          </div>

        </div>

        {/* ── Social proof ── */}
        <div className="sc-proof" style={{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: 32 }}>
          {[
            "Built for freelancers & agencies",
            "AI-powered scope generation",
            "Export-ready proposals",
          ].map((text, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "0 28px",
                borderRight: i < 2 ? "1px solid #1f1f1f" : "none",
              }}
            >
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#c8f135", flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.28)", fontWeight: 500, letterSpacing: "0.02em" }}>
                {text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── Tab 0 — Paste enquiry ─────────────────────── */
function Tab0({ typedText, showCursor }: { typedText: string; showCursor: boolean }) {
  return (
    <div style={{ padding: "48px 56px" }}>
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", margin: "0 0 10px" }}>
          New project
        </p>
        <h3 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
          Paste client enquiry
        </h3>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.28)", margin: 0 }}>
          Drop in the email, message, or brief exactly as received
        </p>
      </div>

      <div style={{ position: "relative", marginBottom: 14 }}>
        <div
          style={{
            width: "100%",
            minHeight: 190,
            background: "#111",
            border: "1px solid #262626",
            padding: "16px 20px 36px",
            fontSize: 14,
            color: "rgba(255,255,255,0.78)",
            lineHeight: 1.8,
            boxSizing: "border-box",
            fontFamily: "inherit",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {typedText}
          <span
            style={{
              display: "inline-block",
              width: 2,
              height: "1.1em",
              background: "#c8f135",
              marginLeft: 1,
              verticalAlign: "text-bottom",
              opacity: showCursor ? 1 : 0,
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 10,
            right: 16,
            fontSize: 11,
            color: "rgba(255,255,255,0.18)",
            fontWeight: 500,
          }}
        >
          {typedText.length} / 10000
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          style={{
            background: "#c8f135",
            color: "#000",
            border: "none",
            padding: "12px 28px",
            fontSize: 14,
            fontWeight: 700,
            cursor: "default",
            letterSpacing: "0.01em",
            fontFamily: "inherit",
          }}
        >
          Analyse enquiry →
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────── Tab 1 — AI analysis ───────────────────────── */
function Tab1({ animKey }: { animKey: number }) {
  return (
    <div style={{ padding: "48px 56px" }}>
      <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>

        {/* Left */}
        <div style={{ flex: 1, minWidth: 260 }}>
          <p key={`al-${animKey}`} className="sc-stagger" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", margin: "0 0 16px", animationDelay: "0s" }}>
            Analysis
          </p>
          <div key={`ac-${animKey}`} className="sc-stagger" style={{ marginBottom: 24, animationDelay: "0.06s" }}>
            <span style={{ background: "#c8f135", color: "#000", fontSize: 12, fontWeight: 700, padding: "4px 12px", letterSpacing: "0.04em" }}>
              Website Design
            </span>
          </div>
          <div key={`ag-${animKey}`} className="sc-stagger" style={{ marginBottom: 22, animationDelay: "0.12s" }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", margin: "0 0 10px" }}>Goals</p>
            {[
              "Establish online presence for design studio",
              "Showcase portfolio to attract new clients",
              "Enable direct contact from potential clients",
            ].map((g, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 7, alignItems: "flex-start" }}>
                <span style={{ color: "#c8f135", flexShrink: 0, marginTop: 3 }}>•</span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.55 }}>{g}</span>
              </div>
            ))}
          </div>
          <div key={`af-${animKey}`} className="sc-stagger" style={{ marginBottom: 22, animationDelay: "0.18s" }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", margin: "0 0 10px" }}>Features requested</p>
            {[
              "Portfolio gallery with project showcase",
              "About page with studio background",
              "Contact form with email delivery",
            ].map((f, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 7, alignItems: "flex-start" }}>
                <span style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0 }}>—</span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.55 }}>{f}</span>
              </div>
            ))}
          </div>
          <div key={`aw-${animKey}`} className="sc-stagger" style={{ display: "flex", gap: 8, flexWrap: "wrap", animationDelay: "0.24s" }}>
            {["Timeline not specific", "Budget may be tight"].map((w) => (
              <span key={w} style={{ background: "rgba(245,158,11,0.08)", color: "#f59e0b", fontSize: 11, fontWeight: 600, padding: "4px 10px", border: "1px solid rgba(245,158,11,0.2)", letterSpacing: "0.02em" }}>
                ⚠ {w}
              </span>
            ))}
          </div>
        </div>

        {/* Right — risk flags */}
        <div style={{ width: 228, flexShrink: 0 }}>
          <p key={`rl-${animKey}`} className="sc-stagger" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", margin: "0 0 14px", animationDelay: "0.08s" }}>
            Risk Flags
          </p>
          {[
            { title: "Scope definition", desc: "Portfolio requirements not detailed" },
            { title: "Timeline pressure", desc: "6 weeks is tight for full website" },
            { title: "Budget scope gap", desc: "$3,500 may not cover full spec" },
          ].map((risk, i) => (
            <div
              key={`${risk.title}-${animKey}`}
              className="sc-stagger"
              style={{
                background: "rgba(245,158,11,0.05)",
                border: "1px solid rgba(245,158,11,0.15)",
                padding: "12px 14px",
                marginBottom: 8,
                animationDelay: `${0.28 + i * 0.08}s`,
              }}
            >
              <p style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b", margin: "0 0 4px" }}>{risk.title}</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.32)", margin: 0, lineHeight: 1.55 }}>{risk.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Tab 2 — Clarify & scope ───────────────────── */
const QUESTIONS = [
  {
    n: "01",
    q: "How many portfolio projects do you want to feature, and do they need filtering by category?",
    answer: "About 12 projects, yes — filtering by type would be great",
  },
  {
    n: "02",
    q: "Does the contact form need to integrate with any existing CRM or email platform?",
    answer: "",
  },
  {
    n: "03",
    q: "Will you need ongoing CMS access to update portfolio items yourself after launch?",
    answer: "",
  },
];

function Tab2({ animKey }: { animKey: number }) {
  return (
    <div style={{ padding: "48px 56px" }}>
      <div style={{ maxWidth: 680 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", margin: "0 0 24px" }}>
          Clarifying questions
        </p>
        {QUESTIONS.map((q, i) => (
          <div
            key={`q${i}-${animKey}`}
            className="sc-slide-q"
            style={{
              marginBottom: 14,
              background: "#111",
              border: "1px solid #1f1f1f",
              padding: "20px 24px",
              animationDelay: `${i * 0.1}s`,
            }}
          >
            <p style={{ fontSize: 10, fontWeight: 700, color: "#c8f135", letterSpacing: "0.1em", margin: "0 0 8px" }}>{q.n}</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#fff", margin: "0 0 14px", letterSpacing: "-0.01em", lineHeight: 1.55 }}>{q.q}</p>
            <div
              style={{
                width: "100%",
                background: "#0a0a0a",
                border: `1px solid ${q.answer ? "#333" : "#1a1a1a"}`,
                padding: "10px 14px",
                fontSize: 13,
                color: q.answer ? "rgba(255,255,255,0.68)" : "rgba(255,255,255,0.18)",
                lineHeight: 1.5,
                boxSizing: "border-box" as const,
              }}
            >
              {q.answer || "Type your answer…"}
            </div>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <button
            style={{
              background: "#c8f135",
              color: "#000",
              border: "none",
              padding: "12px 28px",
              fontSize: 14,
              fontWeight: 700,
              cursor: "default",
              letterSpacing: "0.01em",
              fontFamily: "inherit",
            }}
          >
            Build scope →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Tab 3 — Proposal output ───────────────────── */
function Tab3({ animKey }: { animKey: number }) {
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  return (
    <div style={{ padding: "48px 56px" }}>
      <div className="sc-doc-row" style={{ display: "flex", gap: 28 }}>

        {/* Document */}
        <div
          key={`doc-${animKey}`}
          className="sc-fade-up"
          style={{ flex: 1, background: "#0d0d0d", border: "1px solid #1f1f1f", padding: "28px 32px" }}
        >
          <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid #1a1a1a" }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", margin: "0 0 8px" }}>Project Proposal</p>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: "0 0 6px", letterSpacing: "-0.02em" }}>Website Design Project</h3>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.28)", margin: 0 }}>Prepared {today}</p>
          </div>
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", margin: "0 0 11px" }}>Scope of Work</p>
            {["5-page responsive website design", "Portfolio gallery with category filtering", "Custom contact form with email delivery", "Mobile-first development"].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 7, alignItems: "flex-start" }}>
                <span style={{ color: "#c8f135", fontWeight: 700, fontSize: 11, flexShrink: 0, marginTop: 2 }}>✓</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{item}</span>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", margin: "0 0 11px" }}>Deliverables</p>
            {["Figma design files (all pages & components)", "Production-ready code repository", "CMS setup and 1-hour training session"].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 7 }}>
                <span style={{ color: "rgba(255,255,255,0.22)", fontSize: 12, flexShrink: 0 }}>{i + 1}.</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{item}</span>
              </div>
            ))}
          </div>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", margin: "0 0 11px" }}>Timeline</p>
            <div style={{ border: "1px solid #1a1a1a" }}>
              {[
                { phase: "Design & wireframes", duration: "Weeks 1–2" },
                { phase: "Development", duration: "Weeks 3–5" },
                { phase: "Review & launch", duration: "Week 6" },
              ].map((row, i) => (
                <div key={i} style={{ display: "flex", borderBottom: i < 2 ? "1px solid #1a1a1a" : "none" }}>
                  <div style={{ flex: 1, padding: "9px 13px", fontSize: 12, color: "rgba(255,255,255,0.48)", borderRight: "1px solid #1a1a1a" }}>{row.phase}</div>
                  <div style={{ padding: "9px 13px", fontSize: 12, color: "rgba(255,255,255,0.28)", width: 96, flexShrink: 0 }}>{row.duration}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Key points panel */}
        <div
          key={`kpp-${animKey}`}
          className="sc-stagger"
          style={{ width: 210, flexShrink: 0, animationDelay: "0.22s" }}
        >
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", margin: "0 0 14px" }}>Key Points</p>
          <div style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)", padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
              <span style={{ background: "#f59e0b", color: "#000", width: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>1</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", letterSpacing: "0.06em", textTransform: "uppercase" }}>Payment Terms</span>
            </div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.42)", margin: "0 0 9px", lineHeight: 1.55, fontStyle: "italic" }}>
              &ldquo;50% upfront, 50% on delivery&rdquo;
            </p>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", margin: "0 0 5px" }}>Why it matters</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0, lineHeight: 1.6 }}>
              Protects against non-payment after final delivery
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Tab 4 — Key points ────────────────────────── */
function Tab4({ animKey }: { animKey: number }) {
  return (
    <div style={{ padding: "48px 56px" }}>
      <div className="sc-kp-row" style={{ display: "flex", gap: 28 }}>

        {/* Proposal text with highlight */}
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", margin: "0 0 14px" }}>
            Proposal document
          </p>
          <div style={{ background: "#0d0d0d", border: "1px solid #1f1f1f", padding: "24px 28px", fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.9 }}>
            <p style={{ margin: "0 0 16px" }}>
              This proposal outlines the scope, deliverables, and timeline for the Website Design Project. All work will be completed within the agreed 6-week timeframe.
            </p>
            <p style={{ margin: "0 0 16px", position: "relative" }}>
              {/* Popup */}
              <span
                key={`popup-${animKey}`}
                className="sc-popup"
                style={{
                  position: "absolute",
                  top: -36,
                  left: "8%",
                  background: "#1e1e1e",
                  border: "1px solid #333",
                  padding: "6px 12px",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#fff",
                  whiteSpace: "nowrap",
                  letterSpacing: "0.02em",
                }}
              >
                + Add key point
              </span>
              Payment is due as follows:{" "}
              <mark
                key={`hl-${animKey}`}
                className="sc-hl"
              >
                50% of the total project fee is required upfront prior to commencement of work.
              </mark>{" "}
              The remaining balance is due upon final delivery and client approval.
            </p>
            <p style={{ margin: 0 }}>
              Revisions are limited to two rounds per deliverable. Additional revision rounds will be scoped and quoted separately before any work commences.
            </p>
          </div>
        </div>

        {/* Key point card */}
        <div
          key={`kpc-${animKey}`}
          className="sc-slide-r"
          style={{ width: 236, flexShrink: 0, animationDelay: "0.3s" }}
        >
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", margin: "0 0 14px" }}>
            Key Point
          </p>
          <div style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)", padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ background: "#f59e0b", color: "#000", width: 20, height: 20, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>1</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b" }}>Payment Terms</span>
            </div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.42)", margin: "0 0 11px", lineHeight: 1.55, fontStyle: "italic" }}>
              &ldquo;50% of the total project fee is required upfront…&rdquo;
            </p>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", margin: "0 0 5px" }}>
              Why it matters
            </p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", margin: 0, lineHeight: 1.65 }}>
              Upfront payment protects you from non-payment risk and covers your initial time investment before work begins.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
