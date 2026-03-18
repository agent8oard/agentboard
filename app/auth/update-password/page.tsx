'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const inputStyle = {
    width: '100%', padding: '12px 16px',
    border: '1px solid var(--border2)', borderRadius: 10,
    fontFamily: 'var(--sans)', fontSize: 14,
    background: 'var(--bg2)', color: 'var(--fg)', outline: 'none',
  }

  const handleUpdate = async () => {
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }

    setLoading(true)
    setError('')

    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
    } else {
      setSuccess('Password updated! Redirecting...')
      setTimeout(() => router.push('/dashboard'), 2000)
    }
    setLoading(false)
  }

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 460, margin: '0 auto', padding: '72px 24px' }}>
        <div style={{ marginBottom: 36, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--fg)', color: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 32, fontWeight: 400, marginBottom: 8 }}>Set new password</h1>
          <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>Enter your new password below.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
          <div>
            <label style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>New password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" style={inputStyle} autoFocus />
          </div>
          <div>
            <label style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>Confirm password</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat your password" style={inputStyle}
              onKeyDown={e => e.key === 'Enter' && handleUpdate()} />
          </div>
        </div>

        {error && (
          <div style={{ background: '#2a0a0a', border: '1px solid #4a1a1a', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontFamily: 'var(--mono)', fontSize: 12, color: '#f87171' }}>
            ✗ {error}
          </div>
        )}

        {success && (
          <div style={{ background: '#0d2e14', border: '1px solid #1a4a24', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontFamily: 'var(--mono)', fontSize: 12, color: '#4ade80' }}>
            ✓ {success}
          </div>
        )}

        <button onClick={handleUpdate} disabled={loading || !password || !confirm} className="btn btn-accent"
          style={{ width: '100%', fontSize: 14, padding: '13px', opacity: (loading || !password || !confirm) ? 0.5 : 1 }}>
          {loading ? 'Updating...' : 'Update password →'}
        </button>
      </div>
    </>
  )
}
