'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import OnboardingWelcome from '@/components/OnboardingWelcome'
import OnboardingChecklist from '@/components/OnboardingChecklist'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [businessAgents, setBusinessAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null)

  // Onboarding state
  const [profile, setProfile] = useState<{ onboarding_step: number; onboarding_completed: boolean } | null>(null)
  const [showWelcome, setShowWelcome] = useState(false)
  const [showChecklist, setShowChecklist] = useState(false)
  const [hasKnowledge, setHasKnowledge] = useState(false)
  const [isElectron, setIsElectron] = useState(false)

  useEffect(() => {
    document.title = 'Dashboard | AgentBoard'
    setIsElectron(!!(window as Window & { electronAPI?: { isElectron?: boolean } }).electronAPI?.isElectron)
  }, [])

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      setUser(user)

      const { data: ba } = await supabase
        .from('business_agents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      const agents = ba || []
      setBusinessAgents(agents)

      // Check knowledge base
      const agentIds = agents.map((a: any) => a.id)
      if (agentIds.length > 0) {
        const { data: kb } = await supabase
          .from('knowledge_base')
          .select('id')
          .in('business_agent_id', agentIds)
          .limit(1)
        setHasKnowledge((kb || []).length > 0)
      }

      // Load or create profile
      const { data: prof } = await supabase
        .from('profiles')
        .select('onboarding_step, onboarding_completed')
        .eq('id', user.id)
        .single()

      const hasAgents = agents.length > 0

      if (!prof) {
        // No profile yet — existing users with agents get marked complete immediately
        if (hasAgents) {
          await supabase.from('profiles').insert({
            id: user.id,
            onboarding_step: 5,
            onboarding_completed: true,
          })
          setProfile({ onboarding_step: 5, onboarding_completed: true })
          // Don't show modal or checklist
        } else {
          await supabase.from('profiles').insert({
            id: user.id,
            onboarding_step: 0,
            onboarding_completed: false,
          })
          setProfile({ onboarding_step: 0, onboarding_completed: false })
          setShowWelcome(true)
        }
      } else {
        // Profile exists — never show anything if already completed or step > 0
        if (prof.onboarding_completed) {
          setProfile(prof)
          // Nothing to show
        } else if (hasAgents) {
          // Has agents but onboarding not marked complete — fix that now
          await supabase
            .from('profiles')
            .update({ onboarding_step: 5, onboarding_completed: true })
            .eq('id', user.id)
          setProfile({ onboarding_step: 5, onboarding_completed: true })
          // Nothing to show
        } else if (prof.onboarding_step === 0) {
          setProfile(prof)
          setShowWelcome(true)
        } else {
          setProfile(prof)
          setShowChecklist(true)
        }
      }

      setLoading(false)
    }
    load()
  }, [])

  const handleWelcomeDismiss = () => {
    setShowWelcome(false)
    setShowChecklist(true)
    setProfile(prev => prev ? { ...prev, onboarding_step: 1 } : null)
  }

  const handleChecklistComplete = useCallback(() => {
    setShowChecklist(false)
    setProfile(prev => prev ? { ...prev, onboarding_completed: true } : null)
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

  // Build checklist steps from live data
  const firstAgent = businessAgents[0]
  const hasAgent = businessAgents.length > 0
  const hasPortalCustomized = businessAgents.some(a =>
    (a.portal_tagline && a.portal_tagline.trim()) ||
    (a.portal_color && a.portal_color !== '#c8f135')
  )
  const hasPortalEnabled = businessAgents.some(a => a.portal_enabled)

  const checklistSteps = [
    {
      label: 'Create your account',
      done: true,
    },
    {
      label: 'Build your first AI agent',
      done: hasAgent,
      href: '/builder',
      linkLabel: 'Build agent →',
    },
    {
      label: 'Add knowledge base entries',
      done: hasKnowledge,
      href: firstAgent ? `/agent/${firstAgent.id}/manage` : '/builder',
      linkLabel: 'Add knowledge →',
    },
    {
      label: 'Customize your portal',
      done: hasPortalCustomized,
      href: firstAgent ? `/agent/${firstAgent.id}/manage` : '/builder',
      linkLabel: 'Customize →',
    },
    {
      label: 'Share your portal link',
      done: hasPortalEnabled,
      href: firstAgent ? `/agent/${firstAgent.id}/manage` : '/builder',
      linkLabel: 'Enable portal →',
    },
  ]

  if (loading) return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <div className="app-header">
          <span className="page-title">Dashboard</span>
        </div>
        <div className="dashboard-content" style={{ width: '100%', padding: '40px 48px' }}>
          <style>{`
            @keyframes shimmer { 0% { background-position: -400px 0 } 100% { background-position: 400px 0 } }
            .skeleton { background: linear-gradient(90deg, var(--bg2) 25%, var(--bg3) 50%, var(--bg2) 75%); background-size: 800px 100%; animation: shimmer 1.4s infinite; border-radius: 8px; }
          `}</style>
          {/* Banner skeleton */}
          <div className="skeleton" style={{ height: 110, borderRadius: 12, marginBottom: 28 }} />
          {/* Stats skeleton */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 40 }}>
            {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 90, borderRadius: 12 }} />)}
          </div>
          {/* Agent cards skeleton */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 180, borderRadius: 16 }} />)}
          </div>
        </div>
      </main>
    </div>
  )

  return (
    <div className="app-layout">
      <Sidebar />

      {/* Welcome screen overlay */}
      {showWelcome && user && (
        <OnboardingWelcome userId={user.id} onDismiss={handleWelcomeDismiss} />
      )}

      {deleteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Delete agent</span>
              <button onClick={() => { setDeleteModal(null); setDeleteConfirmText('') }} className="btn btn-ghost btn-sm">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: 'var(--fg2)', lineHeight: 1.6, marginBottom: 16 }}>
                You are about to permanently delete <strong style={{ color: 'var(--fg)' }}>{deleteModal.name}</strong>. This will delete all automations, memory, knowledge base, and history. This cannot be undone.
              </p>
              <div className="label">Type <span style={{ color: 'var(--red)' }}>delete</span> to confirm</div>
              <input
                className="input"
                style={{ color: 'var(--red)' }}
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && confirmDelete()}
                placeholder="delete"
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button onClick={() => { setDeleteModal(null); setDeleteConfirmText('') }} className="btn btn-outline">Cancel</button>
              <button onClick={confirmDelete} disabled={deleteConfirmText !== 'delete' || deleteLoading} className="btn btn-danger">
                {deleteLoading ? 'Deleting...' : 'Delete permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="app-main">
        <div className="app-header">
          <span className="page-title">Dashboard</span>
        </div>

        <div className="dashboard-content" style={{ width: '100%', padding: '40px 48px' }}>

          {/* Welcome banner */}
          <div style={{
            width: '100%',
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '36px 40px',
            marginBottom: 28,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 20,
          }}>
            <div>
              <div style={{
                fontSize: 32,
                fontWeight: 700,
                letterSpacing: '-0.8px',
                marginBottom: 10,
                color: 'var(--fg)',
                lineHeight: 1.1,
              }}>
                Welcome back{user?.user_metadata?.full_name
                  ? `, ${user.user_metadata.full_name.split(' ')[0]}`
                  : ''}
              </div>
              <div style={{ fontSize: 16, color: 'var(--fg3)', lineHeight: 1.5 }}>
                {businessAgents.length === 0
                  ? 'Build your first AI agent to get started.'
                  : `You have ${businessAgents.length} active AI agent${businessAgents.length > 1 ? 's' : ''} running.`}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {isElectron && (
                <button
                  onClick={() => {
                    const w = window as Window & { electronAPI?: { openDesktopMode?: () => void } }
                    w.electronAPI?.openDesktopMode?.()
                  }}
                  style={{ height: 44, padding: '0 22px', fontSize: 13, fontWeight: 600, background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 10, cursor: 'pointer', color: 'var(--fg)', fontFamily: 'var(--mono)', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                  Desktop Mode
                </button>
              )}
              <Link href="/builder" className="btn btn-accent" style={{ height: 44, padding: '0 28px', fontSize: 15, fontWeight: 600 }}>
                + Build new agent
              </Link>
            </div>
          </div>

          {/* Onboarding checklist */}
          {showChecklist && user && (
            <OnboardingChecklist
              userId={user.id}
              steps={checklistSteps}
              onComplete={handleChecklistComplete}
            />
          )}

          {/* Stats */}
          <div className="stats-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
            marginBottom: 40,
          }}>
            {[
              {
                label: 'AI Agents',
                value: businessAgents.length,
                color: 'var(--accent)',
                icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>,
              },
              {
                label: 'Plan',
                value: 'Free',
                color: 'var(--blue)',
                icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>,
              },
              {
                label: 'Status',
                value: 'Active',
                color: 'var(--green)',
                icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
              },
              {
                label: 'Member since',
                value: user?.created_at
                  ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                  : '—',
                color: 'var(--fg2)',
                icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
              },
            ].map(stat => (
              <div key={stat.label} style={{
                background: 'var(--bg2)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '24px 28px',
                display: 'flex',
                alignItems: 'center',
                gap: 18,
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: 'var(--bg3)', border: '1px solid var(--border2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: stat.color, flexShrink: 0,
                }}>
                  {stat.icon}
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--fg3)', marginBottom: 6, letterSpacing: 0.3 }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: stat.color, lineHeight: 1 }}>
                    {stat.value}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Agents section header */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--fg)', marginBottom: 4 }}>My AI Agents</div>
            <div style={{ fontSize: 14, color: 'var(--fg3)' }}>
              {businessAgents.length} agent{businessAgents.length !== 1 ? 's' : ''} total
            </div>
          </div>

          {businessAgents.length === 0 ? (
            <div style={{
              width: '100%',
              background: 'var(--bg2)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '80px 40px',
              textAlign: 'center',
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: 'var(--bg3)', border: '1px solid var(--border2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--fg3)', margin: '0 auto 24px',
              }}>
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
                </svg>
              </div>
              <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--fg2)', marginBottom: 10 }}>No agents yet</div>
              <div style={{ fontSize: 15, color: 'var(--fg3)', marginBottom: 28, maxWidth: 360, margin: '0 auto 28px', lineHeight: 1.6 }}>
                Build your first AI agent and put your business on autopilot in minutes.
              </div>
              <Link href="/builder" className="btn btn-accent" style={{ height: 44, padding: '0 28px', fontSize: 15, fontWeight: 600 }}>
                Build first agent →
              </Link>
            </div>
          ) : (
            <div className="agents-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: 16,
            }}>
              {businessAgents.map(ba => (
                <div key={ba.id}
                  style={{
                    background: 'var(--bg2)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    padding: '24px 28px',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s',
                  }}
                  onClick={() => router.push(`/agent/${ba.id}`)}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border3)'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'}>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 12,
                      background: 'var(--bg4)', border: '1px solid var(--border2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--sidebar-font)', fontSize: 20,
                      color: 'var(--fg)', flexShrink: 0, fontWeight: 700,
                    }}>
                      {ba.agent_name?.[0]}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{
                        fontSize: 17, fontWeight: 600,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        marginBottom: 3,
                      }}>
                        {ba.agent_name}
                      </div>
                      <div style={{
                        fontSize: 14, color: 'var(--fg3)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {ba.business_name}
                      </div>
                    </div>
                    <div className="badge badge-green" style={{ flexShrink: 0 }}>
                      <span className="status-dot green" />
                      active
                    </div>
                  </div>

                  <div style={{
                    display: 'flex', gap: 0, marginBottom: 18,
                    background: 'var(--bg3)', borderRadius: 8,
                    border: '1px solid var(--border)', overflow: 'hidden',
                  }}>
                    {[
                      { label: 'Industry', value: ba.industry || '—' },
                      { label: 'Tone', value: ba.tone || '—' },
                      { label: 'Automations', value: ba.automations?.length || 0 },
                    ].map((item, idx) => (
                      <div key={item.label} style={{
                        flex: 1, padding: '12px 16px',
                        borderRight: idx < 2 ? '1px solid var(--border)' : 'none',
                      }}>
                        <div style={{
                          fontFamily: 'var(--mono)', fontSize: 10,
                          color: 'var(--fg3)', marginBottom: 4,
                          textTransform: 'uppercase', letterSpacing: 0.5,
                        }}>
                          {item.label}
                        </div>
                        <div style={{
                          fontSize: 14, fontWeight: 500, color: 'var(--fg2)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{
                    display: 'flex', gap: 8,
                    paddingTop: 16, borderTop: '1px solid var(--border)',
                  }} onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => router.push(`/agent/${ba.id}`)}
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1, fontSize: 13, height: 34 }}>
                      Open agent
                    </button>
                    <Link
                      href={`/agent/${ba.id}/manage`}
                      className="btn btn-outline btn-sm"
                      style={{ flex: 1, fontSize: 13, height: 34, textAlign: 'center' }}
                      onClick={e => e.stopPropagation()}>
                      Manage
                    </Link>
                    <Link
                      href={`/agent/${ba.id}/analytics`}
                      className="btn btn-outline btn-sm"
                      style={{ flex: 1, fontSize: 13, height: 34, textAlign: 'center' }}
                      onClick={e => e.stopPropagation()}>
                      Analytics
                    </Link>
                    <button
                      onClick={e => { e.stopPropagation(); setDeleteModal({ id: ba.id, name: ba.agent_name }); setDeleteConfirmText('') }}
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--red)', fontSize: 13, flexShrink: 0, height: 34 }}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}

              <Link href="/builder" style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                border: '1px dashed var(--border2)', borderRadius: 12,
                padding: 32, textDecoration: 'none',
                color: 'var(--fg3)', gap: 12,
                transition: 'all 0.15s', minHeight: 200,
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border3)'
                  ;(e.currentTarget as HTMLAnchorElement).style.color = 'var(--fg2)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border2)'
                  ;(e.currentTarget as HTMLAnchorElement).style.color = 'var(--fg3)'
                }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  border: '1px dashed var(--border3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>New agent</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>Build in 5 minutes</div>
                </div>
              </Link>
            </div>
          )}
        </div>
      </main>

      <style>{`
        @media (max-width: 768px) {
          .dashboard-content { padding: 16px !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .agents-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
