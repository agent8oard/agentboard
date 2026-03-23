"use client";
import { useState, useEffect, useRef } from "react";

const MARQUEE = "SCOPE · PROPOSAL · CLARITY · FREELANCE · PROTECT YOUR WORK · ".repeat(5);

export default function HomePage() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: -100, y: -100 });
  const ring = useRef({ x: -100, y: -100 });
  const hovering = useRef(false);
  const raf = useRef<number>(0);
  const [scrolled, setScrolled] = useState(false);

  // Custom cursor
  useEffect(() => {
    const move = (e: MouseEvent) => { mouse.current = { x: e.clientX, y: e.clientY }; };
    const enter = (e: MouseEvent) => { if ((e.target as HTMLElement).closest("a,button")) hovering.current = true; };
    const leave = (e: MouseEvent) => { if ((e.target as HTMLElement).closest("a,button")) hovering.current = false; };

    const tick = () => {
      ring.current.x += (mouse.current.x - ring.current.x) * 0.12;
      ring.current.y += (mouse.current.y - ring.current.y) * 0.12;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${mouse.current.x - 4}px,${mouse.current.y - 4}px)`;
      }
      if (ringRef.current) {
        const s = hovering.current ? 60 : 40;
        ringRef.current.style.transform = `translate(${ring.current.x - s / 2}px,${ring.current.y - s / 2}px)`;
        ringRef.current.style.width = `${s}px`;
        ringRef.current.style.height = `${s}px`;
        ringRef.current.style.background = hovering.current ? "rgba(255,255,255,0.08)" : "transparent";
      }
      raf.current = requestAnimationFrame(tick);
    };

    document.addEventListener("mousemove", move);
    document.addEventListener("mouseover", enter);
    document.addEventListener("mouseout", leave);
    raf.current = requestAnimationFrame(tick);

    return () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseover", enter);
      document.removeEventListener("mouseout", leave);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  // Nav scroll state
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll reveal via IntersectionObserver
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          const el = e.target as HTMLElement;
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
          obs.unobserve(el);
        }
      }),
      { threshold: 0.1 }
    );
    document.querySelectorAll(".reveal").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div style={{ background: "#000", color: "#fff", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", overflowX: "hidden" }}>
      <style>{`
        * { cursor: none !important; }
        .reveal {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .d1 { transition-delay: 0.1s; }
        .d2 { transition-delay: 0.2s; }
        .d3 { transition-delay: 0.3s; }
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-100%); }
        }
        @keyframes grain {
          0%,100% { transform: translate(0,0); }
          20%     { transform: translate(-3%,-4%); }
          40%     { transform: translate(4%,2%); }
          60%     { transform: translate(-2%,5%); }
          80%     { transform: translate(3%,-3%); }
        }
        .grain-el {
          position: absolute;
          inset: -20%;
          width: 140%;
          height: 140%;
          opacity: 0.045;
          pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E");
          animation: grain 8s steps(8) infinite;
        }
        .nl { position: relative; }
        .nl::after {
          content: '';
          position: absolute;
          bottom: -2px; left: 0;
          width: 0; height: 1px;
          background: rgba(255,255,255,0.5);
          transition: width 0.3s ease;
        }
        .nl:hover::after { width: 100%; }
        .fi { border-top: 1px solid #1a1a1a; padding: 56px 0; }
        .stat-card { transition: border-color 0.3s ease; }
        .stat-card:hover { border-color: #c8f135 !important; }
        @media (max-width: 768px) {
          .hero-pad { padding: 100px 24px 0 !important; }
          .section-pad { padding: 80px 24px !important; }
          .nav-pad { padding: 20px 24px !important; }
          .fi-grid { grid-template-columns: 1fr !important; }
          .stat-grid { grid-template-columns: 1fr !important; }
          .stat-card { border-left: 1px solid #222 !important; }
        }
      `}</style>

      {/* Custom cursor — dot */}
      <div
        ref={dotRef}
        style={{ position: "fixed", top: 0, left: 0, width: 8, height: 8, background: "#fff", borderRadius: "50%", pointerEvents: "none", zIndex: 9999, willChange: "transform" }}
      />
      {/* Custom cursor — ring */}
      <div
        ref={ringRef}
        style={{ position: "fixed", top: 0, left: 0, width: 40, height: 40, border: "1px solid rgba(255,255,255,0.35)", borderRadius: "50%", pointerEvents: "none", zIndex: 9998, willChange: "transform", transition: "width 0.2s ease, height 0.2s ease, background 0.2s ease" }}
      />

      {/* Fixed Nav */}
      <nav
        className="nav-pad"
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "22px 48px",
          transition: "background 0.3s ease, border-color 0.3s ease, backdrop-filter 0.3s ease",
          background: scrolled ? "rgba(0,0,0,0.88)" : "transparent",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(16px)" : "none",
          borderBottom: `1px solid ${scrolled ? "#1a1a1a" : "transparent"}`,
        }}
      >
        <a href="/" style={{ fontWeight: 800, fontSize: 18, color: "#fff", letterSpacing: "-0.02em" }}>Scope</a>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <a href="/auth" className="nl" style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Sign in</a>
          <a href="/auth" style={{ background: "#c8f135", color: "#000", padding: "9px 20px", fontSize: 14, fontWeight: 700, letterSpacing: "0.02em" }}>
            Get started →
          </a>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section
        className="hero-pad"
        style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "120px 48px 0", position: "relative", overflow: "hidden" }}
      >
        <div className="grain-el" />

        <div style={{ maxWidth: 1100, position: "relative", zIndex: 1 }}>
          <p className="reveal" style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#c8f135", margin: "0 0 28px" }}>
            Built for freelancers &amp; agencies
          </p>
          <h1 className="reveal d1" style={{ fontSize: "clamp(40px, 7vw, 88px)", fontWeight: 800, lineHeight: 1.0, letterSpacing: "-0.03em", margin: "0 0 28px", color: "#fff" }}>
            Turn client briefs<br />
            <em style={{ fontStyle: "italic", color: "rgba(255,255,255,0.55)" }}>into airtight proposals</em>
          </h1>
          <p className="reveal d2" style={{ fontSize: 18, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, margin: "0 0 48px", maxWidth: 460 }}>
            Paste any client enquiry. Get a structured scope, risk analysis, and ready-to-send proposal in minutes.
          </p>
          <div className="reveal d3" style={{ display: "flex" }}>
            <a href="/auth" style={{ display: "inline-block", background: "#c8f135", color: "#000", padding: "16px 36px", fontSize: 15, fontWeight: 700, letterSpacing: "0.02em" }}>
              Get started →
            </a>
            <a href="#how" style={{ display: "inline-block", padding: "16px 36px", border: "1px solid rgba(255,255,255,0.15)", borderLeft: "none", fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.55)", letterSpacing: "0.02em" }}>
              Learn more
            </a>
          </div>
        </div>

        {/* Marquee strip */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, overflow: "hidden", borderTop: "1px solid #1a1a1a", borderBottom: "1px solid #1a1a1a" }}>
          <div style={{ display: "flex", padding: "12px 0" }}>
            {[0, 1].map((i) => (
              <div
                key={i}
                style={{ whiteSpace: "nowrap", animation: "marquee 32s linear infinite", flexShrink: 0, fontSize: 12, letterSpacing: "0.1em", color: "rgba(255,255,255,0.22)", paddingRight: 0 }}
              >
                {MARQUEE}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how" className="section-pad" style={{ padding: "120px 48px", background: "#000" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <p className="reveal" style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#c8f135", margin: "0 0 80px" }}>
            HOW IT WORKS
          </p>
          {[
            { n: "01", title: "Paste the enquiry", desc: "Drop in the email, message, or brief exactly as received. No formatting needed." },
            { n: "02", title: "Clarify and scope", desc: "AI extracts goals, flags risks, and asks the right clarifying questions to fill the gaps." },
            { n: "03", title: "Export the proposal", desc: "Get a structured scope, deliverables, timeline, and a contract-ready proposal." },
          ].map((item, i) => (
            <div key={item.n} className={`reveal d${i + 1} fi`} style={{ display: "flex", gap: 48, alignItems: "flex-start" }}>
              <span style={{ fontSize: 96, fontWeight: 800, color: "#171717", lineHeight: 1, letterSpacing: "-0.04em", userSelect: "none", flexShrink: 0, width: 110 }}>
                {item.n}
              </span>
              <div style={{ paddingTop: 8 }}>
                <h3 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 14px", letterSpacing: "-0.02em", color: "#fff" }}>{item.title}</h3>
                <p style={{ fontSize: 16, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, margin: 0, maxWidth: 480 }}>{item.desc}</p>
              </div>
            </div>
          ))}
          <div style={{ borderTop: "1px solid #1a1a1a" }} />
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="section-pad" style={{ padding: "120px 48px", background: "#0a0a0a" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <h2 className="reveal" style={{ fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 800, letterSpacing: "-0.03em", textAlign: "center", margin: "0 0 72px", lineHeight: 1.1, color: "#fff" }}>
            Stop losing money<br />to scope creep
          </h2>
          <div className="stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
            {[
              { stat: "10hrs", desc: "saved per project on average" },
              { stat: "3×", desc: "fewer revision requests from clients" },
              { stat: "100%", desc: "clearer client expectations" },
            ].map((s, i) => (
              <div
                key={s.stat}
                className={`reveal d${i + 1} stat-card`}
                style={{ background: "#111", border: "1px solid #222", borderLeft: i > 0 ? "none" : "1px solid #222", padding: "48px 40px" }}
              >
                <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: "-0.04em", margin: "0 0 12px", color: "#fff", lineHeight: 1 }}>{s.stat}</div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="section-pad" style={{ padding: "100px 48px", background: "#c8f135" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <h2 className="reveal" style={{ fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 800, letterSpacing: "-0.03em", color: "#000", margin: "0 0 44px", lineHeight: 1.1 }}>
            Ready to scope your<br />next project?
          </h2>
          <a className="reveal d1" href="/auth" style={{ display: "inline-block", background: "#000", color: "#fff", padding: "18px 48px", fontSize: 16, fontWeight: 700, letterSpacing: "0.02em" }}>
            Start for free →
          </a>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="nav-pad" style={{ background: "#000", borderTop: "1px solid #1a1a1a", padding: "28px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <a href="/" style={{ fontWeight: 800, fontSize: 16, color: "#fff", letterSpacing: "-0.02em" }}>Scope</a>
        <div style={{ display: "flex", gap: 32 }}>
          <a href="/dashboard" className="nl" style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>Dashboard</a>
          <a href="/auth" className="nl" style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>Sign in</a>
          <a href="/auth" className="nl" style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>Get started</a>
        </div>
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>© 2025 Scope. All rights reserved.</span>
      </footer>
    </div>
  );
}
