'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Agent {
  id: string
  agent_name: string
  business_name: string
  portal_color?: string
}

interface Message {
  role: string
  content: string
  timestamp: string
}

interface CalendarEvent {
  id: string
  title: string
  event_date: string
  event_time?: string
  notes?: string
}

interface Order {
  id: string
  client_name: string
  status: string
  grand_total?: number
  created_at: string
  order_number?: string
}

interface Conversation {
  id: string
  messages: { role: string; content: string }[]
  updated_at: string
  session_id: string
}

interface KbEntry {
  id: string
  title: string
  type: string
  content: string
}

// ─── Panel wrapper ────────────────────────────────────────────────────────────

function Panel({
  title,
  icon,
  onRefresh,
  loading,
  children,
}: {
  title: string
  icon: React.ReactNode
  onRefresh: () => void
  loading: boolean
  children: React.ReactNode
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 12, overflow: 'hidden', minHeight: 0,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 16px', borderBottom: '1px solid var(--border)',
        flexShrink: 0, background: 'var(--bg3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--fg3)' }}>{icon}</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: 'var(--fg3)', letterSpacing: 1.5, textTransform: 'uppercase' }}>{title}</span>
        </div>
        <button
          onClick={onRefresh}
          title="Refresh"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg3)', padding: '4px', borderRadius: 4, display: 'flex', alignItems: 'center', opacity: loading ? 0.5 : 1 }}
        >
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ transform: loading ? 'rotate(360deg)' : 'none', transition: loading ? 'transform 0.6s linear' : 'none' }}>
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>
          </svg>
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: 48, borderRadius: 8, background: 'var(--bg3)', animation: 'pulse 1.4s ease-in-out infinite', animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        ) : children}
      </div>
    </div>
  )
}

// ─── Panel: Chat ──────────────────────────────────────────────────────────────

function ChatPanel({ agentId }: { agentId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [agent, setAgent] = useState<Record<string, unknown> | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('business_agents').select('*').eq('id', agentId).single()
    setAgent(data)
    const { data: runs } = await supabase
      .from('automation_runs')
      .select('input, output, created_at')
      .eq('business_agent_id', agentId)
      .eq('automation_type', 'chat')
      .order('created_at', { ascending: true })
      .limit(30)
    if (runs) {
      const msgs: Message[] = []
      for (const r of runs) {
        if (r.input) msgs.push({ role: 'user', content: r.input, timestamp: r.created_at })
        if (r.output) msgs.push({ role: 'assistant', content: r.output, timestamp: r.created_at })
      }
      setMessages(msgs)
    }
    setLoading(false)
  }, [agentId])

  useEffect(() => { load() }, [load])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async () => {
    if (!input.trim() || sending || !agent) return
    const userMsg: Message = { role: 'user', content: input, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    const q = input
    setInput('')
    setSending(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }))
      const res = await fetch('/api/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ message: q, agent, history }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'Error', timestamp: new Date().toISOString() }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong.', timestamp: new Date().toISOString() }])
    }
    setSending(false)
  }

  return (
    <Panel title="Agent Chat" icon={<svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>} onRefresh={load} loading={loading}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 0 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10, minHeight: 0 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--fg3)', fontFamily: 'var(--mono)', fontSize: 11, padding: '20px 0' }}>
              No recent messages.<br />Start a conversation below.
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9, padding: '3px 7px', borderRadius: 5, flexShrink: 0, marginTop: 2, background: m.role === 'user' ? 'var(--bg4)' : 'rgba(200,241,53,0.12)', color: m.role === 'user' ? 'var(--fg3)' : 'var(--accent)' }}>
                {m.role === 'user' ? 'YOU' : 'AI'}
              </span>
              <span style={{ fontSize: 12, color: 'var(--fg)', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.content}</span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Ask your agent anything..."
            disabled={sending}
            style={{ flex: 1, padding: '8px 12px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--fg)', fontFamily: 'var(--sans)', fontSize: 12, outline: 'none' }}
          />
          <button onClick={send} disabled={sending || !input.trim()} style={{ padding: '8px 14px', background: 'var(--accent)', color: '#0a0a0a', border: 'none', borderRadius: 8, fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, cursor: 'pointer', opacity: (!input.trim() || sending) ? 0.5 : 1 }}>
            {sending ? '...' : '→'}
          </button>
        </div>
      </div>
    </Panel>
  )
}

