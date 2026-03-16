import Link from 'next/link'
import Navbar from '@/components/Navbar'

export default function Home() {
  return (
    <>
      <Navbar />

      {/* HERO */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '80px 40px 60px' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 24 }}>
          AI Business Agent Platform
        </div>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 88, lineHeight: 1.0, marginBottom: 28, maxWidth: 800, fontWeight: 400 }}>
          Your business,<br />run by <em>AI.</em>
        </h1>
        <p style={{ fontSize: 18, color: 'var(--muted)', maxWidth: 520, lineHeight: 1.75, marginBottom: 44 }}>
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
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 40px 80px' }}>
        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', marginBottom: 60 }} />
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 40 }}>
          How it works
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 80 }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 80 }}>
          {[
            { icon: '📧', label: 'Customer emails', desc: 'Reads and replies automatically' },
            { icon: '📄', label: 'Invoices', desc: 'Generates and emails instantly' },
            { icon: '📝', label: 'Contracts', desc: 'Drafts professional agreements' },
            { icon: '📊', label: 'Reports', desc: 'Weekly business summaries' },
            { icon: '💼', label: 'Proposals', desc: 'Wins more clients automatically' },
            { icon: '📱', label: 'Social media', desc: 'Content ready to post' },
            { icon: '😤', label: 'Complaints', desc: 'Handled with care' },
            { icon: '🎯', label: 'Marketing', desc: 'Campaigns written instantly' },
          ].map(f => (
            <div key={f.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px', transition: 'border-color 0.15s' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{f.label}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* WORKS FOR ANY BUSINESS */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, padding: '48px 48px', marginBottom: 80 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>Works for any business</div>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: 36, fontWeight: 400, marginBottom: 32, maxWidth: 500 }}>
            Every business gets a custom agent built for them.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
            {[
              '🍕 Restaurants', '⚖️ Law Firms', '🛍️ Retail Stores',
              '🏠 Real Estate', '💅 Salons & Spas', '💻 Tech Startups',
              '🏥 Healthcare', '🎓 Education', '🔧 Trades & Services',
              '💰 Finance', '🏗️ Construction', '📦 E-commerce',
            ].map(b => (
              <div key={b} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: 'var(--muted)' }}>
                {b}
              </div>
            ))}
          </div>
        </div>

        {/* FEATURES */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 80 }}>
          <div style={{ background: 'var(--fg)', color: 'var(--bg)', borderRadius: 20, padding: '40px 40px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, opacity: 0.5, letterSpacing: 2, marginBottom: 16 }}>SMART MEMORY</div>
            <h3 style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 400, marginBottom: 12 }}>Your agent remembers everything</h3>
            <p style={{ fontSize: 14, opacity: 0.6, lineHeight: 1.7 }}>
              Tell your agent your pricing once. It remembers forever. Add your customers, policies, and products — your agent uses this knowledge in every response.
            </p>
          </div>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, padding: '40px 40px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: 2, marginBottom: 16 }}>CSV IMPORT</div>
            <h3 style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 400, marginBottom: 12 }}>Import your existing data</h3>
            <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>
              Upload your customer list from any CRM, spreadsheet, or database. Your agent instantly knows all your customers by name, email, and history.
            </p>
          </div>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, padding: '40px 40px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: 2, marginBottom: 16 }}>REAL DOCUMENTS</div>
            <h3 style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 400, marginBottom: 12 }}>Print-ready in seconds</h3>
            <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>
              Your agent generates professional invoices, contracts, and proposals that look real and can be printed or saved as PDF instantly.
            </p>
          </div>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, padding: '40px 40px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: 2, marginBottom: 16 }}>TEAM ACCESS</div>
            <h3 style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 400, marginBottom: 12 }}>Your whole team, one agent</h3>
            <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>
              Invite your staff to use the same agent. Everyone gets the same consistent, professional responses powered by your business knowledge.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div style={{ background: 'var(--fg)', color: 'var(--bg)', borderRadius: 20, padding: '60px 48px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, opacity: 0.5, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>
            Get started today
          </div>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: 48, fontWeight: 400, marginBottom: 16, lineHeight: 1.1 }}>
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