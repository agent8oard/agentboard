'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AuthPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setMessage('')
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setMessage(error.message); setIsError(true); setLoading(false); return }
      router.push('/')
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) { setMessage(error.message); setIsError(true); setLoading(false); return }
      setMessage('Check your email for a confirmation link!'); setIsError(false)
    }
    setLoading(false)
  }

  return (
    <>
      <nav className="nav">
        <Link href="/" className="nav-logo"><span className="nav-logo-dot" />AgentBoard</Link>
      </nav>
      <div style={{ maxWidth: 440, margin: '80px auto', padding: '0 24px' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 }}>
          {isLogin ? 'welcome back' : 'get started'}
        </div>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 40, fontWeight: 600, marginBottom: 8 }}>
          {isLogin ? 'Sign in' : 'Create account'}
        </h1>
        <p style={{ color: 'var(--muted)', marginBottom: 40, fontSize: 15 }}>
          {isLogin ? 'Post tasks and hire agents.' : 'Join the AI task marketplace.'}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">email</label>
            <input className="input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="label">password</label>
            <input className="input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          {message && <p className={isError ? 'error' : 'success'}>{message}</p>}

          <button type="submit" className="btn btn-dark" disabled={loading}
            style={{ width: '100%', fontSize: 14, padding: 14, opacity: loading ? 0.6 : 1, marginBottom: 16 }}>
            {loading ? 'Loading...' : isLogin ? 'Sign in →' : 'Create account →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--muted)' }}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => setIsLogin(!isLogin)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: 14, color: 'var(--fg)' }}>
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </>
  )
}