// ─── Panel: Calendar ──────────────────────────────────────────────────────────

function CalendarPanel({ agentId }: { agentId: string }) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('business_agent_id', agentId)
      .gte('event_date', today)
      .order('event_date', { ascending: true })
      .limit(20)
    setEvents(data || [])
    setLoading(false)
  }, [agentId])

  useEffect(() => { load() }, [load])

  const formatTime = (t?: string) => {
    if (!t) return ''
    const [hStr, mStr] = t.split(':')
    const h = parseInt(hStr)
    if (isNaN(h)) return ''
    const m = mStr ? mStr.padStart(2, '0') : '00'
    return ` · ${h % 12 === 0 ? 12 : h % 12}:${m} ${h >= 12 ? 'PM' : 'AM'}`
  }

  return (
    <Panel title="Calendar" icon={<svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>} onRefresh={load} loading={loading}>
      {events.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--fg3)', fontFamily: 'var(--mono)', fontSize: 11, padding: '20px 0' }}>No upcoming events</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {events.map(ev => {
            const d = new Date(ev.event_date + 'T00:00:00')
            const isToday = ev.event_date === new Date().toISOString().split('T')[0]
            return (
              <div key={ev.id} style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--bg3)', border: `1px solid ${isToday ? 'rgba(59,130,246,0.4)' : 'var(--border)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>{ev.title}</span>
                  {isToday && <span style={{ fontFamily: 'var(--mono)', fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>TODAY</span>}
                </div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg3)' }}>
                  {d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}{formatTime(ev.event_time)}
                </span>
                {ev.notes && <div style={{ fontSize: 11, color: 'var(--fg3)', marginTop: 4, lineHeight: 1.4 }}>{ev.notes}</div>}
              </div>
            )
          })}
        </div>
      )}
    </Panel>
  )
}

// ─── Panel: Orders ────────────────────────────────────────────────────────────

function OrdersPanel({ agentId }: { agentId: string }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select('id, client_name, status, grand_total, created_at, order_number')
      .eq('business_agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(20)
    setOrders(data || [])
    setLoading(false)
  }, [agentId])

  useEffect(() => { load() }, [load])

  const statusColor = (s: string) => {
    if (s === 'completed') return { bg: 'rgba(34,197,94,0.1)', color: '#22c55e' }
    if (s === 'pending') return { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' }
    if (s === 'cancelled') return { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' }
    return { bg: 'var(--bg4)', color: 'var(--fg3)' }
  }

  return (
    <Panel title="Orders" icon={<svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>} onRefresh={load} loading={loading}>
      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--fg3)', fontFamily: 'var(--mono)', fontSize: 11, padding: '20px 0' }}>No orders yet</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {orders.map(o => {
            const sc = statusColor(o.status)
            return (
              <div key={o.id} style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--bg3)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.client_name}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg3)' }}>
                    {o.order_number ? `#${o.order_number} · ` : ''}{new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                  {o.grand_total != null && (
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg)' }}>${Number(o.grand_total).toFixed(2)}</span>
                  )}
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9, padding: '2px 7px', borderRadius: 4, background: sc.bg, color: sc.color, textTransform: 'uppercase' }}>{o.status}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Panel>
  )
}

// ─── Panel: Portal & Knowledge ────────────────────────────────────────────────

