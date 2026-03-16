'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Navbar({ active }: { active?: string }) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    setMenuOpen(false)
  }

  return (
    <>
      <nav className="nav" style={{ position: 'relative', zIndex: 100 }}>
        <Link href="/" className="nav-logo" onClick={() => setMenuOpen(false)}>
          <span className="nav-logo-dot" />
          AgentBoard
        </Link>

        {/* Desktop links */}
        <div className="nav-links" style={{ display: 'flex' }}>
          <Link href="/#how-it-works" className={`nav-link ${active === 'how' ? 'active' : ''}`}>
            how it works
          </Link>
          <Link href="/builder" className={`nav-link ${active === 'builder' ? 'active' : ''}`}>
            builder
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" className={`nav-link ${active === 'dashboard' ? 'active' : ''}`}>
                {user.email?.split('@')[0]}
              </Link>
              <button onClick={signOut} className="btn btn-outline" style={{ fontSize: 12 }}>
                sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth" className="btn btn-outline" style={{ fontSize: 12 }}>
                sign in
              </Link>
              <Link href="/builder" className="btn btn-accent" style={{ fontSize: 12 }}>
                get started →
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            display: 'none',
            background: 'none', border: '1px solid var(--border2)',
            borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
            color: 'var(--fg)',
          }}
          className="mobile-menu-btn">
          {menuOpen ? (
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
          ) : (
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          )}
        </button>
      </nav>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: 57, left: 0, right: 0,
          background: 'var(--bg)', borderBottom: '1px solid var(--border)',
          padding: '16px 20px', zIndex: 99,
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <Link href="/#how-it-works" onClick={() => setMenuOpen(false)}
            style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)', textDecoration: 'none', borderRadius: 8, background: 'var(--bg2)' }}>
            How it works
          </Link>
          <Link href="/builder" onClick={() => setMenuOpen(false)}
            style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)', textDecoration: 'none', borderRadius: 8, background: 'var(--bg2)' }}>
            Builder
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" onClick={() => setMenuOpen(false)}
                style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)', textDecoration: 'none', borderRadius: 8, background: 'var(--bg2)' }}>
                Dashboard
              </Link>
              <button onClick={signOut}
                style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: 13, color: '#f87171', background: '#2a0a0a', border: '1px solid #4a1a1a', borderRadius: 8, cursor: 'pointer', textAlign: 'left' }}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth" onClick={() => setMenuOpen(false)}
                style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)', textDecoration: 'none', borderRadius: 8, background: 'var(--bg2)' }}>
                Sign in
              </Link>
              <Link href="/builder" onClick={() => setMenuOpen(false)}
                style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: 13, color: '#0a0a0a', textDecoration: 'none', borderRadius: 8, background: 'var(--accent)', fontWeight: 700, textAlign: 'center' }}>
                Get started →
              </Link>
            </>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </>
  )
}