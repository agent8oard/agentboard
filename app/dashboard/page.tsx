'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()
  const [agents, setAgents] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [proposals, setProposals] = useState<any[]>([])
  const [businessAgents, setBusinessAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [openTask, setOpenTask] = useState<string | null>(null)
  const [deletingAgent, setDeletingAgent] = useState<string | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const [{ data: a }, { data: t }, { data: p }, { data: ba }] = await Promise.all([
        supabase.from('agents').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('tasks').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('proposals').select('*').order('created_at', { ascending: false }),
        supabase.from('business_agents').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ])

      setAgents(a || [])
      setTasks(t || [])
      setProposals(p || [])
      setBusinessAgents(ba || [])
      setLoading(false)

      supabase
        .channel('proposals')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'proposals' }, payload => {
          setProposals(prev => [payload.new as any, ...prev])
        })
        .subscribe()
    }
    load()
  }, [])

  const getProposalsForTask = (taskId: string) => proposals.filter(p => p.task_id === taskId)

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
          <p style={{ color: 'var(--muted)', fontSize: 15 }}>Your AI agents, tasks, and automation programs.</p>
        </div>

        {/* My AI Agent Programs */}
        <div style={{ marginBottom: 56 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 400 }}>My AI Agent Programs</h2>
            <Link href="/builder" className="btn btn-accent" style={{ fontSize: 12, padding: '8px 18px' }}>+ Build agent</Link>
          </div>
          {businessAgents.length === 0 ? (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 40, textAlign: 'center' }}>
              <p style={{ color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 13, marginBottom: 16 }}>No AI agent programs yet.</p>
              <Link href="/builder" className="btn btn-outline" style={{ fontSize: 13 }}>Build your first agent →</Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {businessAgents.map(ba => (
                <div key={ba.id} style={{ position: 'relative' }}>
                  <Link href={`/agent/${ba.id}`} className="card" style={{ display: 'block', paddingBottom: 52 }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>{ba.industry}</div>
                    <h3 style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 400, marginBottom: 4 }}>{ba.agent_name}</h3>
                    <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>{ba.business_name}</p>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)' }}>
                      {ba.automations?.length} automations →
                    </div>
                  </Link>
                  <div style={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', gap: 6 }}>
                    <Link href={`/agent/${ba.id}/manage`}
                      style={{ fontFamily: 'var(--mono)', fontSize: 10, padding: '5px 10px', background: 'transparent', border: '1px solid var(--border2)', borderRadius: 6, color: 'var(--muted)', textDecoration: 'none' }}>
                      ⚙ manage
                    </Link>
                    <button
                      onClick={() => { setDeleteModal({ id: ba.id, name: ba.agent_name }); setDeleteConfirmText('') }}
                      disabled={deletingAgent === ba.id}
                      style={{ fontFamily: 'var(--mono)', fontSize: 10, padding: '5px 10px', background: 'transparent', border: '1px solid #4a1a1a', borderRadius: 6, color: '#f87171', cursor: 'pointer' }}>
                      🗑 delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <hr className="divider" />

        {/* My Agents */}
        <div style={{ marginBottom: 56 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 400 }}>My Agents</h2>
            <Link href="/agents/new" className="btn btn-accent" style={{ fontSize: 12, padding: '8px 18px' }}>+ List agent</Link>
          </div>
          {agents.length === 0 ? (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 40, textAlign: 'center' }}>
              <p style={{ color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 13, marginBottom: 16 }}>No agents listed yet.</p>
              <Link href="/agents/new" className="btn btn-outline" style={{ fontSize: 13 }}>List your first agent →</Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {agents.map(agent => (
                <div key={agent.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <span className="tag">{agent.category}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, padding: '3px 8px', borderRadius: 4, background: '#0d2e14', color: '#4ade80', border: '1px solid #1a4a24' }}>active</span>
                  </div>
                  <h3 style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 400, marginBottom: 6 }}>{agent.name}</h3>
                  <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 16 }}>{agent.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 500 }}>{agent.price_label}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>★ {agent.rating || '—'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <hr className="divider" />

        {/* My Tasks */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 400 }}>My Tasks</h2>
            <Link href="/tasks/new" className="btn btn-accent" style={{ fontSize: 12, padding: '8px 18px' }}>+ Post task</Link>
          </div>
          {tasks.length === 0 ? (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 40, textAlign: 'center' }}>
              <p style={{ color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 13, marginBottom: 16 }}>No tasks posted yet.</p>
              <Link href="/tasks/new" className="btn btn-outline" style={{ fontSize: 13 }}>Post your first task →</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {tasks.map(task => {
                const taskProposals = getProposalsForTask(task.id)
                const isOpen = openTask === task.id
                return (
                  <div key={task.id}>
                    <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center' }}>
                      <div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                          <span className="tag">{task.category}</span>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, padding: '3px 8px', borderRadius: 4, background: '#0d2e14', color: '#4ade80', border: '1px solid #1a4a24' }}>
                            {task.status}
                          </span>
                          {taskProposals.length > 0 && (
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, padding: '3px 8px', borderRadius: 4, background: '#0d1f3c', color: '#60a5fa', border: '1px solid #1a3560' }}>
                              {taskProposals.length} proposal{taskProposals.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <h3 style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 400, marginBottom: 6 }}>{task.title}</h3>
                        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{task.description}</p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 400, marginBottom: 8 }}>${task.budget}</div>
                        {taskProposals.length > 0 && (
                          <button onClick={() => setOpenTask(isOpen ? null : task.id)} className="btn btn-outline" style={{ fontSize: 11 }}>
                            {isOpen ? 'hide proposals' : 'view proposals'}
                          </button>
                        )}
                      </div>
                    </div>

                    {isOpen && taskProposals.length > 0 && (
                      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 16px 16px', padding: '20px 24px' }}>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>
                          Proposals received
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {taskProposals.map(proposal => (
                            <div key={proposal.id} style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 12, padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start' }}>
                              <div>
                                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>
                                  {new Date(proposal.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <p style={{ fontSize: 14, lineHeight: 1.6 }}>{proposal.message}</p>
                              </div>
                              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <div style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 400 }}>${proposal.bid_amount}</div>
                                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>bid</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}