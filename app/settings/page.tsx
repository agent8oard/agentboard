'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { useRouter } from 'next/navigation'

const VALID_TABS = ['profile', 'security', 'billing', 'privacy'] as const
type Tab = typeof VALID_TABS[number]

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState<'success' | 'error'>('success')

  const [profile, setProfile] = useState({
    full_name: '',
    business_name: '',
    phone: '',
    timezone: 'UTC',
  })

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  })

  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    // Restore active tab from URL hash
    const hash = window.location.hash.replace('#', '') as Tab
    if (VALID_TABS.includes(hash)) setActiveTab(hash)

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      setUser(user)
      setProfile({
        full_name: user.user_metadata?.full_name || '',
        business_name: user.user_metadata?.business_name || '',
        phone: user.user_metadata?.phone || '',
        timezone: user.user_metadata?.timezone || 'UTC',
      })
      setLoading(false)
    }
    load()
  }, [])

  const switchTab = (tab: Tab) => {
    setActiveTab(tab)
    window.history.replaceState(null, '', `#${tab}`)
  }

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setMsg(text); setMsgType(type)
    setTimeout(() => setMsg(''), 4000)
  }

  const saveProfile = async () => {
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ data: profile })
    if (error) showMsg(error.message, 'error')
    else showMsg('Profile updated successfully!')
    setSaving(false)
  }

  const updatePassword = async () => {
    if (passwords.new !== passwords.confirm) { showMsg('Passwords do not match', 'error'); return }
    if (passwords.new.length < 6) { showMsg('Password must be at least 6 characters', 'error'); return }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: passwords.new })
    if (error) showMsg(error.message, 'error')
    else { showMsg('Password updated successfully!'); setPasswords({ current: '', new: '', confirm: '' }) }
    setSaving(false)
  }

  const sendResetEmail = async () => {
    setSaving(true)
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    })
    if (error) showMsg(error.message, 'error')
    else showMsg('Password reset email sent to ' + user.email)
    setSaving(false)
  }

  const deleteAccount = async () => {
    if (deleteConfirm !== 'delete my account') return
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
      const json = await res.json()
      if (json.error) {
        showMsg(`Deletion failed: ${json.error}`, 'error')
        setSaving(false)
        return
      }
      await supabase.auth.signOut()
      router.push('/?deleted=1')
    } catch {
      showMsg('Something went wrong. Please try again.', 'error')
      setSaving(false)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px',
    border: '1px solid var(--border2)', borderRadius: 8,
    fontFamily: 'var(--sans)', fontSize: 14,
    background: 'var(--bg2)', color: 'var(--fg)', outline: 'none',
  }

  const tabStyle = (tab: string) => ({
    fontFamily: 'var(--mono)', fontSize: 12, padding: '8px 18px',
    borderRadius: 8, cursor: 'pointer', border: 'none',
    background: activeTab === tab ? 'var(--fg)' : 'transparent',
    color: activeTab === tab ? 'var(--bg)' : 'var(--muted)',
    transition: 'all 0.15s',
    textAlign: 'left' as const,
  })

  const TIMEZONES = [
    'UTC', 'America/New_York', 'America/Chicago', 'America/Denver',
    'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
    'Asia/Dubai', 'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney',
    'Australia/Perth', 'Pacific/Auckland',
  ]

  if (loading) return (
    <>
      <Navbar />
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 13 }}>Loading...</div>
    </>
  )

  return (
    <>
      <Navbar />

      {/* Delete account modal */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 20, width: '100%', maxWidth: 480, padding: '40px' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#2a0a0a', border: '1px solid #4a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 24 }}>⚠️</div>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 400, marginBottom: 8 }}>Delete account</h2>
            <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 24 }}>
              This will permanently delete your account, all your agents, documents, contacts, and data. This cannot be undone.
            </p>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>
                Type <span style={{ color: '#f87171' }}>delete my account</span> to confirm
              </label>
              <input style={inputStyle} value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder="delete my account" />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={deleteAccount} disabled={deleteConfirm !== 'delete my account' || saving}
                style={{ flex: 1, padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, background: deleteConfirm === 'delete my account' ? '#7f1d1d' : 'var(--bg3)', color: deleteConfirm === 'delete my account' ? '#fca5a5' : 'var(--muted)' }}>
                {saving ? 'Deleting...' : 'Delete permanently'}
              </button>
              <button onClick={() => { setShowDeleteModal(false); setDeleteConfirm('') }} disabled={saving} className="btn btn-outline" style={{ fontSize: 13 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .settings-wrapper { padding: 16px !important; }
          .settings-layout { grid-template-columns: 1fr !important; }
          .settings-header { flex-direction: column !important; align-items: flex-start !important; gap: 12px; }
          .settings-form-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="settings-wrapper" style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>

        <div className="settings-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Account</div>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 36, fontWeight: 400, marginBottom: 4 }}>Settings</h1>
            <p style={{ fontSize: 14, color: 'var(--muted)' }}>{user?.email}</p>
          </div>
          <button onClick={() => router.push('/dashboard')} className="btn btn-outline" style={{ fontSize: 12 }}>← Dashboard</button>
        </div>

        {msg && (
          <div style={{ background: msgType === 'success' ? '#0d2e14' : '#2a0a0a', border: `1px solid ${msgType === 'success' ? '#1a4a24' : '#4a1a1a'}`, borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontFamily: 'var(--mono)', fontSize: 12, color: msgType === 'success' ? '#4ade80' : '#f87171' }}>
            {msgType === 'success' ? '✓ ' : '✗ '}{msg}
          </div>
        )}

        <div className="settings-layout" style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 32 }}>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { key: 'profile', label: 'Profile', icon: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
              { key: 'security', label: 'Security', icon: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> },
              { key: 'billing', label: 'Billing', icon: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg> },
              { key: 'privacy', label: 'Privacy', icon: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
            ].map(item => (
              <button key={item.key} onClick={() => switchTab(item.key as Tab)} style={{ ...tabStyle(item.key), display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
                {item.icon} {item.label}
              </button>
            ))}

            <div style={{ borderTop: '1px solid var(--border)', marginTop: 16, paddingTop: 16 }}>
              <button onClick={signOut} style={{ width: '100%', fontFamily: 'var(--mono)', fontSize: 12, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border2)', background: 'transparent', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                Sign out
              </button>
            </div>
          </div>

          {/* Content */}
          <div>

            {/* PROFILE */}
            {activeTab === 'profile' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 28 }}>
                  <h2 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 400, marginBottom: 4 }}>Profile information</h2>
                  <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>Update your personal details.</p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, padding: 20, background: 'var(--bg3)', borderRadius: 12, border: '1px solid var(--border)' }}>
                    <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--fg)', color: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontSize: 24, flexShrink: 0 }}>
                      {user?.email?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 2 }}>{profile.full_name || user?.email?.split('@')[0]}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>{user?.email}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#4ade80', marginTop: 4 }}>● Active account</div>
                    </div>
                  </div>

                  <div className="settings-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div>
                      <label style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>Full name</label>
                      <input style={inputStyle} placeholder="John Smith" value={profile.full_name} onChange={e => setProfile({ ...profile, full_name: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>Business name</label>
                      <input style={inputStyle} placeholder="Acme Corp" value={profile.business_name} onChange={e => setProfile({ ...profile, business_name: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>Phone number</label>
                      <input style={inputStyle} placeholder="+1 234 567 8900" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>Timezone</label>
                      <select style={inputStyle} value={profile.timezone} onChange={e => setProfile({ ...profile, timezone: e.target.value })}>
                        {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>Email address</label>
                    <input style={{ ...inputStyle, opacity: 0.6 }} value={user?.email} disabled />
                    <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>Email cannot be changed. Contact support if needed.</p>
                  </div>
                  <button onClick={saveProfile} disabled={saving} className="btn btn-accent" style={{ fontSize: 13 }}>
                    {saving ? 'Saving...' : 'Save changes →'}
                  </button>
                </div>

                <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 28 }}>
                  <h2 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 400, marginBottom: 4 }}>Account details</h2>
                  <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>Information about your account.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { label: 'Account ID', value: user?.id?.slice(0, 8) + '...' },
                      { label: 'Email', value: user?.email },
                      { label: 'Account created', value: user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
                      { label: 'Last sign in', value: user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
                      { label: 'Plan', value: 'Free' },
                    ].map(item => (
                      <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>{item.label}</span>
                        <span style={{ fontSize: 13 }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SECURITY */}
            {activeTab === 'security' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 28 }}>
                  <h2 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 400, marginBottom: 4 }}>Change password</h2>
                  <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>Update your password to keep your account secure.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
                    <div>
                      <label style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>New password</label>
                      <input type="password" style={inputStyle} placeholder="Min. 6 characters" value={passwords.new} onChange={e => setPasswords({ ...passwords, new: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>Confirm new password</label>
                      <input type="password" style={inputStyle} placeholder="Repeat new password" value={passwords.confirm} onChange={e => setPasswords({ ...passwords, confirm: e.target.value })} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={updatePassword} disabled={saving || !passwords.new || !passwords.confirm} className="btn btn-accent" style={{ fontSize: 13, opacity: (!passwords.new || !passwords.confirm) ? 0.5 : 1 }}>
                      {saving ? 'Updating...' : 'Update password →'}
                    </button>
                    <button onClick={sendResetEmail} disabled={saving} className="btn btn-outline" style={{ fontSize: 13 }}>
                      Send reset email instead
                    </button>
                  </div>
                </div>

                <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 28 }}>
                  <h2 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 400, marginBottom: 4 }}>Active sessions</h2>
                  <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>Manage where you are signed in.</p>
                  <div style={{ padding: '16px 20px', background: 'var(--bg3)', borderRadius: 10, border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>Current session</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>Signed in as {user?.email}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#4ade80' }}>Active</span>
                    </div>
                  </div>
                  <button onClick={signOut} style={{ fontFamily: 'var(--mono)', fontSize: 12, padding: '10px 20px', background: 'transparent', border: '1px solid var(--border2)', borderRadius: 8, cursor: 'pointer', color: '#f87171' }}>
                    Sign out of all sessions
                  </button>
                </div>
              </div>
            )}

            {/* BILLING */}
            {activeTab === 'billing' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 28 }}>
                  <h2 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 400, marginBottom: 4 }}>Current plan</h2>
                  <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>You are on the free plan.</p>
                  <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)', letterSpacing: 2, marginBottom: 6 }}>CURRENT PLAN</div>
                        <div style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 400 }}>Free</div>
                      </div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, padding: '4px 12px', borderRadius: 20, background: '#0d2e14', color: '#4ade80', border: '1px solid #1a4a24' }}>Active</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {['1 AI agent', 'All core features', 'Document generation', 'Calendar & automations', 'Knowledge base & contacts'].map(f => (
                        <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--muted)' }}>
                          <svg width="14" height="14" fill="none" stroke="#4ade80" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ background: 'var(--fg)', color: 'var(--bg)', borderRadius: 12, padding: 24 }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 11, opacity: 0.5, letterSpacing: 2, marginBottom: 8 }}>COMING SOON</div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 400, marginBottom: 12 }}>Pro Plan</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                      {['Unlimited agents', 'Priority support', 'Gmail & Google Calendar integration', 'White label branding', 'Team access', 'Advanced analytics'].map(f => (
                        <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, opacity: 0.7 }}>
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>
                          {f}
                        </div>
                      ))}
                    </div>
                    <button disabled style={{ fontFamily: 'var(--mono)', fontSize: 12, padding: '10px 20px', background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: 8, cursor: 'not-allowed', color: 'rgba(0,0,0,0.5)' }}>
                      Coming soon
                    </button>
                  </div>
                </div>

                <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 28 }}>
                  <h2 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 400, marginBottom: 4 }}>Billing history</h2>
                  <p style={{ fontSize: 13, color: 'var(--muted)' }}>No billing history yet. You are on the free plan.</p>
                </div>
              </div>
            )}

            {/* PRIVACY */}
            {activeTab === 'privacy' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 28 }}>
                  <h2 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 400, marginBottom: 4 }}>Privacy & data</h2>
                  <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>How we handle your data.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {[
                      { title: 'Your data stays yours', desc: 'All data you enter — contacts, knowledge base, documents — belongs to you. We never sell or share your data with third parties.' },
                      { title: 'AI processing', desc: 'Your messages are processed by Anthropic Claude AI to generate responses. Anthropic does not use your data to train their models.' },
                      { title: 'Email sending', desc: 'Emails are sent via Resend. Your email content is processed only to deliver messages and is not stored by Resend.' },
                      { title: 'Data storage', desc: 'All your data is stored securely in Supabase (PostgreSQL) with row-level security. Only you can access your data.' },
                      { title: 'Data deletion', desc: 'You can delete your account and all associated data at any time. Deletion is permanent and irreversible.' },
                    ].map(item => (
                      <div key={item.title} style={{ padding: '16px 20px', background: 'var(--bg3)', borderRadius: 10, border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>{item.title}</div>
                        <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{item.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 28 }}>
                  <h2 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 400, marginBottom: 4 }}>Export your data</h2>
                  <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>Download a copy of all your data including contacts, documents, and agent configurations.</p>
                  <button disabled style={{ fontFamily: 'var(--mono)', fontSize: 12, padding: '10px 20px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, cursor: 'not-allowed', color: 'var(--muted)' }}>
                    Export data (coming soon)
                  </button>
                </div>

                <div style={{ background: '#2a0a0a', border: '1px solid #4a1a1a', borderRadius: 16, padding: 28 }}>
                  <h2 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 400, marginBottom: 4, color: '#f87171' }}>Danger zone</h2>
                  <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>Permanently delete your account and all associated data. This action cannot be undone.</p>
                  <button onClick={() => setShowDeleteModal(true)}
                    style={{ fontFamily: 'var(--mono)', fontSize: 12, padding: '10px 20px', background: 'transparent', border: '1px solid #4a1a1a', borderRadius: 8, cursor: 'pointer', color: '#f87171' }}>
                    Delete my account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}