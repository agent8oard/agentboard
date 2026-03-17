'use client'
import Link from 'next/link'
import Navbar from '../components/Navbar'

export default function Home() {
  return (
    <>
      <Navbar />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap');

        .hero-section {
          max-width: 1000px;
          margin: 0 auto;
          padding: 120px 40px 80px;
          text-align: center;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background: var(--bg2);
          border: 1px solid var(--border2);
          border-radius: 20px;
          font-family: var(--mono);
          font-size: 11px;
          color: var(--fg3);
          letter-spacing: 1px;
          margin-bottom: 36px;
        }

        .hero-badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent);
          animation: pulse-dot 2s ease-in-out infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .hero-title {
          font-family: 'Instrument Serif', Georgia, serif;
          font-size: clamp(48px, 9vw, 96px);
          font-weight: 400;
          line-height: 1.0;
          letter-spacing: -2px;
          color: var(--fg);
          margin-bottom: 28px;
        }

        .hero-title em {
          font-style: italic;
          color: var(--accent);
        }

        .hero-subtitle {
          font-family: var(--sans);
          font-size: 17px;
          color: var(--fg3);
          max-width: 460px;
          margin: 0 auto 48px;
          line-height: 1.7;
        }

        .hero-cta {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 72px;
        }

        .btn-hero-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          background: var(--accent);
          color: #0a0a0a;
          border-radius: 8px;
          font-family: var(--sidebar-font);
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.15s;
          letter-spacing: -0.2px;
        }

        .btn-hero-primary:hover {
          background: var(--accent2);
          transform: translateY(-1px);
        }

        .btn-hero-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          background: transparent;
          color: var(--fg2);
          border: 1px solid var(--border2);
          border-radius: 8px;
          font-family: var(--sidebar-font);
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.15s;
        }

        .btn-hero-secondary:hover {
          border-color: var(--border3);
          color: var(--fg);
          background: var(--bg2);
        }

        .section {
          max-width: 1000px;
          margin: 0 auto;
          padding: 80px 40px;
        }

        .section-label {
          font-family: var(--mono);
          font-size: 10px;
          font-weight: 600;
          color: var(--fg3);
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 16px;
        }

        .section-title {
          font-family: 'Instrument Serif', Georgia, serif;
          font-size: clamp(32px, 5vw, 52px);
          font-weight: 400;
          letter-spacing: -1.5px;
          color: var(--fg);
          margin-bottom: 16px;
          line-height: 1.1;
        }

        .section-subtitle {
          font-family: var(--sans);
          font-size: 15px;
          color: var(--fg3);
          max-width: 460px;
          line-height: 1.7;
          margin-bottom: 48px;
        }

        .divider {
          border: none;
          border-top: 1px solid var(--border);
          margin: 0;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 1px;
          background: var(--border);
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
        }

        .feature-card {
          background: var(--bg);
          padding: 28px 24px;
          transition: background 0.15s;
        }

        .feature-card:hover {
          background: var(--bg2);
        }

        .feature-icon {
          color: var(--fg3);
          margin-bottom: 14px;
        }

        .feature-name {
          font-family: 'Instrument Serif', Georgia, serif;
          font-size: 18px;
          font-weight: 400;
          color: var(--fg);
          margin-bottom: 6px;
          letter-spacing: -0.3px;
        }

        .feature-desc {
          font-family: var(--sans);
          font-size: 13px;
          color: var(--fg3);
          line-height: 1.6;
        }

        .steps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
        }

        .step-card {
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 28px;
          position: relative;
          transition: border-color 0.15s;
        }

        .step-card:hover {
          border-color: var(--border2);
        }

        .step-number {
          font-family: var(--mono);
          font-size: 11px;
          color: var(--accent);
          font-weight: 600;
          letter-spacing: 1px;
          margin-bottom: 14px;
        }

        .step-title {
          font-family: 'Instrument Serif', Georgia, serif;
          font-size: 22px;
          font-weight: 400;
          color: var(--fg);
          margin-bottom: 10px;
          letter-spacing: -0.3px;
        }

        .step-desc {
          font-family: var(--sans);
          font-size: 14px;
          color: var(--fg3);
          line-height: 1.7;
        }

        .industries-wrap {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .industry-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 6px;
          font-family: var(--sans);
          font-size: 13px;
          color: var(--fg3);
          transition: all 0.15s;
          cursor: default;
        }

        .industry-tag:hover {
          border-color: var(--border2);
          color: var(--fg2);
        }

        .platform-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 12px;
        }

        .platform-card {
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 24px;
          transition: border-color 0.15s;
        }

        .platform-card:hover {
          border-color: var(--border2);
        }

        .platform-card.accent {
          background: #0a1200;
          border-color: rgba(200,241,53,0.15);
        }

        .platform-tag {
          font-family: var(--mono);
          font-size: 9px;
          letter-spacing: 2px;
          color: var(--fg3);
          text-transform: uppercase;
          margin-bottom: 14px;
          font-weight: 600;
        }

        .platform-card.accent .platform-tag {
          color: var(--accent);
        }

        .platform-title {
          font-family: 'Instrument Serif', Georgia, serif;
          font-size: 20px;
          font-weight: 400;
          color: var(--fg);
          margin-bottom: 8px;
          letter-spacing: -0.3px;
        }

        .platform-desc {
          font-family: var(--sans);
          font-size: 13px;
          color: var(--fg3);
          line-height: 1.7;
        }

        .cta-section {
          max-width: 1000px;
          margin: 0 auto;
          padding: 100px 40px;
          text-align: center;
        }

        .cta-title {
          font-family: 'Instrument Serif', Georgia, serif;
          font-size: clamp(36px, 6vw, 64px);
          font-weight: 400;
          letter-spacing: -2px;
          color: var(--fg);
          margin-bottom: 20px;
          line-height: 1.05;
        }

        .cta-subtitle {
          font-family: var(--sans);
          font-size: 16px;
          color: var(--fg3);
          max-width: 380px;
          margin: 0 auto 48px;
          line-height: 1.7;
        }

        .footer {
          border-top: 1px solid var(--border);
          max-width: 1000px;
          margin: 0 auto;
          padding: 28px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .footer-logo-mark {
          width: 22px;
          height: 22px;
          background: var(--accent);
          border-radius: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .footer-links {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
        }

        .footer-link {
          font-family: var(--sans);
          font-size: 13px;
          color: var(--fg3);
          text-decoration: none;
          transition: color 0.1s;
        }

        .footer-link:hover {
          color: var(--fg2);
        }

        @media (max-width: 768px) {
          .hero-section { padding: 80px 20px 60px; }
          .section { padding: 60px 20px; }
          .cta-section { padding: 60px 20px; }
          .footer { padding: 24px 20px; flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      {/* ── HERO ── */}
      <div className="hero-section">
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          AI Business Agent Platform
        </div>

        <h1 className="hero-title">
          Your business,<br />
          <em>run by AI.</em>
        </h1>

        <p className="hero-subtitle">
          Build a custom AI agent for your business in 5 minutes. It handles emails, invoices, contracts, and support — automatically, 24/7.
        </p>

        <div className="hero-cta">
          <Link href="/builder" className="btn-hero-primary">
            Build your agent
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
          <Link href="/auth" className="btn-hero-secondary">
            Sign up free
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40, flexWrap: 'wrap' }}>
          {[
            { value: '5 min', label: 'Setup time' },
            { value: '24/7', label: 'Always on' },
            { value: '100%', label: 'Your brand' },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 32, color: 'var(--fg)', letterSpacing: -1, marginBottom: 2 }}>{stat.value}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg3)', letterSpacing: 1, textTransform: 'uppercase' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <hr className="divider" />

      {/* ── HOW IT WORKS ── */}
      <div className="section" id="how-it-works">
        <div className="section-label">How it works</div>
        <h2 className="section-title">From zero to AI agent<br />in minutes</h2>
        <p className="section-subtitle">No technical knowledge required. No code. Just tell us about your business.</p>

        <div className="steps-grid">
          {[
            {
              step: '01',
              title: 'Describe your business',
              desc: 'Answer 5 simple questions about your business, industry, and what you need help with. Takes under 2 minutes.',
            },
            {
              step: '02',
              title: 'AI builds your agent',
              desc: 'We generate a custom AI agent trained specifically on your business, industry tone, and services.',
            },
            {
              step: '03',
              title: 'Business runs itself',
              desc: 'Your agent handles emails, invoices, contracts, and more — automatically. You focus on growth.',
            },
          ].map(step => (
            <div key={step.step} className="step-card">
              <div className="step-number">{step.step}</div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <hr className="divider" />

      {/* ── WHAT YOUR AGENT HANDLES ── */}
      <div className="section">
        <div className="section-label">Capabilities</div>
        <h2 className="section-title">What your agent handles</h2>
        <p className="section-subtitle">Every task a business owner does manually — your agent does automatically.</p>

        <div className="feature-grid">
          {[
            { label: 'Customer emails', desc: 'Reads and replies automatically', icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/></svg> },
            { label: 'Invoices', desc: 'Generates and sends instantly', icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8"/></svg> },
            { label: 'Contracts', desc: 'Drafts professional agreements', icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 12h6M9 16h6M9 8h6M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg> },
            { label: 'Reports', desc: 'Weekly business summaries', icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg> },
            { label: 'Quotes', desc: 'Convert quotes to invoices', icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg> },
            { label: 'Orders', desc: 'Track and manage orders', icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0"/></svg> },
            { label: 'Social media', desc: 'Content ready to post', icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/></svg> },
            { label: 'Complaints', desc: 'Handled with professionalism', icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg> },
          ].map(f => (
            <div key={f.label} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-name">{f.label}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <hr className="divider" />

      {/* ── WORKS FOR ANY BUSINESS ── */}
      <div className="section">
        <div className="section-label">Industries</div>
        <h2 className="section-title">Works for any business</h2>
        <p className="section-subtitle">Every business gets a custom agent built specifically for their industry and workflows.</p>

        <div className="industries-wrap">
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

      <hr className="divider" />

      {/* ── PLATFORM FEATURES ── */}
      <div className="section">
        <div className="section-label">Platform</div>
        <h2 className="section-title">Everything your<br />business needs</h2>

        <div className="platform-grid">
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
              desc: "Create automations that run daily, weekly, or monthly — your agent works even when you're not logged in.",
              accent: false,
            },
            {
              tag: 'CALENDAR',
              title: 'Manages your calendar',
              desc: "Mention a meeting in chat and it's added automatically. View all upcoming events in one place.",
              accent: false,
            },
            {
              tag: 'ANALYTICS',
              title: 'Business insights',
              desc: 'Track tasks completed, documents generated, contacts added, and agent health — all in one dashboard.',
              accent: false,
            },
          ].map(f => (
            <div key={f.tag} className={`platform-card${f.accent ? ' accent' : ''}`}>
              <div className="platform-tag">{f.tag}</div>
              <h3 className="platform-title">{f.title}</h3>
              <p className="platform-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <hr className="divider" />

      {/* ── CTA ── */}
      <div className="cta-section">
        <div className="section-label" style={{ marginBottom: 24 }}>Get started</div>
        <h2 className="cta-title">
          Ready to put your<br />
          <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>business on autopilot?</em>
        </h2>
        <p className="cta-subtitle">
          Build your custom AI agent in 5 minutes. No technical knowledge needed. Free to start.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/builder" className="btn-hero-primary" style={{ fontSize: 15, padding: '16px 36px' }}>
            Build my agent
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
          <Link href="/auth" className="btn-hero-secondary" style={{ fontSize: 15, padding: '16px 36px' }}>
            Sign up free
          </Link>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div className="footer">
        <div className="footer-logo">
          <div className="footer-logo-mark">
            <span style={{ fontFamily: 'var(--sidebar-font)', fontSize: 11, fontWeight: 800, color: '#0a0a0a' }}>A</span>
          </div>
          <span style={{ fontFamily: 'var(--sidebar-font)', fontSize: 13, color: 'var(--fg3)', fontWeight: 500 }}>AgentBoard</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--border3)' }}>© 2026</span>
        </div>
        <div className="footer-links">
          {[
            { label: 'Terms', href: '/legal/terms' },
            { label: 'Privacy', href: '/legal/privacy' },
            { label: 'Support', href: 'mailto:support@agentboard.ai' },
            { label: 'Builder', href: '/builder' },
          ].map(l => (
            <Link key={l.label} href={l.href} className="footer-link">{l.label}</Link>
          ))}
        </div>
      </div>
    </>
  )
}