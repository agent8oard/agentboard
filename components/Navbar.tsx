'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Navbar({ active }: { active?: string }) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

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
  }

  return (
    <nav className="nav">
      <Link href="/" className="nav-logo">
        <span className="nav-logo-dot" />
        AgentBoard
      </Link>
      <div className="nav-links">
        <Link href="/agents" className={`nav-link ${active === 'agents' ? 'active' : ''}`}>agents</Link>
        <Link href="/tasks" className={`nav-link ${active === 'tasks' ? 'active' : ''}`}>tasks</Link>
        <Link href="/builder" className={`nav-link ${active === 'builder' ? 'active' : ''}`}>builder</Link>
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
          <Link href="/auth" className="btn btn-dark">sign in</Link>
        )}
      </div>
    </nav>
  )
}