'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()
  const [businessAgents, setBusinessAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const { data: ba } = await supabase
        .from('business_agents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setBusinessAgents(ba || [])
      setLoading(false)
    }
    load()
  }, [])

  const confirmDelete = async () => {
    if (!deleteModal || deleteConfirmText !== 'delete') return
    setDeleteLoading(true)
    await supabase.from('business_agents').delete().eq('id', deleteModal.id)
    setBusinessAgents(prev => prev.filter(a => a.id !== deleteModal.id))
    setDeleteModal(null)
    setDeleteConfirmText('')
    setDeleteLoading(false)
  }

  if (loading) return (
    <>
      <Navbar active="dashboard" />
      <div className="page" style={{ textAlign: 'center', paddingTop: 80 }}>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)' }}>Loading...</p>
      </div>
    </>
  )

  return (
    <>
      <Navbar active="dashboard" />

      {/* Delete confirmation modal */}
      {deleteModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: 'var(--bg)', border: '1px solid var(--border)',
            borderRadius: 20, width: '100%', maxWidth: 480, padding: '40px 40px',
            boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
          }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#2a0a0a', border: '1px solid #4a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 24 }}>
              🗑
            </div>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 400, marginBottom: 8 }}>
              Delete agent
            </h2>
            <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 8 }}>
              You are about to permanently delete
            </p>
            <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: 'var(--fg)' }}>
              {deleteModal.name}
            </p>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 28, padding: '12px 16px', background: '#2a0a0a', borderRadius: 8, border: '1px solid #4a1a1a' }}>
              This will permanently delete the agent, all its automations, memory, knowledge base, and conversation history. This action cannot be undone.
            </p>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 8, letterSpacing: 0.5 }}>
                Type <span style={{ color: '#f87171', fontWeight: 600 }}>delete</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder="delete"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && confirmDelete()}
                style={{
                  width: '100%', padding: '11px 16px',
                  border: `1px solid ${deleteConfirmText === 'delete' ? '#4a1a1a' : 'var(--border2)'}`,
                  borderRadius: 10, fontFamily: 'var(--mono)', fontSize: 14,
                  background: 'var(--bg2)', color: '#f87171', outline: 'none',
                  transition: 'border-color 0.15s',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={confirmDelete}
                disabled={deleteConfirmText !== 'delete' || deleteLoading}
                style={{
                  flex: 1, padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600,
                  background: deleteConfirmText === 'delete' ? '#7f1d1d' : 'var(--bg3)',
                  color: deleteConfirmText === 'delete' ? '#fca5a5' : 'var(--muted)',
                  opacity: deleteLoading ? 0.6 : 1,
                  transition: 'all 0.15s',
                }}>
                {deleteLoading ? 'Deleting...' : 'Delete agent permanently'}
              </button>
              <button
                onClick={() => { setDeleteModal(null); setDeleteConfirmText('') }}
                style={{
                  padding: '12px 20px', borderRadius: 10,
                  border: '1px solid var(--border2)', background: 'transparent',
                  color: 'var(--muted)', cursor: 'pointer',
                  fontFamily: 'var(--mono)', fontSize: 13,
                }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page">
        <div style={{ marginBottom: 48 }}>
          <div className="section-label">account</div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 48, fontWeight: 400, marginBottom: 8 }}>My Dashboard</h1>
          <p style={{ color: 'var(--muted)', fontSize: 15 }}>Your AI business agents.</p>
        </div>

        {/* My AI Agent Programs */}
        <div style={{ marginBottom: 56 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 400 }}>My AI Agents</h2>
            <Link href="/builder" className="btn btn-accent" style={{ fontSize: 12, padding: '8px 18px' }}>+ Build agent</Link>
          </div>

          {businessAgents.length === 0 ? (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: '60px 40px', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🤖</div>
              <h3 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 400, marginBottom: 8 }}>No agents yet</h3>
              <p style={{ color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 13, marginBottom: 24 }}>
                Build your first AI agent and put your business on autopilot.
              </p>
              <Link href="/builder" className="btn btn-accent" style={{ fontSize: 13 }}>
                Build your first agent →
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {businessAgents.map(ba => (
                <div key={ba.id} style={{ position: 'relative' }}>
                  <Link href={`/agent/${ba.id}`} className="card" style={{ display: 'block', paddingBottom: 52, textDecoration: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: 'var(--fg)', color: 'var(--bg)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--serif)', fontSize: 18,
                      }}>
                        {ba.agent_name?.[0]}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#4ade80' }}>active</span>
                        </div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)' }}>{ba.industry}</div>
                      </div>
                    </div>
                    <h3 style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 400, marginBottom: 4 }}>{ba.agent_name}</h3>
                    <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>{ba.business_name}</p>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)' }}>
                      {ba.automations?.length || 0} automations →
                    </div>
                  </Link>
                  <div style={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', gap: 6 }}>
                    <Link href={`/agent/${ba.id}/manage`}
                      style={{ fontFamily: 'var(--mono)', fontSize: 10, padding: '5px 10px', background: 'transparent', border: '1px solid var(--border2)', borderRadius: 6, color: 'var(--muted)', textDecoration: 'none' }}>
                      ⚙ manage
                    </Link>
                    <button
                      onClick={() => { setDeleteModal({ id: ba.id, name: ba.agent_name }); setDeleteConfirmText('') }}
                      style={{ fontFamily: 'var(--mono)', fontSize: 10, padding: '5px 10px', background: 'transparent', border: '1px solid #4a1a1a', borderRadius: 6, color: '#f87171', cursor: 'pointer' }}>
                      🗑 delete
                    </button>
                  </div>
                </div>
              ))}

              {/* Build new agent card */}
              <Link href="/builder" style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                background: 'transparent', border: '2px dashed var(--border2)', borderRadius: 16,
                padding: '40px 20px', textDecoration: 'none', minHeight: 180, transition: 'border-color 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--fg)'}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border2)'}
              >
                <div style={{ fontSize: 28, marginBottom: 10 }}>+</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>Build new agent</div>
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}