import Link from 'next/link'
import Navbar from '../components/Navbar'

export default function Home() {
  return (
    <>
      <Navbar />

      <style>{`
        .hero-glow {
          position: absolute;
          top: -200px;
          left: 50%;
          transform: translateX(-50%);
          width: 800px;
          height: 600px;
          background: radial-gradient(ellipse at center, rgba(200,241,53,0.08) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }
        .grid-bg {
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 64px 64px;
          pointer-events: none;
          z-index: 0;
        }
        .feature-card {
          background: #111111;
          border: 1px solid #1e1e1e;
          border-radius: 12px;
          padding: 28px;
          transition: border-color 0.2s, transform 0.2s;
          position: relative;
          overflow: hidden;
        }
        .feature-card:hover {
          border-color: #2a2a2a;
          transform: translateY(-2px);
        }
        .feature-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(200,241,53,0.3), transparent);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .feature-card:hover::before {
          opacity: 1;
        }
        .industry-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: #111;
          border: 1px solid #1e1e1e;
          border-radius: 6px;
          font-size: 12px;
          color: #666;
          transition: all 0.15s;
          font-family: var(--sans);
        }
        .industry-tag:hover {
          border-color: #333;
          color: #999;
        }
        .stat-number {
          font-size: 40px;
          font-weight: 700;
          letter-spacing: -1.5px;
          color: #ededed;
          font-family: var(--sidebar-font);
          line-height: 1;
        }
        .badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px 4px 6px;
          background: rgba(200,241,53,0.08);
          border: 1px solid rgba(200,241,53,0.2);
          border-radius: 20px;
          font-size: 11px;
          font-family: var(--mono);
          color: #c8f135;
          letter-spacing: 0.3px;
        }
        .badge-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #c8f135;
          animation: blink 2s ease-in-out infinite;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .cta-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: #c8f135;
          color: #0a0a0a;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 700;
          font-family: var(--sidebar-font);
          text-decoration: none;
          transition: all 0.15s;
          letter-spacing: -0.2px;
        }
        .cta-primary:hover {
          background: #d4f74d;
          transform: translateY(-1px);
        }
        .cta-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: transparent;
          color: #a1a1a1;
          border: 1px solid #222;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          font-family: var(--sidebar-font);
          text-decoration: none;
          transition: all 0.15s;
        }
        .cta-secondary:hover {
          border-color: #333;
          color: #ededed;
          background: #111;
        }
        .section-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          background: #111;
          border: 1px solid #222;
          border-radius: 20px;
          font-family: var(--mono);
          font-size: 10px;
          color: #666;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-bottom: 20px;
        }
        .divider-line {
          border: none;
          border-top: 1px solid #1a1a1a;
          margin: 0;
        }
        .step-number {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: #111;
          border: 1px solid #222;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--mono);
          font-size: 11px;
          color: #c8f135;
          font-weight: 600;
          flex-shrink: 0;
        }
      `}</style>

      <div className="grid-bg" />

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ── HERO ── */}
        <div style={{ position: 'relative', maxWidth: 1000, margin: '0 auto', padding: 'clamp(80px, 10vw, 140px) clamp(20px, 4vw, 40px) 100px', textAlign: 'center', overflow: 'hidden' }}>
          <div className="hero-glow" />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="badge-pill" style={{ marginBottom: 32 }}>
              <span className="badge-dot" />
              AI Business Agent Platform
            </div>

            <h1 style={{
              fontFamily: 'var(--sidebar-font)',
              fontSize: 'clamp(44px, 8vw, 84px)',
              fontWeight: 800,
              lineHeight: 1.0,
              letterSpacing: '-2.5px',
              marginBottom: 28,
              color: '#ededed',
            }}>
              Your business,<br />
              <span style={{ color: '#c8f135' }}>run by AI.</span>
            </h1>

            <p style={{
              fontSize: 'clamp(15px, 2vw, 18px)',
              color: '#666',
              maxWidth: 480,
              lineHeight: 1.7,
              margin: '0 auto 48px',
              fontFamily: 'var(--sans)',
            }}>
              Build a custom AI agent for your business in 5 minutes. It handles emails, invoices, contracts, and support — automatically, 24/7.
            </p>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/builder" className="cta-primary">
                Build your agent
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <Link href="/auth" className="cta-secondary">
                Sign up free
              </Link>
            </div>

            {/* Social proof */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, marginTop: 56, flexWrap: 'wrap' }}>
              {[
                { value: '5 min', label: 'Setup time' },
                { value: '24/7', label: 'Always on' },
                { value: '100%', label: 'Your brand' },
              ].map(stat => (
                <div key={stat.label} style={{ textAlign: 'center' }}>
                  <div className="stat-number" style={{ fontSize: 24, marginBottom: 2 }}>{stat.value}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#444', letterSpacing: 1 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <hr className="divider-line" />

        {/* ── HOW IT WORKS ── */}
        <div id="how-it-works" style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(60px, 8vw, 100px) clamp(20px, 4vw, 40px)' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div className="section-chip">How it works</div>
            <h2 style={{ fontFamily: 'var(--sidebar-font)', fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 700, letterSpacing: '-1.5px', color: '#ededed', marginBottom: 16 }}>
              From zero to AI agent in minutes
            </h2>
            <p style={{ fontSize: 15, color: '#555', maxWidth: 400, margin: '0 auto', lineHeight: 1.7 }}>
              No technical knowledge required. No code. Just tell us about your business.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 2 }}>
            {[
              {
                step: '01',
                title: 'Describe your business',
                desc: 'Answer 5 simple questions about your business, industry, and what you need help with. Takes under 2 minutes.',
                icon: <svg width="20" height="20" fill="none" stroke="#c8f135" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
              },
              {
                step: '02',
                title: 'AI builds your agent',
                desc: 'We generate a custom AI agent trained specifically on your business, industry tone, and services.',
                icon: <svg width="20" height="20" fill="none" stroke="#c8f135" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>,
              },
              {
                step: '03',
                title: 'Business runs itself',
                desc: 'Your agent handles emails, invoices, contracts, and more — automatically. You focus on growth.',
                icon: <svg width="20" height="20" fill="none" stroke="#c8f135" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
              },
            ].map((step, i) => (
              <div key={step.step} className="feature-card" style={{ borderRadius: i === 0 ? '12px 0 0 12px' : i === 2 ? '0 12px 12px 0' : '0', borderRight: i < 2 ? 'none' : undefined }}>
                <div style={{ display: 'flex', align: 'center', gap: 12, marginBottom: 20 }}>
                  <div className="step-number">{step.step}</div>
                  <div style={{ color: '#c8f135' }}>{step.icon}</div>
                </div>
                <h3 style={{ fontFamily: 'var(--sidebar-font)', fontSize: 17, fontWeight: 600, color: '#ededed', marginBottom: 10, letterSpacing: '-0.3px' }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, fontFamily: 'var(--sans)' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <hr className="divider-line" />

        {/* ── WHAT YOUR AGENT HANDLES ── */}
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(60px, 8vw, 100px) clamp(20px, 4vw, 40px)' }}>
          <div style={{ marginBottom: 48 }}>
            <div className="section-chip">Capabilities</div>
            <h2 style={{ fontFamily: 'var(--sidebar-font)', fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 700, letterSpacing: '-1.5px', color: '#ededed', marginBottom: 16 }}>
              What your agent handles
            </h2>
            <p style={{ fontSize: 15, color: '#555', maxWidth: 460, lineHeight: 1.7 }}>
              Every task a business owner does manually — your agent does automatically.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {[
              { label: 'Customer emails', desc: 'Reads and replies automatically', icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/></svg> },
              { label: 'Invoices', desc: 'Generates and sends instantly', icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8"/></svg> },
              { label: 'Contracts', desc: 'Drafts professional agreements', icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 12h6M9 16h6M9 8h6M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg> },
              { label: 'Reports', desc: 'Weekly business summaries', icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg> },
              { label: 'Quotes', desc: 'Convert quotes to invoices', icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg> },
              { label: 'Orders', desc: 'Track and manage orders', icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0"/></svg> },
              { label: 'Social media', desc: 'Content ready to post', icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/></svg> },
              { label: 'Complaints', desc: 'Handled with professionalism', icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg> },
            ].map(f => (
              <div key={f.label} className="feature-card">
                <div style={{ color: '#444', marginBottom: 14 }}>{f.icon}</div>
                <div style={{ fontFamily: 'var(--sidebar-font)', fontSize: 14, fontWeight: 600, color: '#ededed', marginBottom: 4 }}>{f.label}</div>
                <div style={{ fontFamily: 'var(--sans)', fontSize: 12, color: '#555' }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <hr className="divider-line" />

        {/* ── WORKS FOR ANY BUSINESS ── */}
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(60px, 8vw, 100px) clamp(20px, 4vw, 40px)' }}>
          <div style={{ marginBottom: 40 }}>
            <div className="section-chip">Industries</div>
            <h2 style={{ fontFamily: 'var(--sidebar-font)', fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 700, letterSpacing: '-1.5px', color: '#ededed', marginBottom: 16 }}>
              Works for any business
            </h2>
            <p style={{ fontSize: 15, color: '#555', maxWidth: 440, lineHeight: 1.7 }}>
              Every business gets a custom agent built specifically for their industry and workflows.
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[
              { label: 'Restaurants', icon: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg> },
              { label: 'Law Firms', icon: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z"/></svg> },
              { label: 'Retail Stores', icon: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0"/></svg> },
              { label: 'Real Estate', icon: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
              { label: 'Salons & Spas', icon: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
              { label: 'Tech Startups', icon: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg> },
              { label: 'Healthcare', icon: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
              { label: 'Education', icon: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg> },
              { label: 'Trades & Services', icon: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> },
              { label: 'Finance', icon: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
              { label: 'Construction', icon: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="2" y="3" width="6" height="4"/><rect x="16" y="3" width="6" height="4"/><rect x="9" y="3" width="6" height="4"/><path d="M2 17h20M2 21h20M2 13h20"/></svg> },
              { label: 'E-commerce', icon: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg> },
            ].map(b => (
              <div key={b.label} className="industry-tag">
                <span style={{ opacity: 0.5 }}>{b.icon}</span>
                {b.label}
              </div>
            ))}
          </div>
        </div>

        <hr className="divider-line" />

        {/* ── FEATURES ── */}
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(60px, 8vw, 100px) clamp(20px, 4vw, 40px)' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div className="section-chip">Platform</div>
            <h2 style={{ fontFamily: 'var(--sidebar-font)', fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 700, letterSpacing: '-1.5px', color: '#ededed', marginBottom: 16 }}>
              Everything your business needs
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {[
              {
                tag: 'MEMORY',
                title: 'Remembers everything',
                desc: 'Tell your agent your pricing once. It remembers forever. Add clients, policies, and products — your agent uses this in every response.',
                accent: true,
              },
              {
                tag: 'IMPORT',
                title: 'Import your data',
                desc: 'Upload your customer list from any CRM or spreadsheet. Your agent instantly knows all your customers by name, email, and history.',
                accent: false,
              },
              {
                tag: 'DOCUMENTS',
                title: 'Real documents',
                desc: 'Generate professional invoices, contracts, and proposals that can be printed or saved as PDF instantly.',
                accent: false,
              },
              {
                tag: 'AUTOMATION',
                title: 'Runs on schedule',
                desc: 'Create automations that run daily, weekly, or monthly — your agent works even when you\'re not logged in.',
                accent: false,
              },
              {
                tag: 'CALENDAR',
                title: 'Manages your calendar',
                desc: 'Mention a meeting in chat and it\'s added automatically. View all upcoming events in one place.',
                accent: false,
              },
              {
                tag: 'ANALYTICS',
                title: 'Business insights',
                desc: 'Track tasks completed, documents generated, contacts added, and agent health — all in one dashboard.',
                accent: false,
              },
            ].map(f => (
              <div key={f.tag} className="feature-card" style={f.accent ? { background: '#0f1a00', borderColor: 'rgba(200,241,53,0.2)' } : {}}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: 2, color: f.accent ? '#c8f135' : '#444', textTransform: 'uppercase', marginBottom: 16, fontWeight: 600 }}>
                  {f.tag}
                </div>
                <h3 style={{ fontFamily: 'var(--sidebar-font)', fontSize: 17, fontWeight: 600, color: '#ededed', marginBottom: 10, letterSpacing: '-0.3px' }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, fontFamily: 'var(--sans)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <hr className="divider-line" />

        {/* ── CTA ── */}
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(80px, 10vw, 120px) clamp(20px, 4vw, 40px)', textAlign: 'center' }}>
          <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 600, height: 300, background: 'radial-gradient(ellipse, rgba(200,241,53,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div className="section-chip" style={{ marginBottom: 24 }}>Get started</div>
              <h2 style={{ fontFamily: 'var(--sidebar-font)', fontSize: 'clamp(32px, 6vw, 60px)', fontWeight: 800, letterSpacing: '-2px', color: '#ededed', marginBottom: 20, lineHeight: 1.05 }}>
                Ready to put your<br />business on autopilot?
              </h2>
              <p style={{ fontSize: 16, color: '#555', maxWidth: 380, margin: '0 auto 48px', lineHeight: 1.7 }}>
                Build your custom AI agent in 5 minutes. No technical knowledge needed. Free to start.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/builder" className="cta-primary" style={{ fontSize: 15, padding: '14px 32px' }}>
                  Build my agent
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
                <Link href="/auth" className="cta-secondary" style={{ fontSize: 15, padding: '14px 32px' }}>
                  Sign up free
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <hr className="divider-line" />
        <footer style={{ maxWidth: 1000, margin: '0 auto', padding: '28px clamp(20px, 4vw, 40px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 20, height: 20, background: '#c8f135', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'var(--sidebar-font)', fontSize: 10, fontWeight: 800, color: '#0a0a0a' }}>A</span>
              </div>
              <span style={{ fontFamily: 'var(--sidebar-font)', fontSize: 13, color: '#444', fontWeight: 500 }}>AgentBoard</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#333' }}>© 2026</span>
            </div>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {[
                { label: 'Terms', href: '/legal/terms' },
                { label: 'Privacy', href: '/legal/privacy' },
                { label: 'Support', href: 'mailto:support@agentboard.ai' },
                { label: 'Builder', href: '/builder' },
              ].map(l => (
                <Link key={l.label} href={l.href} style={{ fontFamily: 'var(--sidebar-font)', fontSize: 13, color: '#444', textDecoration: 'none', transition: 'color 0.1s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = '#888'}
                  onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = '#444'}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </footer>

      </div>
    </>
  )
}