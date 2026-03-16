import Link from 'next/link'
import Navbar from '../components/Navbar'

export default function Home() {
  return (
    <>
      <Navbar />

      {/* HERO */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(40px, 8vw, 80px) clamp(16px, 4vw, 40px) 60px' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 24 }}>
          AI Business Agent Platform
        </div>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(40px, 10vw, 88px)', lineHeight: 1.0, marginBottom: 28, maxWidth: 800, fontWeight: 400 }}>
          Your business,<br />run by <em>AI.</em>
        </h1>
        <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: 'var(--muted)', maxWidth: 520, lineHeight: 1.75, marginBottom: 44 }}>
          Build a custom AI agent for your business in 5 minutes. It handles emails, invoices, contracts, customer support — automatically, 24/7.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/builder" className="btn btn-accent" style={{ fontSize: 14, padding: '14px 32px' }}>
            Build your AI agent →
          </Link>
          <Link href="/auth" className="btn btn-outline" style={{ fontSize: 14, padding: '14px 32px' }}>
            Sign up free
          </Link>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 clamp(16px, 4vw, 40px) 80px' }}>
        <hr id="how-it-works" style={{ border: 'none', borderTop: '1px solid var(--border)', marginBottom: 60 }} />
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 40 }}>
          How it works
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24, marginBottom: 80 }}>
          {[
            { step: '01', title: 'Answer 5 questions', desc: 'Tell us your business name, industry, and what you need help with. Takes under 2 minutes.' },
            { step: '02', title: 'AI builds your agent', desc: 'We create a custom AI agent trained specifically for your business, industry, and tone.' },
            { step: '03', title: 'Your business runs itself', desc: 'Your agent handles emails, invoices, contracts, reports, and more — automatically.' },
          ].map(s => (
            <div key={s.step} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 28 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)', letterSpacing: 2, marginBottom: 16 }}>{s.step}</div>
              <h3 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 400, marginBottom: 10 }}>{s.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>{s.desc}</p>
            </div>
          ))}
        </div>

        {/* WHAT YOUR AGENT CAN DO */}
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 24 }}>
          What your agent handles
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 80 }}>
          {[
            { label: 'Customer emails', desc: 'Reads and replies automatically', icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/></svg> },
            { label: 'Invoices', desc: 'Generates and emails instantly', icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg> },
            { label: 'Contracts', desc: 'Drafts professional agreements', icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 12h6M9 16h6M9 8h6M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg> },
            { label: 'Reports', desc: 'Weekly business summaries', icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg> },
            { label: 'Proposals', desc: 'Wins more clients automatically', icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
            { label: 'Social media', desc: 'Content ready to post', icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/></svg> },
            { label: 'Complaints', desc: 'Handled with care', icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg> },
            { label: 'Marketing', desc: 'Campaigns written instantly', icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
          ].map(f => (
            <div key={f.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 16px' }}>
              <div style={{ color: 'var(--muted)', marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{f.label}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* WORKS FOR ANY BUSINESS */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, padding: 'clamp(24px, 4vw, 48px)', marginBottom: 80 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>Works for any business</div>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: 400, marginBottom: 32, maxWidth: 500 }}>
            Every business gets a custom agent built for them.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
            {[
              { label: 'Restaurants', icon: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg> },
              { label: 'Law Firms', icon: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z"/></svg> },
              { label: 'Retail Stores', icon: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0"/></svg> },
              { label: 'Real Estate', icon: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
              { label: 'Salons & Spas', icon: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
              { label: 'Tech Startups', icon: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg> },
              { label: 'Healthcare', icon: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
              { label: 'Education', icon: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg> },
              { label: 'Trades & Services', icon: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> },
              { label: 'Finance', icon: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
              { label: 'Construction', icon: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="2" y="3" width="6" height="4"/><rect x="16" y="3" width="6" height="4"/><rect x="9" y="3" width="6" height="4"/><path d="M2 17h20M2 21h20M2 13h20"/></svg> },
              { label: 'E-commerce', icon: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg> },
            ].map(b => (
              <div key={b.label} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ opacity: 0.6, flexShrink: 0 }}>{b.icon}</span>
                {b.label}
              </div>
            ))}
          </div>
        </div>

        {/* FEATURES */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24, marginBottom: 80 }}>
          <div style={{ background: 'var(--fg)', color: 'var(--bg)', borderRadius: 20, padding: 'clamp(24px, 4vw, 40px)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, opacity: 0.5, letterSpacing: 2, marginBottom: 16 }}>SMART MEMORY</div>
            <h3 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 400, marginBottom: 12 }}>Your agent remembers everything</h3>
            <p style={{ fontSize: 14, opacity: 0.6, lineHeight: 1.7 }}>
              Tell your agent your pricing once. It remembers forever. Add your customers, policies, and products — your agent uses this knowledge in every response.
            </p>
          </div>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, padding: 'clamp(24px, 4vw, 40px)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: 2, marginBottom: 16 }}>CSV IMPORT</div>
            <h3 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 400, marginBottom: 12 }}>Import your existing data</h3>
            <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>
              Upload your customer list from any CRM, spreadsheet, or database. Your agent instantly knows all your customers by name, email, and history.
            </p>
          </div>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, padding: 'clamp(24px, 4vw, 40px)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: 2, marginBottom: 16 }}>REAL DOCUMENTS</div>
            <h3 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 400, marginBottom: 12 }}>Print-ready in seconds</h3>
            <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>
              Your agent generates professional invoices, contracts, and proposals that look real and can be printed or saved as PDF instantly.
            </p>
          </div>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, padding: 'clamp(24px, 4vw, 40px)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: 2, marginBottom: 16 }}>TEAM ACCESS</div>
            <h3 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 400, marginBottom: 12 }}>Your whole team, one agent</h3>
            <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>
              Invite your staff to use the same agent. Everyone gets the same consistent, professional responses powered by your business knowledge.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div style={{ background: 'var(--fg)', color: 'var(--bg)', borderRadius: 20, padding: 'clamp(36px, 6vw, 60px) clamp(24px, 5vw, 48px)', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, opacity: 0.5, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>
            Get started today
          </div>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(28px, 6vw, 48px)', fontWeight: 400, marginBottom: 16, lineHeight: 1.1 }}>
            Ready to put your<br />business on autopilot?
          </h2>
          <p style={{ fontSize: 16, opacity: 0.6, maxWidth: 400, margin: '0 auto 40px', lineHeight: 1.7 }}>
            Build your custom AI agent in 5 minutes. No technical knowledge needed.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/builder" style={{ background: '#c8f135', color: '#0a0a0a', padding: '14px 36px', borderRadius: 10, textDecoration: 'none', fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700 }}>
              Build my agent →
            </Link>
            <Link href="/auth" style={{ background: 'transparent', color: 'var(--bg)', border: '1px solid rgba(255,255,255,0.2)', padding: '14px 36px', borderRadius: 10, textDecoration: 'none', fontFamily: 'var(--mono)', fontSize: 13 }}>
              Sign up free
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}