function PortalKbPanel({ agentId }: { agentId: string }) {
  const [convos, setConvos] = useState<Conversation[]>([])
  const [kb, setKb] = useState<KbEntry[]>([])
  const [tab, setTab] = useState<'convos' | 'kb'>('convos')
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: c }, { data: k }] = await Promise.all([
      supabase.from('portal_conversations').select('*').eq('business_agent_id', agentId).order('updated_at', { ascending: false }).limit(15),
      supabase.from('knowledge_base').select('id, title, type, content').eq('business_agent_id', agentId).order('created_at', { ascending: false }).limit(20),
    ])
    setConvos(c || [])
    setKb(k || [])
    setLoading(false)
  }, [agentId])

  useEffect(() => { load() }, [load])

  return (
    <Panel title="Portal & Knowledge" icon={<svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>} onRefresh={load} loading={loading}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {(['convos', 'kb'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ fontFamily: 'var(--mono)', fontSize: 10, padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', background: tab === t ? 'var(--fg)' : 'var(--bg4)', color: tab === t ? 'var(--bg)' : 'var(--fg3)', fontWeight: tab === t ? 700 : 400 }}>
            {t === 'convos' ? `Conversations (${convos.length})` : `Knowledge (${kb.length})`}
          </button>
        ))}
      </div>

      {tab === 'convos' && (
        convos.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--fg3)', fontFamily: 'var(--mono)', fontSize: 11, padding: '20px 0' }}>No portal conversations yet</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {convos.map(c => {
              const msgs = c.messages || []
              const firstUser = msgs.find(m => m.role === 'user')
              const isExp = expanded === c.id
              return (
                <div key={c.id} style={{ borderRadius: 8, background: 'var(--bg3)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                  <button onClick={() => setExpanded(isExp ? null : c.id)} style={{ width: '100%', padding: '9px 12px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, textAlign: 'left' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--fg3)', marginBottom: 2 }}>
                        {new Date(c.updated_at).toLocaleString()} · {msgs.length} msgs
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--fg2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {firstUser?.content?.slice(0, 80) || 'No messages'}
                      </div>
                    </div>
                    <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ transform: isExp ? 'rotate(180deg)' : 'none', flexShrink: 0, color: 'var(--fg3)' }}><path d="m6 9 6 6 6-6"/></svg>
                  </button>
                  {isExp && (
                    <div style={{ borderTop: '1px solid var(--border)', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {msgs.map((m, i) => (
                        <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, padding: '2px 6px', borderRadius: 4, flexShrink: 0, marginTop: 2, background: m.role === 'user' ? 'var(--bg4)' : 'rgba(200,241,53,0.12)', color: m.role === 'user' ? 'var(--fg3)' : 'var(--accent)' }}>{m.role}</span>
                          <span style={{ fontSize: 11, color: 'var(--fg)', lineHeight: 1.5 }}>{m.content}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      )}

      {tab === 'kb' && (
        kb.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--fg3)', fontFamily: 'var(--mono)', fontSize: 11, padding: '20px 0' }}>No knowledge base entries</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {kb.map(k => (
              <div key={k.id} style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--bg3)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: 7, alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'var(--bg4)', color: 'var(--fg3)', textTransform: 'uppercase' }}>{k.type}</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{k.title}</span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--fg3)', lineHeight: 1.5, margin: 0 }}>{k.content.slice(0, 100)}{k.content.length > 100 ? '…' : ''}</p>
              </div>
            ))}
          </div>
        )
      )}
    </Panel>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DesktopModePage() {
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [time, setTime] = useState(new Date())

  // Redirect non-Electron visitors
  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as Window & { electronAPI?: { isElectron?: boolean } }).electronAPI?.isElectron) {
      router.replace('/dashboard')
    }
  }, [router])

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Load agents
  useEffect(() => {
    document.title = 'Desktop Mode | AgentBoard'
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const { data } = await supabase
        .from('business_agents')
        .select('id, agent_name, business_name, portal_color')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      const list = data || []
      setAgents(list)
      if (list.length > 0) setSelectedAgentId(list[0].id)
      setLoading(false)
    }
    init()
  }, [router])

  const exit = () => {
    const w = window as Window & { electronAPI?: { closeWindow?: () => void } }
    if (w.electronAPI?.closeWindow) {
      w.electronAPI.closeWindow()
    } else {
      router.push('/dashboard')
    }
  }

  const selectedAgent = agents.find(a => a.id === selectedAgentId)

  if (loading) return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--fg3)' }}>Loading desktop mode...</span>
    </div>
  )

  if (agents.length === 0) return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 400 }}>No agents yet</div>
      <p style={{ color: 'var(--fg3)', fontSize: 14 }}>Build your first AI agent to use Desktop Mode.</p>
      <button onClick={() => router.push('/builder')} style={{ padding: '10px 24px', background: 'var(--accent)', color: '#0a0a0a', border: 'none', borderRadius: 8, fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
        Build an agent →
      </button>
    </div>
  )

  return (
    <div style={{ background: 'var(--bg)', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border3); border-radius: 2px; }
      `}</style>

      {/* ── Toolbar ── */}
      <div style={{
        height: 52,
        background: 'var(--bg2)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 16,
        flexShrink: 0,
        WebkitAppRegion: 'drag',
      } as React.CSSProperties}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ width: 24, height: 24, background: 'var(--accent)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="13" height="13" fill="#0a0a0a" viewBox="0 0 24 24"><path d="m13 2-2 2.5h3L12 7l1 1-2.5 3H14l-5 11 1-7H7l5-13z"/></svg>
          </div>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: 'var(--fg)', letterSpacing: -0.3 }}>AgentBoard</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg3)', padding: '2px 7px', background: 'var(--bg4)', borderRadius: 4 }}>DESKTOP</span>
        </div>

        <div style={{ width: 1, height: 20, background: 'var(--border2)', flexShrink: 0 }} />

        {/* Agent selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg3)' }}>AGENT</span>
          <select
            value={selectedAgentId}
            onChange={e => setSelectedAgentId(e.target.value)}
            style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 6, color: 'var(--fg)', fontFamily: 'var(--mono)', fontSize: 12, padding: '4px 10px', cursor: 'pointer', outline: 'none' }}
          >
            {agents.map(a => (
              <option key={a.id} value={a.id}>{a.agent_name} — {a.business_name}</option>
            ))}
          </select>
          {selectedAgent?.portal_color && (
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: selectedAgent.portal_color, flexShrink: 0 }} />
          )}
        </div>

        <div style={{ flex: 1 }} />

        {/* Clock */}
        <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--fg3)', flexShrink: 0 }}>
          {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          {' '}
          <span style={{ color: 'var(--fg)' }}>
            {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>

        <div style={{ width: 1, height: 20, background: 'var(--border2)', flexShrink: 0 }} />

        {/* Exit button */}
        <button
          onClick={exit}
          style={{
            WebkitAppRegion: 'no-drag',
            fontFamily: 'var(--mono)', fontSize: 11, padding: '6px 14px',
            background: 'transparent', border: '1px solid var(--border2)',
            borderRadius: 6, color: 'var(--fg3)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'all 0.15s',
          } as React.CSSProperties}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--red)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--red)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border2)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--fg3)' }}
        >
          <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
          Exit Desktop Mode
        </button>
      </div>

      {/* ── 4-panel grid ── */}
      {selectedAgentId ? (
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          gap: 10,
          padding: 10,
          minHeight: 0,
        }}>
          <ChatPanel agentId={selectedAgentId} />
          <CalendarPanel agentId={selectedAgentId} />
          <OrdersPanel agentId={selectedAgentId} />
          <PortalKbPanel agentId={selectedAgentId} />
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg3)', fontFamily: 'var(--mono)', fontSize: 12 }}>
          Select an agent above
        </div>
      )}
    </div>
  )
}
