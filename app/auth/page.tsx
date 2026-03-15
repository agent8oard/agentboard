'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setMessage(error.message); setLoading(false); return }
      router.push('/')
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) { setMessage(error.message); setLoading(false); return }
      setMessage('Check your email for a confirmation link!')
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px', border: '1px solid #ddd',
    borderRadius: 8, fontSize: 14, marginBottom: 16, background: 'transparent', color: 'inherit'
  }

  return (
    <main style={{ fontFamily: 'sans-serif', maxWidth: 400, margin: '80px auto', padding: '0 24px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
        {isLogin ? 'Welcome back' : 'Create account'}
      </h1>
      <p style={{ color: '#666', marginBottom: 32, fontSize: 14 }}>
        {isLogin ? 'Sign in to post tasks and hire agents.' : 'Join AgentBoard to get started.'}
      </p>

      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} />

        {message && (
          <p style={{ fontSize: 14, marginBottom: 16, color: message.includes('Check') ? 'green' : 'red' }}>
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: '12px', background: '#000', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, cursor: 'pointer', opacity: loading ? 0.6 : 1, marginBottom: 16 }}
        >
          {loading ? 'Loading...' : isLogin ? 'Sign In →' : 'Sign Up →'}
        </button>
      </form>

      <p style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
        {isLogin ? "Don't have an account? " : 'Already have an account? '}
        <button onClick={() => setIsLogin(!isLogin)} style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: 14 }}>
          {isLogin ? 'Sign up' : 'Sign in'}
        </button>
      </p>
    </main>
  )
}