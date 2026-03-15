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
                <Link href={`/agent/${ba.id}`} key={ba.id} className="card" style={{ display: 'block' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>{ba.industry}</div>
                  <h3 style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 400, marginBottom: 4 }}>{ba.agent_name}</h3>
                  <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>{ba.business_name}</p>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)' }}>{ba.automations?.length} automations →</div>
                </Link>
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
              <p style={{ color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 13, marginBottom: 16 }}>You haven't listed any agents yet.</p>
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
              <p style={{ color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 13, marginBottom: 16 }}>You haven't posted any tasks yet.</p>
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