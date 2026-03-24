"use client";
import { useState, useEffect } from "react";

const MARQUEE_TEXT = "SCOPE · PROPOSAL · CLARITY · FREELANCE · PROTECT YOUR WORK · ";

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);

  /* ─── Nav blur on scroll ─── */
  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, []);

  /* ─── Scroll-reveal via IntersectionObserver ─── */
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            el.style.opacity   = "1";
            el.style.transform = "translateY(0)";
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll(".rv").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div style={{ background: "#000", color: "#fff", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", overflowX: "hidden" }}>

      {/* ─── Injected styles ─── */}
      <style>{`
        /* Scroll-reveal base state */
        .rv {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.7s cubic-bezier(0.16,1,0.3,1),
                      transform 0.7s cubic-bezier(0.16,1,0.3,1);
        }
        .rv.d1 { transition-delay: 0.08s; }
        .rv.d2 { transition-delay: 0.16s; }
        .rv.d3 { transition-delay: 0.24s; }
        .rv.d4 { transition-delay: 0.32s; }

        /* Animated grain overlay */
        @keyframes grain {
          0%,100% { transform: translate(0,0) }
          10%  { transform: translate(-2%, -3%) }
          20%  { transform: translate(3%, -1%) }
          30%  { transform: translate(-1%, 4%) }
          40%  { transform: translate(4%, -2%) }
          50%  { transform: translate(-3%, 2%) }
          60%  { transform: translate(2%, 4%) }
          70%  { transform: translate(-4%, -1%) }
          80%  { transform: translate(1%, -4%) }
          90%  { transform: translate(3%, 3%) }
        }
        .grain {
          position: absolute;
          inset: -30%;
          width: 160%; height: 160%;
          pointer-events: none;
          opacity: 0.035;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23f)'/%3E%3C/svg%3E");
          animation: grain 10s steps(10) infinite;
        }

        /* Marquee */
        @keyframes scroll-left {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .marquee-track {
          display: flex;
          white-space: nowrap;
          animation: scroll-left 28s linear infinite;
          will-change: transform;
        }

        /* Nav hover underline */
        .nav-link {
          position: relative;
          text-decoration: none;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          left: 0; bottom: -3px;
          height: 1px; width: 0;
          background: #fff;
          transition: width 0.3s ease;
        }
        .nav-link:hover::after { width: 100%; }

        /* Feature row hover */
        .feature-row {
          border-top: 1px solid #181818;
          padding: 60px 0;
          display: flex;
          gap: 56px;
          align-items: flex-start;
          position: relative;
          transition: border-color 0.3s;
        }
        .feature-row:hover { border-color: #333; }

        /* Stat card */
        .stat-card {
          padding: 48px 40px;
          background: #0d0d0d;
          border: 1px solid #1c1c1c;
          transition: border-color 0.3s ease, background 0.3s ease;
        }
        .stat-card:hover {
          border-color: #c8f135;
          background: #111;
        }

        /* CTA button */
        .cta-btn {
          display: inline-block;
          background: #000;
          color: #fff;
          padding: 18px 52px;
          font-size: 16px;
          font-weight: 700;
          letter-spacing: 0.02em;
          transition: background 0.2s, color 0.2s;
          font-family: inherit;
          border: none;
          text-decoration: none;
        }
        .cta-btn:hover { background: #111; }

        @media (max-width: 860px) {
          .hero-inner  { padding: 0 24px !important; }
          .sec-pad     { padding: 80px 24px !important; }
          .nav-inner   { padding: 20px 24px !important; }
          .stat-grid   { grid-template-columns: 1fr !important; }
          .stat-card   { border-left: 1px solid #1c1c1c !important; border-top: none !important; }
          .feature-row { flex-direction: column; gap: 16px !important; }
          .feature-num { font-size: 72px !important; width: auto !important; }
        }
      `}</style>

      {/* ─── NAVIGATION ─── */}
      <nav className="nav-inner" style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "24px 56px",
        background: scrolled ? "rgba(0,0,0,0.9)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: `1px solid ${scrolled ? "#1a1a1a" : "transparent"}`,
        transition: "background 0.4s, border-color 0.4s",
      }}>
        <a href="/" style={{ fontWeight: 800, fontSize: 17, color: "#fff", letterSpacing: "-0.02em", textDecoration: "none" }}>
          Scope
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
          <a href="/auth" className="nav-link" style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>
            Sign in
          </a>
          <a href="/auth" style={{
            background: "#c8f135", color: "#000",
            padding: "10px 22px",
            fontSize: 13, fontWeight: 700,
            letterSpacing: "0.03em",
            textDecoration: "none",
          }}>
            Get started →
          </a>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        background: "#000",
      }}>
        {/* Grain texture */}
        <div className="grain" />

        {/* Radial glow */}
        <div style={{
          position: "absolute",
          top: "20%", left: "50%",
          transform: "translateX(-50%)",
          width: 800, height: 600,
          background: "radial-gradient(ellipse, rgba(200,241,53,0.04) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }} />

        <div className="hero-inner" style={{ padding: "0 56px", position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", width: "100%" }}>
          <p className="rv" style={{
            fontSize: 11, fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#c8f135",
            margin: "0 0 32px",
          }}>
            Built for freelancers &amp; agencies
          </p>

          <h1 className="rv d1" style={{
            fontSize: "clamp(44px, 7.5vw, 92px)",
            fontWeight: 800,
            lineHeight: 0.97,
            letterSpacing: "-0.03em",
            margin: "0 0 32px",
            color: "#fff",
          }}>
            Turn client briefs<br />
            <em style={{ fontStyle: "italic", color: "rgba(255,255,255,0.5)" }}>
              into airtight proposals
            </em>
          </h1>

          <p className="rv d2" style={{
            fontSize: 17,
            color: "rgba(255,255,255,0.42)",
            lineHeight: 1.75,
            margin: "0 0 52px",
            maxWidth: 440,
          }}>
            Paste any client enquiry. Get a structured scope, risk analysis, and a ready-to-send proposal in minutes.
          </p>

          <div className="rv d3" style={{ display: "flex", alignItems: "stretch" }}>
            <a href="/auth" style={{
              display: "inline-flex", alignItems: "center",
              background: "#c8f135", color: "#000",
              padding: "16px 36px",
              fontSize: 15, fontWeight: 700,
              letterSpacing: "0.02em",
              textDecoration: "none",
            }}>
              Get started →
            </a>
            <a href="#how" style={{
              display: "inline-flex", alignItems: "center",
              padding: "16px 36px",
              border: "1px solid rgba(255,255,255,0.12)",
              borderLeft: "none",
              fontSize: 15, fontWeight: 500,
              color: "rgba(255,255,255,0.45)",
              letterSpacing: "0.01em",
              textDecoration: "none",
            }}>
              Learn more
            </a>
          </div>
        </div>

        {/* ─── Marquee strip ─── */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          borderTop: "1px solid #141414",
          overflow: "hidden",
          background: "rgba(0,0,0,0.5)",
        }}>
          <div className="marquee-track" style={{ padding: "14px 0" }}>
            {/* Two copies — when first exits left, second seamlessly replaces it */}
            {[0, 1].map((i) => (
              <span key={i} style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.14em",
                color: "rgba(255,255,255,0.2)",
                paddingRight: 0,
                flexShrink: 0,
              }}>
                {MARQUEE_TEXT.repeat(8)}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how" className="sec-pad" style={{ padding: "128px 56px", background: "#000" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>

          <p className="rv" style={{
            fontSize: 11, fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#c8f135",
            margin: "0 0 88px",
          }}>
            How it works
          </p>

          {[
            {
              n: "01",
              title: "Paste the enquiry",
              desc: "Drop in the email, message, or brief exactly as received. No formatting or editing needed.",
            },
            {
              n: "02",
              title: "Clarify and scope",
              desc: "AI extracts goals, flags risks, and surfaces the right clarifying questions to fill every gap.",
            },
            {
              n: "03",
              title: "Export the proposal",
              desc: "Get a structured scope, deliverables list, timeline, and a contract-ready proposal instantly.",
            },
          ].map((item, i) => (
            <div key={item.n} className={`rv d${i + 1} feature-row`}>
              {/* Ghost number */}
              <span className="feature-num" style={{
                fontSize: 112,
                fontWeight: 800,
                color: "#161616",
                lineHeight: 1,
                letterSpacing: "-0.05em",
                userSelect: "none",
                flexShrink: 0,
                width: 130,
                display: "block",
              }}>
                {item.n}
              </span>

              <div style={{ paddingTop: 10, flex: 1 }}>
                <h3 style={{
                  fontSize: 30,
                  fontWeight: 700,
                  margin: "0 0 14px",
                  letterSpacing: "-0.025em",
                  color: "#fff",
                  lineHeight: 1.1,
                }}>
                  {item.title}
                </h3>
                <p style={{
                  fontSize: 16,
                  color: "rgba(255,255,255,0.4)",
                  lineHeight: 1.75,
                  margin: 0,
                  maxWidth: 500,
                }}>
                  {item.desc}
                </p>
              </div>

              {/* Step indicator */}
              <div style={{
                flexShrink: 0,
                paddingTop: 14,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.1em",
                color: "rgba(255,255,255,0.15)",
                textTransform: "uppercase",
              }}>
                Step {i + 1}
              </div>
            </div>
          ))}

          {/* Closing line */}
          <div style={{ borderTop: "1px solid #181818" }} />
        </div>
      </section>

      {/* ─── WHY IT MATTERS ─── */}
      <section className="sec-pad" style={{ padding: "128px 56px", background: "#050505" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>

          <h2 className="rv" style={{
            fontSize: "clamp(34px, 5.5vw, 60px)",
            fontWeight: 800,
            letterSpacing: "-0.035em",
            textAlign: "center",
            margin: "0 0 80px",
            lineHeight: 1.05,
            color: "#fff",
          }}>
            Stop losing money<br />
            <span style={{ color: "rgba(255,255,255,0.35)" }}>to scope creep</span>
          </h2>

          <div className="stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
            {[
              { stat: "10hrs",  desc: "saved per project on average" },
              { stat: "3×",     desc: "fewer revision requests from clients" },
              { stat: "100%",   desc: "clearer expectations from day one" },
            ].map((s, i) => (
              <div
                key={s.stat}
                className={`rv d${i + 1} stat-card`}
                style={{
                  borderLeft: i > 0 ? "none" : "1px solid #1c1c1c",
                }}
              >
                <div style={{
                  fontSize: 56,
                  fontWeight: 800,
                  letterSpacing: "-0.045em",
                  margin: "0 0 14px",
                  color: "#fff",
                  lineHeight: 1,
                }}>
                  {s.stat}
                </div>
                <div style={{
                  fontSize: 14,
                  color: "rgba(255,255,255,0.38)",
                  lineHeight: 1.65,
                }}>
                  {s.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="sec-pad" style={{
        padding: "112px 56px",
        background: "#c8f135",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Subtle dot grid on CTA */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.08) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          pointerEvents: "none",
        }} />

        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
          <h2 className="rv" style={{
            fontSize: "clamp(34px, 5.5vw, 60px)",
            fontWeight: 800,
            letterSpacing: "-0.035em",
            color: "#000",
            margin: "0 0 48px",
            lineHeight: 1.05,
          }}>
            Ready to scope your<br />next project?
          </h2>
          <a className="rv d1 cta-btn" href="/auth">
            Start for free →
          </a>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="nav-inner" style={{
        background: "#000",
        borderTop: "1px solid #111",
        padding: "32px 56px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 20,
      }}>
        <a href="/" style={{ fontWeight: 800, fontSize: 16, color: "#fff", letterSpacing: "-0.02em", textDecoration: "none" }}>
          Scope
        </a>
        <div style={{ display: "flex", gap: 36 }}>
          {[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Sign in",   href: "/auth" },
            { label: "Get started", href: "/auth" },
          ].map((l) => (
            <a key={l.label} href={l.href} className="nav-link" style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>
              {l.label}
            </a>
          ))}
        </div>
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.2)" }}>© 2025 Scope</span>
      </footer>
    </div>
  );
}
