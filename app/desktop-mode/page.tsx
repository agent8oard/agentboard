'use client'

import { useEffect, useState, useCallback, useRef, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

type PanelType =
  | 'chat' | 'dashboard' | 'knowledge' | 'contacts'
  | 'orders' | 'quotes' | 'automations' | 'analytics'
  | 'calendar' | 'conversations' | 'memory' | 'team'
  | 'documents' | 'portal-preview' | 'browser'

type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se'

interface PanelInstance {
  id: string
  type: PanelType
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  isMinimized: boolean
  isMaximized: boolean
  refreshKey: number
}

interface Agent {
  id: string
  agent_name: string
  business_name: string
  portal_color?: string
  greeting?: string
  system_prompt?: string
}

// ─── Panel registry ───────────────────────────────────────────────────────────

interface PanelDef {
  type: PanelType
  label: string
  desc: string
  icon: React.ReactNode
  defaultW: number
  defaultH: number
}

function Ico({ d, size = 13 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d={d} />
    </svg>
  )
}

const PANEL_DEFS: PanelDef[] = [
  { type: 'chat',           label: 'Chat',                desc: 'Live agent chat interface',       icon: <Ico d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,                                                                             defaultW: 400, defaultH: 500 },
  { type: 'dashboard',      label: 'Dashboard',           desc: 'Agent overview & health score',   icon: <Ico d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />,                                                                                     defaultW: 500, defaultH: 400 },
  { type: 'knowledge',      label: 'Knowledge Base',      desc: 'View and add KB entries',         icon: <Ico d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 0 3-3h7z" />,                                                    defaultW: 450, defaultH: 500 },
  { type: 'contacts',       label: 'Contacts',            desc: 'Searchable contacts list',        icon: <Ico d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />,                                                           defaultW: 400, defaultH: 500 },
  { type: 'orders',         label: 'Orders',              desc: 'Orders with status badges',       icon: <Ico d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" />,                                                         defaultW: 600, defaultH: 350 },
  { type: 'quotes',         label: 'Quotes',              desc: 'Quotes and proposals list',       icon: <Ico d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8" />,                                            defaultW: 600, defaultH: 350 },
  { type: 'automations',    label: 'Automations',         desc: 'Scheduled automation tasks',      icon: <Ico d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,                                                                                            defaultW: 500, defaultH: 350 },
  { type: 'analytics',      label: 'Analytics',           desc: 'Key stats and metrics',           icon: <Ico d="M18 20V10M12 20V4M6 20v-6" />,                                                                                                               defaultW: 600, defaultH: 400 },
  { type: 'calendar',       label: 'Calendar',            desc: 'Upcoming events',                 icon: <Ico d="M8 2v4M16 2v4M3 10h18M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z" />,                                          defaultW: 350, defaultH: 450 },
  { type: 'conversations',  label: 'Portal Conversations',desc: 'Customer chat history',           icon: <Ico d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />, defaultW: 500, defaultH: 400 },
  { type: 'memory',         label: 'Memory',              desc: 'Agent memory entries',            icon: <Ico d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 6v4l3 3" />,                                                                                     defaultW: 400, defaultH: 400 },
  { type: 'team',           label: 'Team',                desc: 'Team members list',               icon: <Ico d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />,      defaultW: 400, defaultH: 350 },
  { type: 'documents',      label: 'Documents',           desc: 'Generated documents list',        icon: <Ico d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8" />,                                                    defaultW: 500, defaultH: 350 },
  { type: 'portal-preview', label: 'Portal Preview',      desc: 'Live customer portal preview',    icon: <Ico d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,                                                                                         defaultW: 600, defaultH: 500 },
  { type: 'browser',        label: 'Browser',             desc: 'Built-in web browser',            icon: <Ico d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 0-4-10 15.3 15.3 0 0 0 4-10z" />, defaultW: 700, defaultH: 500 },
]

// ─── Constants ────────────────────────────────────────────────────────────────

function genId() { return Math.random().toString(36).slice(2, 10) }
const STORAGE_KEY = 'agentboard-desktop-v3'
const MIN_W = 280
const MIN_H = 200
const HEADER_H = 40
const TOOLBAR_H = 68

const HANDLE_CURSORS: Record<ResizeHandle, string> = {
  n: 'n-resize', s: 's-resize', e: 'e-resize', w: 'w-resize',
  nw: 'nw-resize', ne: 'ne-resize', sw: 'sw-resize', se: 'se-resize',
}

function makeDefaultPanels(): PanelInstance[] {
  return [
    { id: genId(), type: 'chat',     x: 20,  y: 20,  width: 400, height: 500, zIndex: 1, isMinimized: false, isMaximized: false, refreshKey: 0 },
    { id: genId(), type: 'orders',   x: 440, y: 20,  width: 600, height: 350, zIndex: 2, isMinimized: false, isMaximized: false, refreshKey: 0 },
    { id: genId(), type: 'calendar', x: 440, y: 390, width: 350, height: 450, zIndex: 3, isMinimized: false, isMaximized: false, refreshKey: 0 },
  ]
}

// ─── Shimmer ──────────────────────────────────────────────────────────────────

function Shimmer({ rows = 3 }: { rows?: number }) {
  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} style={{ height: 44, borderRadius: 8, background: '#1a1a1a', animation: 'pulse 1.4s ease-in-out infinite', animationDelay: `${i * 0.1}s` }} />
      ))}
    </div>
  )
}

// ─── Empty ────────────────────────────────────────────────────────────────────

function Empty({ label }: { label: string }) {
  return (
    <div style={{ textAlign: 'center', color: '#3a3a3a', fontFamily: 'var(--mono)', fontSize: 11, padding: '32px 16px' }}>
      {label}
    </div>
  )
}

// ─── Flip Clock ───────────────────────────────────────────────────────────────

function FlipDigit({ digit }: { digit: string }) {
  const [display, setDisplay] = useState(digit)
  const [phase, setPhase] = useState<'idle' | 'out' | 'in'>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRef = useRef(digit)

  useEffect(() => {
    if (digit === display) return
    pendingRef.current = digit
    if (phase === 'idle') {
      setPhase('out')
      timerRef.current = setTimeout(() => {
        setDisplay(pendingRef.current)
        setPhase('in')
        timerRef.current = setTimeout(() => setPhase('idle'), 100)
      }, 100)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [digit])

  const transform =
    phase === 'out' ? 'rotateX(-90deg) scale(0.95)' :
    phase === 'in'  ? 'rotateX(0deg) scale(1)' :
    'rotateX(0deg) scale(1)'

  const transition =
    phase === 'out' ? 'transform 0.1s ease-in, opacity 0.1s ease-in' :
    phase === 'in'  ? 'transform 0.1s ease-out, opacity 0.1s ease-out' :
    'none'

  return (
    <div style={{ perspective: 600, width: 32, height: 46, flexShrink: 0 }}>
      <div style={{
        width: '100%', height: '100%',
        background: 'linear-gradient(180deg, #1e1e1e 0%, #161616 100%)',
        border: '1px solid #2e2e2e',
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"Courier New", Courier, monospace',
        fontVariantNumeric: 'tabular-nums',
        fontSize: 26,
        fontWeight: 700,
        color: '#c8f135',
        letterSpacing: -1,
        transform,
        transition,
        boxShadow: '0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Center divider line */}
        <div style={{
          position: 'absolute',
          left: 0, right: 0,
          top: '50%',
          height: 1,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 1,
          pointerEvents: 'none',
        }} />
        {display}
      </div>
    </div>
  )
}

function FlipColon() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 6, height: 46, width: 14, flexShrink: 0, paddingBottom: 2,
    }}>
      <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#3a3a3a' }} />
      <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#3a3a3a' }} />
    </div>
  )
}

function FlipClock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 200)
    return () => clearInterval(t)
  }, [])

  const h = now.getHours().toString().padStart(2, '0')
  const m = now.getMinutes().toString().padStart(2, '0')
  const s = now.getSeconds().toString().padStart(2, '0')
  const dayName = now.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <FlipDigit digit={h[0]} />
        <FlipDigit digit={h[1]} />
        <FlipColon />
        <FlipDigit digit={m[0]} />
        <FlipDigit digit={m[1]} />
        <FlipColon />
        <FlipDigit digit={s[0]} />
        <FlipDigit digit={s[1]} />
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#3a3a3a', letterSpacing: 1 }}>
        {dayName} · {dateStr}
      </div>
    </div>
  )
}

// ─── Panel: Chat ──────────────────────────────────────────────────────────────

function ChatContent({ agentId }: { agentId: string }) {
  const [messages, setMessages] = useState<{ role: string; content: string; timestamp: string }[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [agent, setAgent] = useState<Record<string, unknown> | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data: ag } = await supabase.from('business_agents').select('*').eq('id', agentId).single()
      setAgent(ag)
      const { data: runs } = await supabase.from('automation_runs')
        .select('input, output, created_at')
        .eq('business_agent_id', agentId).eq('automation_type', 'chat')
        .order('created_at', { ascending: true }).limit(50)
      if (runs) {
        const msgs: { role: string; content: string; timestamp: string }[] = []
        for (const r of runs) {
          if (r.input) msgs.push({ role: 'user', content: r.input, timestamp: r.created_at })
          if (r.output) msgs.push({ role: 'assistant', content: r.output, timestamp: r.created_at })
        }
        setMessages(msgs)
      }
      setLoading(false)
    }
    load()
  }, [agentId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async () => {
    if (!input.trim() || sending || !agent) return
    const q = input
    setMessages(prev => [...prev, { role: 'user', content: q, timestamp: new Date().toISOString() }])
    setInput('')
    setSending(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ message: q, agent, history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })) }),
      })
      const d = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: d.reply || 'Error', timestamp: new Date().toISOString() }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong.', timestamp: new Date().toISOString() }])
    }
    setSending(false)
  }

  if (loading) return <Shimmer />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '12px 14px' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', marginBottom: 12 }}>
        {messages.length === 0 && <Empty label={'No chat history.\nStart a conversation below.'} />}
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, padding: '3px 7px', borderRadius: 5, flexShrink: 0, marginTop: 2, background: m.role === 'user' ? '#1a1a1a' : 'rgba(200,241,53,0.08)', color: m.role === 'user' ? '#555' : '#c8f135' }}>
              {m.role === 'user' ? 'YOU' : 'AI'}
            </span>
            <span style={{ fontSize: 12, color: '#ccc', lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.content}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={{ display: 'flex', gap: 8, borderTop: '1px solid #1a1a1a', paddingTop: 10, flexShrink: 0 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask your agent…" disabled={sending}
          style={{ flex: 1, padding: '8px 12px', background: '#1a1a1a', border: '1px solid #252525', borderRadius: 8, color: '#ddd', fontFamily: 'var(--sans)', fontSize: 12, outline: 'none' }} />
        <button onClick={send} disabled={sending || !input.trim()}
          style={{ padding: '8px 14px', background: '#c8f135', color: '#0a0a0a', border: 'none', borderRadius: 8, fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: !input.trim() || sending ? 0.45 : 1 }}>
          {sending ? '…' : '→'}
        </button>
      </div>
    </div>
  )
}

// ─── Panel: Dashboard ─────────────────────────────────────────────────────────

function DashboardContent({ agentId }: { agentId: string }) {
  const [agent, setAgent] = useState<Agent | null>(null)
  const [counts, setCounts] = useState({ kb: 0, contacts: 0, orders: 0, runs: 0, documents: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [{ data: ag }, { count: kb }, { count: contacts }, { count: orders }, { count: runs }, { count: docs }] = await Promise.all([
        supabase.from('business_agents').select('*').eq('id', agentId).single(),
        supabase.from('knowledge_base').select('*', { count: 'exact', head: true }).eq('business_agent_id', agentId),
        supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('business_agent_id', agentId),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('business_agent_id', agentId),
        supabase.from('automation_runs').select('*', { count: 'exact', head: true }).eq('business_agent_id', agentId),
        supabase.from('documents').select('*', { count: 'exact', head: true }).eq('agent_id', agentId),
      ])
      setAgent(ag as Agent)
      setCounts({ kb: kb || 0, contacts: contacts || 0, orders: orders || 0, runs: runs || 0, documents: docs || 0 })
      setLoading(false)
    }
    load()
  }, [agentId])

  if (loading) return <Shimmer rows={4} />

  let health = 0
  if (agent?.greeting) health += 15
  if (agent?.system_prompt) health += 20
  if (counts.kb > 0) health += 20
  if (counts.kb >= 5) health += 10
  if (counts.contacts > 0) health += 15
  if (counts.runs > 0) health += 20
  health = Math.min(100, health)
  const hColor = health >= 75 ? '#22c55e' : health >= 45 ? '#f59e0b' : '#ef4444'

  const statItems = [
    { label: 'KB Entries', val: counts.kb },
    { label: 'Contacts', val: counts.contacts },
    { label: 'Orders', val: counts.orders },
    { label: 'AI Runs', val: counts.runs },
    { label: 'Documents', val: counts.documents },
  ]

  return (
    <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ padding: '14px', background: '#0d0d0d', borderRadius: 10, border: '1px solid #1a1a1a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 9, background: agent?.portal_color || '#c8f135', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" fill="#0a0a0a" viewBox="0 0 24 24"><path d="m13 2-2 2.5h3L12 7l1 1-2.5 3H14l-5 11 1-7H7l5-13z"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#eee' }}>{agent?.agent_name}</div>
            <div style={{ fontSize: 11, color: '#444' }}>{agent?.business_name}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 5, background: '#1a1a1a', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${health}%`, height: '100%', background: hColor, borderRadius: 3, transition: 'width 0.6s' }} />
          </div>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: hColor, width: 36 }}>{health}%</span>
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#333', marginTop: 3, letterSpacing: 0.5 }}>HEALTH SCORE</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {statItems.map(s => (
          <div key={s.label} style={{ padding: '11px 12px', background: '#0d0d0d', borderRadius: 8, border: '1px solid #1a1a1a' }}>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--mono)', color: '#eee', marginBottom: 3 }}>{s.val}</div>
            <div style={{ fontSize: 10, color: '#444', fontFamily: 'var(--mono)' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Panel: Knowledge Base ────────────────────────────────────────────────────

function KnowledgeContent({ agentId }: { agentId: string }) {
  const [entries, setEntries] = useState<{ id: string; title: string; type: string; content: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('knowledge_base').select('id, title, type, content')
      .eq('business_agent_id', agentId).order('created_at', { ascending: false })
    setEntries(data || [])
    setLoading(false)
  }, [agentId])

  useEffect(() => { load() }, [load])

  const addEntry = async () => {
    if (!newTitle.trim() || !newContent.trim()) return
    setSaving(true)
    await supabase.from('knowledge_base').insert({ business_agent_id: agentId, title: newTitle.trim(), content: newContent.trim(), type: 'general' })
    setNewTitle(''); setNewContent(''); setAdding(false)
    await load()
    setSaving(false)
  }

  const filtered = entries.filter(e => !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.content.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <Shimmer />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '10px 14px 0', display: 'flex', gap: 8, flexShrink: 0 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search knowledge base…"
          style={{ flex: 1, padding: '7px 11px', background: '#1a1a1a', border: '1px solid #252525', borderRadius: 7, color: '#ddd', fontSize: 12, outline: 'none' }} />
        <button onClick={() => setAdding(!adding)}
          style={{ padding: '7px 12px', background: adding ? '#1a1a1a' : '#c8f135', color: adding ? '#888' : '#0a0a0a', border: 'none', borderRadius: 7, fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
          {adding ? 'Cancel' : '+ Add'}
        </button>
      </div>
      {adding && (
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #1a1a1a', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Title…"
            style={{ padding: '7px 11px', background: '#1a1a1a', border: '1px solid #252525', borderRadius: 7, color: '#ddd', fontSize: 12, outline: 'none' }} />
          <textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Content…" rows={3}
            style={{ padding: '7px 11px', background: '#1a1a1a', border: '1px solid #252525', borderRadius: 7, color: '#ddd', fontSize: 12, outline: 'none', resize: 'vertical', fontFamily: 'var(--sans)' }} />
          <button onClick={addEntry} disabled={saving || !newTitle.trim() || !newContent.trim()}
            style={{ alignSelf: 'flex-start', padding: '7px 16px', background: '#c8f135', color: '#0a0a0a', border: 'none', borderRadius: 7, fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving…' : 'Save Entry'}
          </button>
        </div>
      )}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
        {filtered.length === 0 ? <Empty label={search ? 'No results found' : 'No KB entries yet'} /> : filtered.map(e => (
          <div key={e.id} style={{ padding: '10px 12px', background: '#0d0d0d', borderRadius: 8, border: '1px solid #1a1a1a' }}>
            <div style={{ display: 'flex', gap: 7, alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9, padding: '2px 6px', borderRadius: 4, background: '#1a1a1a', color: '#444', textTransform: 'uppercase' }}>{e.type}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#ddd' }}>{e.title}</span>
            </div>
            <p style={{ fontSize: 11, color: '#555', lineHeight: 1.55, margin: 0 }}>{e.content.slice(0, 130)}{e.content.length > 130 ? '…' : ''}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Panel: Contacts ──────────────────────────────────────────────────────────

function ContactsContent({ agentId }: { agentId: string }) {
  const [contacts, setContacts] = useState<{ id: string; name: string; email?: string; phone?: string; company?: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data } = await supabase.from('contacts').select('id, name, email, phone, company')
        .eq('business_agent_id', agentId).order('created_at', { ascending: false })
      setContacts(data || [])
      setLoading(false)
    }
    load()
  }, [agentId])

  const filtered = contacts.filter(c => !search || [c.name, c.email, c.phone, c.company].some(f => f?.toLowerCase().includes(search.toLowerCase())))

  if (loading) return <Shimmer />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '10px 14px 8px', flexShrink: 0 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${contacts.length} contacts…`}
          style={{ width: '100%', padding: '7px 11px', background: '#1a1a1a', border: '1px solid #252525', borderRadius: 7, color: '#ddd', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 14px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filtered.length === 0 ? <Empty label={search ? 'No contacts match' : 'No contacts yet'} /> : filtered.map(c => (
          <div key={c.id} style={{ padding: '10px 12px', background: '#0d0d0d', borderRadius: 8, border: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: '#555', flexShrink: 0 }}>
              {c.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#eee', marginBottom: 1 }}>{c.name}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#444', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {[c.email, c.phone, c.company].filter(Boolean).join(' · ')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Panel: Orders ────────────────────────────────────────────────────────────

function OrdersContent({ agentId }: { agentId: string }) {
  const [orders, setOrders] = useState<{ id: string; client_name: string; status: string; total?: number; created_at: string; order_number?: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data } = await supabase.from('orders').select('id, client_name, status, total, created_at, order_number')
        .eq('business_agent_id', agentId).order('created_at', { ascending: false }).limit(40)
      setOrders(data || [])
      setLoading(false)
    }
    load()
  }, [agentId])

  const sc = (s: string) => {
    if (s === 'completed') return { bg: 'rgba(34,197,94,0.08)', color: '#22c55e' }
    if (s === 'pending') return { bg: 'rgba(245,158,11,0.08)', color: '#f59e0b' }
    if (s === 'cancelled') return { bg: 'rgba(239,68,68,0.08)', color: '#ef4444' }
    return { bg: '#1a1a1a', color: '#555' }
  }

  if (loading) return <Shimmer />

  return (
    <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      {orders.length === 0 ? <Empty label="No orders yet" /> : orders.map(o => {
        const { bg, color } = sc(o.status)
        return (
          <div key={o.id} style={{ padding: '10px 12px', background: '#0d0d0d', borderRadius: 8, border: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#eee', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.client_name}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#444' }}>
                {o.order_number ? `#${o.order_number} · ` : ''}{new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              {o.total != null && <span style={{ fontSize: 13, fontWeight: 700, color: '#eee' }}>${Number(o.total).toFixed(2)}</span>}
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9, padding: '2px 7px', borderRadius: 4, background: bg, color, textTransform: 'uppercase' }}>{o.status}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Panel: Quotes ────────────────────────────────────────────────────────────

function QuotesContent({ agentId }: { agentId: string }) {
  const [quotes, setQuotes] = useState<{ id: string; client_name: string; status: string; total?: number; created_at: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data } = await supabase.from('quotes').select('id, client_name, status, total, created_at')
        .eq('business_agent_id', agentId).order('created_at', { ascending: false }).limit(40)
      setQuotes(data || [])
      setLoading(false)
    }
    load()
  }, [agentId])

  const sc = (s: string) => {
    if (s === 'accepted') return { bg: 'rgba(34,197,94,0.08)', color: '#22c55e' }
    if (s === 'pending') return { bg: 'rgba(245,158,11,0.08)', color: '#f59e0b' }
    if (s === 'rejected') return { bg: 'rgba(239,68,68,0.08)', color: '#ef4444' }
    return { bg: '#1a1a1a', color: '#555' }
  }

  if (loading) return <Shimmer />

  return (
    <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      {quotes.length === 0 ? <Empty label="No quotes yet" /> : quotes.map(q => {
        const { bg, color } = sc(q.status)
        return (
          <div key={q.id} style={{ padding: '10px 12px', background: '#0d0d0d', borderRadius: 8, border: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#eee', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.client_name}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#444' }}>{new Date(q.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              {q.total != null && <span style={{ fontSize: 13, fontWeight: 700, color: '#eee' }}>${Number(q.total).toFixed(2)}</span>}
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9, padding: '2px 7px', borderRadius: 4, background: bg, color, textTransform: 'uppercase' }}>{q.status}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Panel: Automations ───────────────────────────────────────────────────────

function AutomationsContent({ agentId }: { agentId: string }) {
  const [automations, setAutomations] = useState<{ id: string; name: string; schedule?: string; enabled: boolean; last_run?: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data } = await supabase.from('automations').select('id, name, schedule, enabled, last_run')
        .eq('business_agent_id', agentId).order('created_at', { ascending: false })
      setAutomations(data || [])
      setLoading(false)
    }
    load()
  }, [agentId])

  const toggle = async (id: string, enabled: boolean) => {
    await supabase.from('automations').update({ enabled: !enabled }).eq('id', id)
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a))
  }

  if (loading) return <Shimmer />

  return (
    <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      {automations.length === 0 ? <Empty label="No automations yet" /> : automations.map(a => (
        <div key={a.id} style={{ padding: '10px 12px', background: '#0d0d0d', borderRadius: 8, border: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#eee', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#444' }}>
              {a.schedule || 'No schedule'}{a.last_run ? ` · Last: ${new Date(a.last_run).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
            </div>
          </div>
          <button onClick={() => toggle(a.id, a.enabled)} title={a.enabled ? 'Disable' : 'Enable'}
            style={{ width: 36, height: 20, borderRadius: 10, cursor: 'pointer', border: 'none', background: a.enabled ? '#c8f135' : '#1e1e1e', transition: 'all 0.2s', position: 'relative', flexShrink: 0 }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: a.enabled ? '#0a0a0a' : '#3a3a3a', position: 'absolute', top: 3, left: a.enabled ? 19 : 3, transition: 'all 0.2s' }} />
          </button>
        </div>
      ))}
    </div>
  )
}

// ─── Panel: Analytics ─────────────────────────────────────────────────────────

function AnalyticsContent({ agentId }: { agentId: string }) {
  const [stats, setStats] = useState<{ label: string; val: number; sub: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [{ count: runs }, { count: docs }, { count: contacts }, { count: kb }, { count: orders }, { count: convos }] = await Promise.all([
        supabase.from('automation_runs').select('*', { count: 'exact', head: true }).eq('business_agent_id', agentId),
        supabase.from('documents').select('*', { count: 'exact', head: true }).eq('agent_id', agentId),
        supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('business_agent_id', agentId),
        supabase.from('knowledge_base').select('*', { count: 'exact', head: true }).eq('business_agent_id', agentId),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('business_agent_id', agentId),
        supabase.from('portal_conversations').select('*', { count: 'exact', head: true }).eq('business_agent_id', agentId),
      ])
      setStats([
        { label: 'Total AI Runs', val: runs || 0, sub: 'automation & chat' },
        { label: 'Documents', val: docs || 0, sub: 'generated' },
        { label: 'Contacts', val: contacts || 0, sub: 'in CRM' },
        { label: 'KB Entries', val: kb || 0, sub: 'knowledge base' },
        { label: 'Orders', val: orders || 0, sub: 'total' },
        { label: 'Conversations', val: convos || 0, sub: 'portal chats' },
      ])
      setLoading(false)
    }
    load()
  }, [agentId])

  if (loading) return <Shimmer rows={6} />

  return (
    <div style={{ padding: '10px 14px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
      {stats.map(s => (
        <div key={s.label} style={{ padding: '14px', background: '#0d0d0d', borderRadius: 10, border: '1px solid #1a1a1a' }}>
          <div style={{ fontSize: 30, fontWeight: 700, fontFamily: 'var(--mono)', color: '#eee', marginBottom: 4 }}>{s.val.toLocaleString()}</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#aaa', marginBottom: 2 }}>{s.label}</div>
          <div style={{ fontSize: 10, color: '#3a3a3a', fontFamily: 'var(--mono)' }}>{s.sub}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Panel: Calendar ──────────────────────────────────────────────────────────

function CalendarContent({ agentId }: { agentId: string }) {
  const [events, setEvents] = useState<{ id: string; title: string; event_date: string; event_time?: string; notes?: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase.from('calendar_events').select('*')
        .eq('business_agent_id', agentId).gte('event_date', today)
        .order('event_date', { ascending: true }).limit(25)
      setEvents(data || [])
      setLoading(false)
    }
    load()
  }, [agentId])

  const fmtTime = (t?: string) => {
    if (!t) return ''
    const [hStr, mStr] = t.split(':')
    const h = parseInt(hStr)
    if (isNaN(h)) return ''
    return ` · ${h % 12 === 0 ? 12 : h % 12}:${mStr?.padStart(2, '0') || '00'} ${h >= 12 ? 'PM' : 'AM'}`
  }

  const today = new Date().toISOString().split('T')[0]
  if (loading) return <Shimmer />

  return (
    <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
      {events.length === 0 ? <Empty label="No upcoming events" /> : events.map(ev => {
        const d = new Date(ev.event_date + 'T00:00:00')
        const isToday = ev.event_date === today
        return (
          <div key={ev.id} style={{ padding: '10px 12px', borderRadius: 8, background: '#0d0d0d', border: `1px solid ${isToday ? 'rgba(59,130,246,0.25)' : '#1a1a1a'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#eee' }}>{ev.title}</span>
              {isToday && <span style={{ fontFamily: 'var(--mono)', fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>TODAY</span>}
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#444' }}>
              {d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}{fmtTime(ev.event_time)}
            </div>
            {ev.notes && <div style={{ fontSize: 11, color: '#444', marginTop: 4, lineHeight: 1.4 }}>{ev.notes}</div>}
          </div>
        )
      })}
    </div>
  )
}

// ─── Panel: Portal Conversations ──────────────────────────────────────────────

function ConversationsContent({ agentId }: { agentId: string }) {
  const [convos, setConvos] = useState<{ id: string; messages: { role: string; content: string }[]; updated_at: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data } = await supabase.from('portal_conversations').select('*')
        .eq('business_agent_id', agentId).order('updated_at', { ascending: false }).limit(25)
      setConvos(data || [])
      setLoading(false)
    }
    load()
  }, [agentId])

  if (loading) return <Shimmer />

  return (
    <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      {convos.length === 0 ? <Empty label="No portal conversations yet" /> : convos.map(c => {
        const msgs = c.messages || []
        const firstUser = msgs.find(m => m.role === 'user')
        const isExp = expanded === c.id
        return (
          <div key={c.id} style={{ borderRadius: 8, background: '#0d0d0d', border: '1px solid #1a1a1a', overflow: 'hidden' }}>
            <button onClick={() => setExpanded(isExp ? null : c.id)}
              style={{ width: '100%', padding: '9px 12px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, textAlign: 'left' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#444', marginBottom: 2 }}>
                  {new Date(c.updated_at).toLocaleString()} · {msgs.length} msgs
                </div>
                <div style={{ fontSize: 12, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {firstUser?.content?.slice(0, 80) || 'No messages'}
                </div>
              </div>
              <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                style={{ transform: isExp ? 'rotate(180deg)' : 'none', flexShrink: 0, color: '#444', transition: 'transform 0.15s' }}>
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>
            {isExp && (
              <div style={{ borderTop: '1px solid #1a1a1a', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}>
                {msgs.map((m, i) => (
                  <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9, padding: '2px 6px', borderRadius: 4, flexShrink: 0, marginTop: 2, background: m.role === 'user' ? '#1a1a1a' : 'rgba(200,241,53,0.08)', color: m.role === 'user' ? '#555' : '#c8f135' }}>{m.role}</span>
                    <span style={{ fontSize: 11, color: '#ccc', lineHeight: 1.55 }}>{m.content}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Panel: Memory ────────────────────────────────────────────────────────────

function MemoryContent({ agentId }: { agentId: string }) {
  const [memories, setMemories] = useState<{ id: string; memory_text: string; created_at: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data } = await supabase.from('agent_memory').select('id, memory_text, created_at')
        .eq('business_agent_id', agentId).order('created_at', { ascending: false }).limit(30)
      setMemories(data || [])
      setLoading(false)
    }
    load()
  }, [agentId])

  if (loading) return <Shimmer />

  return (
    <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      {memories.length === 0 ? <Empty label="No memory entries yet" /> : memories.map(m => (
        <div key={m.id} style={{ padding: '10px 12px', background: '#0d0d0d', borderRadius: 8, border: '1px solid #1a1a1a' }}>
          <p style={{ fontSize: 12, color: '#ccc', lineHeight: 1.6, margin: '0 0 5px 0' }}>{m.memory_text}</p>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#3a3a3a' }}>{new Date(m.created_at).toLocaleString()}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Panel: Team ──────────────────────────────────────────────────────────────

function TeamContent({ agentId }: { agentId: string }) {
  const [members, setMembers] = useState<{ id: string; name: string; email?: string; role?: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data } = await supabase.from('team_members').select('id, name, email, role')
        .eq('business_agent_id', agentId).order('created_at', { ascending: false })
      setMembers(data || [])
      setLoading(false)
    }
    load()
  }, [agentId])

  if (loading) return <Shimmer />

  return (
    <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      {members.length === 0 ? <Empty label="No team members yet" /> : members.map(m => (
        <div key={m.id} style={{ padding: '10px 12px', background: '#0d0d0d', borderRadius: 8, border: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: '#555', flexShrink: 0 }}>
            {m.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#eee', marginBottom: 1 }}>{m.name}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#444' }}>
              {[m.role, m.email].filter(Boolean).join(' · ')}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Panel: Documents ─────────────────────────────────────────────────────────

function DocumentsContent({ agentId }: { agentId: string }) {
  const [docs, setDocs] = useState<{ id: string; title: string; type?: string; created_at: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data } = await supabase.from('documents').select('id, title, type, created_at')
        .eq('agent_id', agentId).order('created_at', { ascending: false }).limit(30)
      setDocs(data || [])
      setLoading(false)
    }
    load()
  }, [agentId])

  if (loading) return <Shimmer />

  return (
    <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      {docs.length === 0 ? <Empty label="No documents generated yet" /> : docs.map(d => (
        <div key={d.id} style={{ padding: '10px 12px', background: '#0d0d0d', borderRadius: 8, border: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 6, background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#444' }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6"/>
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#eee', marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#444' }}>
              {d.type ? `${d.type} · ` : ''}{new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Panel: Browser ───────────────────────────────────────────────────────────

const HOME_URL = 'https://www.google.com'

function normalizeUrl(raw: string): string {
  const s = raw.trim()
  if (!s) return HOME_URL
  if (s.startsWith('http://') || s.startsWith('https://')) return s
  // No dot → treat as search query
  if (!s.includes('.')) return `https://www.google.com/search?q=${encodeURIComponent(s)}`
  return `https://${s}`
}

function BrowserContent() {
  const [url, setUrl] = useState(HOME_URL)
  const [inputVal, setInputVal] = useState(HOME_URL)
  const [blocked, setBlocked] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const navigate = (target: string) => {
    const resolved = normalizeUrl(target)
    setUrl(resolved)
    setInputVal(resolved)
    setBlocked(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') navigate(inputVal)
  }

  const handleRefresh = () => {
    setBlocked(false)
    // Force reload by briefly clearing src then restoring
    const iframe = iframeRef.current
    if (iframe) {
      iframe.src = 'about:blank'
      setTimeout(() => { if (iframeRef.current) iframeRef.current.src = url }, 50)
    }
  }

  const handleBack = () => {
    try { iframeRef.current?.contentWindow?.history.back() } catch { /* cross-origin */ }
  }

  const handleForward = () => {
    try { iframeRef.current?.contentWindow?.history.forward() } catch { /* cross-origin */ }
  }

  const btnStyle: React.CSSProperties = {
    width: 28, height: 28, borderRadius: 6,
    background: '#1a1a1a', border: '1px solid #2e2e2e',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: '#666', flexShrink: 0, transition: 'all 0.12s',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0d0d0d' }}>

      {/* URL bar */}
      <div style={{ padding: '7px 10px', borderBottom: '1px solid #1a1a1a', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
        <button style={btnStyle} onClick={handleBack} title="Back"
          onMouseEnter={e => { e.currentTarget.style.color = '#ccc'; e.currentTarget.style.borderColor = '#444' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#666'; e.currentTarget.style.borderColor = '#2e2e2e' }}>
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <button style={btnStyle} onClick={handleForward} title="Forward"
          onMouseEnter={e => { e.currentTarget.style.color = '#ccc'; e.currentTarget.style.borderColor = '#444' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#666'; e.currentTarget.style.borderColor = '#2e2e2e' }}>
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
        <button style={btnStyle} onClick={handleRefresh} title="Refresh"
          onMouseEnter={e => { e.currentTarget.style.color = '#ccc'; e.currentTarget.style.borderColor = '#444' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#666'; e.currentTarget.style.borderColor = '#2e2e2e' }}>
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/>
          </svg>
        </button>
        <button style={btnStyle} onClick={() => navigate(HOME_URL)} title="Home"
          onMouseEnter={e => { e.currentTarget.style.color = '#c8f135'; e.currentTarget.style.borderColor = '#c8f13566' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#666'; e.currentTarget.style.borderColor = '#2e2e2e' }}>
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </button>

        <input
          type="text"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={e => { e.currentTarget.style.borderColor = '#c8f135'; e.currentTarget.style.outline = 'none' }}
          onBlur={e => { e.currentTarget.style.borderColor = '#2e2e2e' }}
          style={{
            flex: 1, padding: '5px 10px', background: '#1a1a1a', border: '1px solid #2e2e2e',
            borderRadius: 6, fontFamily: 'var(--mono)', fontSize: 11, color: '#ededed',
            outline: 'none', transition: 'border-color 0.12s',
          }}
          spellCheck={false}
        />

        <button style={{ ...btnStyle, width: 'auto', padding: '0 10px', fontSize: 11, fontFamily: 'var(--mono)' }}
          onClick={() => navigate(inputVal)}
          onMouseEnter={e => { e.currentTarget.style.color = '#ccc'; e.currentTarget.style.borderColor = '#444' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#666'; e.currentTarget.style.borderColor = '#2e2e2e' }}>
          Go
        </button>
      </div>

      {/* Content area */}
      {blocked ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24, textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#1a1a1a', border: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#aaa', marginBottom: 6 }}>This site cannot be displayed in the panel.</div>
            <div style={{ fontSize: 11, color: '#444', fontFamily: 'var(--mono)' }}>Try opening it in your default browser.</div>
          </div>
          <button
            onClick={() => window.open(url, '_blank')}
            style={{ padding: '7px 16px', background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: 7, color: '#c8f135', fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer', transition: 'all 0.12s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#c8f135' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#2e2e2e' }}>
            Open in browser ↗
          </button>
        </div>
      ) : (
        <iframe
          ref={iframeRef}
          src={url}
          style={{ flex: 1, border: 'none', width: '100%', background: '#fff', display: 'block' }}
          title="Browser"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
          allowFullScreen
          onError={() => setBlocked(true)}
        />
      )}
    </div>
  )
}

// ─── Panel: Portal Preview ────────────────────────────────────────────────────

function PortalPreviewContent({ agentId }: { agentId: string }) {
  const [origin, setOrigin] = useState('')
  useEffect(() => { setOrigin(window.location.origin) }, [])
  if (!origin) return <Shimmer rows={1} />
  const url = `${origin}/portal/${agentId}`
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #1a1a1a', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, padding: '5px 10px', background: '#1a1a1a', borderRadius: 5, fontFamily: 'var(--mono)', fontSize: 10, color: '#444', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {url}
        </div>
        <a href={url} target="_blank" rel="noopener noreferrer"
          style={{ color: '#c8f135', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      </div>
      <iframe src={url} style={{ flex: 1, border: 'none', width: '100%', background: '#fff' }} title="Portal Preview" sandbox="allow-scripts allow-same-origin allow-forms" />
    </div>
  )
}

// ─── Panel content router ─────────────────────────────────────────────────────

function PanelContent({ type, agentId }: { type: PanelType; agentId: string }) {
  switch (type) {
    case 'chat':           return <ChatContent agentId={agentId} />
    case 'dashboard':      return <DashboardContent agentId={agentId} />
    case 'knowledge':      return <KnowledgeContent agentId={agentId} />
    case 'contacts':       return <ContactsContent agentId={agentId} />
    case 'orders':         return <OrdersContent agentId={agentId} />
    case 'quotes':         return <QuotesContent agentId={agentId} />
    case 'automations':    return <AutomationsContent agentId={agentId} />
    case 'analytics':      return <AnalyticsContent agentId={agentId} />
    case 'calendar':       return <CalendarContent agentId={agentId} />
    case 'conversations':  return <ConversationsContent agentId={agentId} />
    case 'memory':         return <MemoryContent agentId={agentId} />
    case 'team':           return <TeamContent agentId={agentId} />
    case 'documents':      return <DocumentsContent agentId={agentId} />
    case 'portal-preview': return <PortalPreviewContent agentId={agentId} />
    case 'browser':        return <BrowserContent />
    default:               return null
  }
}

// ─── Panel picker modal ───────────────────────────────────────────────────────

function PanelPicker({ onSelect, onClose }: { onSelect: (t: PanelType) => void; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#111111', border: '1px solid #2a2a2a', borderRadius: 16, padding: 24, width: 640, maxHeight: '80vh', overflow: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.7)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: '#eee', marginBottom: 4 }}>Add panel</div>
            <div style={{ fontSize: 12, color: '#444' }}>Choose what to display</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#444', padding: 4, display: 'flex' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#aaa')}
            onMouseLeave={e => (e.currentTarget.style.color = '#444')}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {PANEL_DEFS.map(def => (
            <button key={def.type} onClick={() => onSelect(def.type)}
              style={{ background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 10, padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(200,241,53,0.4)'; e.currentTarget.style.background = 'rgba(200,241,53,0.03)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e1e'; e.currentTarget.style.background = '#0d0d0d' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(200,241,53,0.08)', color: '#c8f135', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {def.icon}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, color: '#ddd', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{def.label}</div>
                <div style={{ fontSize: 10, color: '#444', lineHeight: 1.4 }}>{def.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Floating panel ───────────────────────────────────────────────────────────

interface FloatingPanelProps {
  panel: PanelInstance
  agentId: string
  isDragging: boolean
  isFlashing: boolean
  isLive: boolean
  onMouseDownPanel: (e: React.MouseEvent) => void
  onMouseDownHeader: (e: React.MouseEvent) => void
  onMouseDownHandle: (e: React.MouseEvent, handle: ResizeHandle) => void
  onClose: () => void
  onRefresh: () => void
  onToggleMinimize: () => void
  onToggleMaximize: () => void
  panelRef: (el: HTMLDivElement | null) => void
}

function FloatingPanel({
  panel, agentId, isDragging, isFlashing, isLive,
  onMouseDownPanel, onMouseDownHeader, onMouseDownHandle,
  onClose, onRefresh, onToggleMinimize, onToggleMaximize, panelRef,
}: FloatingPanelProps) {
  const def = PANEL_DEFS.find(p => p.type === panel.type)!

  const panelStyle: React.CSSProperties = panel.isMaximized
    ? {
        position: 'fixed',
        left: 0,
        top: TOOLBAR_H,
        width: '100vw',
        height: `calc(100vh - ${TOOLBAR_H}px)`,
        zIndex: 99998,
        background: '#111111',
        border: '1px solid #333',
        borderRadius: 0,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'none',
      }
    : {
        position: 'absolute',
        left: panel.x,
        top: panel.y,
        width: panel.width,
        height: panel.isMinimized ? HEADER_H : panel.height,
        zIndex: panel.zIndex,
        background: '#111111',
        border: `1px solid ${isFlashing ? 'rgba(200,241,53,0.7)' : isDragging ? 'rgba(200,241,53,0.3)' : '#222222'}`,
        borderRadius: 10,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: isFlashing
          ? '0 0 0 1px rgba(200,241,53,0.2), 0 8px 32px rgba(0,0,0,0.4)'
          : isDragging ? '0 16px 48px rgba(0,0,0,0.6)' : '0 8px 32px rgba(0,0,0,0.4)',
        overflow: 'hidden',
        transition: isDragging ? 'none' : 'box-shadow 0.3s, border-color 0.3s',
      }

  return (
    <div ref={panelRef} style={panelStyle} onMouseDown={onMouseDownPanel}>

      {/* ── Header ── */}
      <div
        onMouseDown={onMouseDownHeader}
        onDoubleClick={onToggleMaximize}
        style={{
          height: HEADER_H,
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '0 8px 0 12px',
          borderBottom: panel.isMinimized ? 'none' : '1px solid #1a1a1a',
          flexShrink: 0,
          background: '#161616',
          cursor: 'grab',
          userSelect: 'none',
          borderRadius: panel.isMinimized ? 10 : '10px 10px 0 0',
        }}>
        <span style={{ color: '#555', display: 'flex', flexShrink: 0 }}>{def.icon}</span>
        {isLive && (
          <div title="Live updates active" style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0, boxShadow: '0 0 5px #22c55e' }} />
        )}
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, color: '#ededed', letterSpacing: 0.8, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {def.label}
        </span>

        {/* Refresh */}
        <button
          onClick={e => { e.stopPropagation(); onRefresh() }}
          title="Refresh"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3a3a3a', padding: '3px 4px', borderRadius: 4, display: 'flex', flexShrink: 0 }}
          onMouseEnter={e => (e.currentTarget.style.color = '#888')}
          onMouseLeave={e => (e.currentTarget.style.color = '#3a3a3a')}>
          <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
            <path d="M21 3v5h-5"/>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
            <path d="M8 16H3v5"/>
          </svg>
        </button>

        {/* Minimize */}
        <button
          onClick={e => { e.stopPropagation(); onToggleMinimize() }}
          title={panel.isMinimized ? 'Restore' : 'Minimize'}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3a3a3a', padding: '3px 4px', borderRadius: 4, display: 'flex', flexShrink: 0 }}
          onMouseEnter={e => (e.currentTarget.style.color = '#888')}
          onMouseLeave={e => (e.currentTarget.style.color = '#3a3a3a')}>
          {panel.isMinimized
            ? <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
            : <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/></svg>
          }
        </button>

        {/* Maximize */}
        <button
          onClick={e => { e.stopPropagation(); onToggleMaximize() }}
          title={panel.isMaximized ? 'Restore' : 'Maximize'}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3a3a3a', padding: '3px 4px', borderRadius: 4, display: 'flex', flexShrink: 0 }}
          onMouseEnter={e => (e.currentTarget.style.color = '#888')}
          onMouseLeave={e => (e.currentTarget.style.color = '#3a3a3a')}>
          {panel.isMaximized
            ? <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="8 3 3 3 3 8"/><polyline points="21 8 21 3 16 3"/><polyline points="3 16 3 21 8 21"/><polyline points="16 21 21 21 21 16"/></svg>
            : <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
          }
        </button>

        {/* Close */}
        <button
          onClick={e => { e.stopPropagation(); onClose() }}
          title="Close"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3a3a3a', padding: '3px 4px', borderRadius: 4, display: 'flex', flexShrink: 0 }}
          onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
          onMouseLeave={e => (e.currentTarget.style.color = '#3a3a3a')}>
          <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* ── Content ── */}
      {!panel.isMinimized && (
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
            {/* Chat key never includes refreshKey — messages must survive all subscription/refresh events */}
            <PanelContent
              key={panel.type === 'chat' ? `chat-${agentId}` : `${panel.type}-${agentId}-${panel.refreshKey}`}
              type={panel.type}
              agentId={agentId}
            />
          </div>
        </div>
      )}

      {/* ── Resize handles (8 — only when not minimized or maximized) ── */}
      {!panel.isMinimized && !panel.isMaximized && (
        <>
          {/* Corners */}
          {(['nw', 'ne', 'sw', 'se'] as ResizeHandle[]).map(h => (
            <div key={h} onMouseDown={e => { e.stopPropagation(); onMouseDownHandle(e, h) }}
              style={{
                position: 'absolute',
                width: 10, height: 10,
                zIndex: 20,
                cursor: HANDLE_CURSORS[h],
                ...(h === 'nw' ? { top: 0, left: 0 } : h === 'ne' ? { top: 0, right: 0 } : h === 'sw' ? { bottom: 0, left: 0 } : { bottom: 0, right: 0 }),
              }} />
          ))}
          {/* Edges */}
          <div onMouseDown={e => { e.stopPropagation(); onMouseDownHandle(e, 'n') }}  style={{ position: 'absolute', top: 0,    left: 10, right: 10,         height: 4,  cursor: 'n-resize',  zIndex: 20 }} />
          <div onMouseDown={e => { e.stopPropagation(); onMouseDownHandle(e, 's') }}  style={{ position: 'absolute', bottom: 0, left: 10, right: 10,         height: 4,  cursor: 's-resize',  zIndex: 20 }} />
          <div onMouseDown={e => { e.stopPropagation(); onMouseDownHandle(e, 'e') }}  style={{ position: 'absolute', right: 0,  top: 10,  bottom: 10,        width: 4,   cursor: 'e-resize',  zIndex: 20 }} />
          <div onMouseDown={e => { e.stopPropagation(); onMouseDownHandle(e, 'w') }}  style={{ position: 'absolute', left: 0,   top: 10,  bottom: 10,        width: 4,   cursor: 'w-resize',  zIndex: 20 }} />
        </>
      )}
    </div>
  )
}

// ─── Main page (inner — needs useSearchParams) ────────────────────────────────

function DesktopModeInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlAgentId = searchParams.get('agentId')

  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState('')
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)
  const [panels, setPanels] = useState<PanelInstance[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [liveTypes, setLiveTypes] = useState<Set<PanelType>>(new Set())
  const [flashingIds, setFlashingIds] = useState<Set<string>>(new Set())

  // Drag/resize state — never triggers re-renders
  const dragRef = useRef<{
    type: 'drag' | 'resize'
    panelId: string
    handle?: ResizeHandle
    startX: number
    startY: number
    origX: number
    origY: number
    origW: number
    origH: number
    rafId: number | null
    pendingX: number
    pendingY: number
    pendingW: number
    pendingH: number
  } | null>(null)

  const panelRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  // Mirror of panels state readable synchronously in callbacks
  const panelsSnapshot = useRef<PanelInstance[]>([])
  // Active Supabase realtime channels — cleaned up on agent switch / unmount
  const subsRef = useRef<ReturnType<typeof supabase.channel>[]>([])

  // Keep panelsSnapshot in sync with panels state
  useEffect(() => { panelsSnapshot.current = panels }, [panels])

  // ── Electron guard ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.navigator.userAgent.includes('Electron')) {
      router.replace('/dashboard')
    }
  }, [router])

  // ── Load ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    document.title = 'Desktop Mode | AgentBoard'
    const init = async () => {
      console.log('[DesktopMode] urlAgentId:', urlAgentId)
      if (!urlAgentId) { router.replace('/dashboard'); return }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const { data: agent, error: agentError } = await supabase
        .from('business_agents').select('*').eq('id', urlAgentId).single()
      console.log('[DesktopMode] agent fetch result:', agent, 'error:', agentError)

      if (!agent) {
        setPageError(`Could not load agent (id: ${urlAgentId}). ${agentError?.message || 'No data returned'}`)
        setPageLoading(false)
        return
      }

      const { data: agentsList } = await supabase
        .from('business_agents').select('id, agent_name, business_name, portal_color, greeting, system_prompt')
        .eq('user_id', user.id).order('created_at', { ascending: false })

      const list = (agentsList || []) as Agent[]
      if (!list.find(a => a.id === urlAgentId)) list.unshift(agent as Agent)
      setAgents(list)
      setSelectedAgentId(urlAgentId)

      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed.panels) && parsed.panels.length > 0) {
            setPanels(parsed.panels)
          } else {
            setPanels(makeDefaultPanels())
          }
        } else {
          setPanels(makeDefaultPanels())
        }
      } catch {
        setPanels(makeDefaultPanels())
      }

      setPageLoading(false)
    }
    init()
  }, [router, urlAgentId, searchParams])

  // ── Global mousemove / mouseup for drag & resize ────────────────────────────
  useEffect(() => {
    const applyDom = () => {
      const d = dragRef.current
      if (!d) return
      const el = panelRefs.current.get(d.panelId)
      if (!el) return

      if (d.type === 'drag') {
        el.style.left = `${d.pendingX}px`
        el.style.top  = `${d.pendingY}px`
      } else {
        el.style.left   = `${d.pendingX}px`
        el.style.top    = `${d.pendingY}px`
        el.style.width  = `${d.pendingW}px`
        el.style.height = `${d.pendingH}px`
      }
      d.rafId = null
    }

    const onMouseMove = (e: MouseEvent) => {
      const d = dragRef.current
      if (!d) return

      const dx = e.clientX - d.startX
      const dy = e.clientY - d.startY

      if (d.type === 'drag') {
        d.pendingX = Math.max(0, d.origX + dx)
        d.pendingY = Math.max(0, d.origY + dy)
      } else if (d.type === 'resize' && d.handle) {
        const h = d.handle
        let newX = d.origX, newY = d.origY
        let newW = d.origW, newH = d.origH

        if (h.includes('e')) newW = Math.max(MIN_W, d.origW + dx)
        if (h.includes('w')) { newW = Math.max(MIN_W, d.origW - dx); newX = d.origX + (d.origW - newW) }
        if (h.includes('s')) newH = Math.max(MIN_H, d.origH + dy)
        if (h.includes('n')) { newH = Math.max(MIN_H, d.origH - dy); newY = d.origY + (d.origH - newH) }

        d.pendingX = newX
        d.pendingY = newY
        d.pendingW = newW
        d.pendingH = newH
      }

      if (d.rafId === null) {
        d.rafId = requestAnimationFrame(applyDom)
      }
    }

    const onMouseUp = () => {
      const d = dragRef.current
      if (!d) return

      if (d.rafId !== null) {
        cancelAnimationFrame(d.rafId)
        d.rafId = null
      }

      // Final DOM apply
      const el = panelRefs.current.get(d.panelId)
      if (el) {
        if (d.type === 'drag') {
          el.style.left = `${d.pendingX}px`
          el.style.top  = `${d.pendingY}px`
        } else {
          el.style.left   = `${d.pendingX}px`
          el.style.top    = `${d.pendingY}px`
          el.style.width  = `${d.pendingW}px`
          el.style.height = `${d.pendingH}px`
        }
      }

      // Commit to React state
      const finalX = d.pendingX
      const finalY = d.pendingY
      const finalW = d.pendingW
      const finalH = d.pendingH
      const panelId = d.panelId
      const opType = d.type

      dragRef.current = null
      setDraggingId(null)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''

      setPanels(prev => prev.map(p => {
        if (p.id !== panelId) return p
        if (opType === 'drag') return { ...p, x: finalX, y: finalY }
        return { ...p, x: finalX, y: finalY, width: finalW, height: finalH }
      }))
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  // ── Real-time: refresh helper ───────────────────────────────────────────────

  const refreshByType = useCallback((types: PanelType[]) => {
    const targets = panelsSnapshot.current.filter(p => types.includes(p.type))
    if (targets.length === 0) return
    const ids = targets.map(p => p.id)

    // Bump refreshKey for each matching panel
    setPanels(prev => prev.map(p => ids.includes(p.id) ? { ...p, refreshKey: p.refreshKey + 1 } : p))

    // Flash border for 600ms
    setFlashingIds(prev => { const n = new Set(prev); ids.forEach(id => n.add(id)); return n })
    setTimeout(() => {
      setFlashingIds(prev => { const n = new Set(prev); ids.forEach(id => n.delete(id)); return n })
    }, 600)
  }, [])

  // ── Real-time: subscriptions (re-created when selectedAgentId changes) ───────

  useEffect(() => {
    if (!selectedAgentId || pageLoading) return

    // Tear down any previous channels
    for (const ch of subsRef.current) {
      supabase.removeChannel(ch).catch(() => {/* ignore */})
    }
    subsRef.current = []
    setLiveTypes(new Set())

    // Table → panel-type mapping
    const TABLE_MAP: Array<{ table: string; fk: string; types: PanelType[] }> = [
      { table: 'calendar_events',      fk: 'business_agent_id', types: ['calendar'] },
      { table: 'orders',               fk: 'business_agent_id', types: ['orders'] },
      { table: 'quotes',               fk: 'business_agent_id', types: ['quotes'] },
      { table: 'knowledge_base',       fk: 'business_agent_id', types: ['knowledge'] },
      { table: 'contacts',             fk: 'business_agent_id', types: ['contacts'] },
      { table: 'agent_memory',         fk: 'business_agent_id', types: ['memory'] },
      { table: 'team_members',         fk: 'business_agent_id', types: ['team'] },
      { table: 'documents',            fk: 'agent_id',          types: ['documents'] },
      { table: 'portal_conversations', fk: 'business_agent_id', types: ['conversations'] },
      { table: 'automations',          fk: 'business_agent_id', types: ['automations'] },
      { table: 'automation_runs',      fk: 'business_agent_id', types: ['dashboard', 'analytics'] },
    ]

    for (const { table, fk, types } of TABLE_MAP) {
      const channelName = `dm-${table}-${selectedAgentId}`
      try {
        const ch = supabase
          .channel(channelName)
          .on(
            'postgres_changes' as Parameters<ReturnType<typeof supabase.channel>['on']>[0],
            { event: '*', schema: 'public', table, filter: `${fk}=eq.${selectedAgentId}` },
            () => { refreshByType(types) },
          )
          .subscribe((status: string) => {
            if (status === 'SUBSCRIBED') {
              setLiveTypes(prev => { const n = new Set(prev); types.forEach(t => n.add(t)); return n })
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              console.error(`[DesktopMode] Realtime subscription failed for ${table}:`, status)
            }
          })
        subsRef.current.push(ch)
      } catch (err) {
        console.error(`[DesktopMode] Failed to create channel for ${table}:`, err)
      }
    }

    return () => {
      for (const ch of subsRef.current) {
        supabase.removeChannel(ch).catch(() => {/* ignore */})
      }
      subsRef.current = []
      setLiveTypes(new Set())
    }
  }, [selectedAgentId, pageLoading, refreshByType])

  // (no polling fallback — subscriptions handle live updates; chat messages must never be auto-wiped)

  // ── Panel actions ───────────────────────────────────────────────────────────

  const bringToFront = useCallback((panelId: string) => {
    setPanels(prev => {
      const maxZ = Math.max(0, ...prev.map(p => p.zIndex))
      const target = prev.find(p => p.id === panelId)
      if (!target || target.zIndex === maxZ) return prev
      return prev.map(p => p.id === panelId ? { ...p, zIndex: maxZ + 1 } : p)
    })
  }, [])

  const startDrag = useCallback((e: React.MouseEvent, panel: PanelInstance) => {
    if (panel.isMaximized) return
    e.preventDefault()
    document.body.style.cursor = 'grabbing'
    document.body.style.userSelect = 'none'
    dragRef.current = {
      type: 'drag',
      panelId: panel.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: panel.x,
      origY: panel.y,
      origW: panel.width,
      origH: panel.height,
      rafId: null,
      pendingX: panel.x,
      pendingY: panel.y,
      pendingW: panel.width,
      pendingH: panel.height,
    }
    setDraggingId(panel.id)
  }, [])

  const startResize = useCallback((e: React.MouseEvent, panel: PanelInstance, handle: ResizeHandle) => {
    e.preventDefault()
    document.body.style.cursor = HANDLE_CURSORS[handle]
    document.body.style.userSelect = 'none'
    dragRef.current = {
      type: 'resize',
      panelId: panel.id,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      origX: panel.x,
      origY: panel.y,
      origW: panel.width,
      origH: panel.height,
      rafId: null,
      pendingX: panel.x,
      pendingY: panel.y,
      pendingW: panel.width,
      pendingH: panel.height,
    }
    setDraggingId(panel.id)
  }, [])

  const closePanel      = useCallback((id: string) => setPanels(prev => prev.filter(p => p.id !== id)), [])
  const refreshPanel    = useCallback((id: string) => setPanels(prev => prev.map(p => p.id === id ? { ...p, refreshKey: p.refreshKey + 1 } : p)), [])
  const toggleMinimize  = useCallback((id: string) => setPanels(prev => prev.map(p => p.id === id ? { ...p, isMinimized: !p.isMinimized, isMaximized: false } : p)), [])
  const toggleMaximize  = useCallback((id: string) => setPanels(prev => prev.map(p => p.id === id ? { ...p, isMaximized: !p.isMaximized, isMinimized: false } : p)), [])

  const addPanel = useCallback((type: PanelType) => {
    const def = PANEL_DEFS.find(d => d.type === type)!
    setPanels(prev => {
      const maxZ = Math.max(0, ...prev.map(p => p.zIndex))
      const offset = (prev.length % 10) * 28
      return [...prev, {
        id: genId(),
        type,
        x: 80 + offset,
        y: 80 + offset,
        width: def.defaultW,
        height: def.defaultH,
        zIndex: maxZ + 1,
        isMinimized: false,
        isMaximized: false,
        refreshKey: 0,
      }]
    })
    setShowPicker(false)
  }, [])

  const saveLayout = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ panels }))
    } catch { /* ignore */ }
  }, [panels])

  const resetLayout = useCallback(() => setPanels(makeDefaultPanels()), [])

  const exit = () => {
    const w = window as Window & { electronAPI?: { closeWindow?: () => void } }
    if (w.electronAPI?.closeWindow) w.electronAPI.closeWindow()
    else router.push('/dashboard')
  }

  const selectedAgent = agents.find(a => a.id === selectedAgentId)

  // ── Loading / error ─────────────────────────────────────────────────────────

  if (pageLoading) return (
    <div style={{ background: '#080808', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: '#444' }}>Loading desktop mode…</span>
    </div>
  )

  if (pageError) return (
    <div style={{ background: '#080808', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <div style={{ fontSize: 18, fontWeight: 600, color: '#eee' }}>Could not load agent</div>
      <p style={{ color: '#555', fontSize: 14, margin: 0, textAlign: 'center', maxWidth: 320 }}>{pageError}</p>
      <button onClick={exit} style={{ padding: '9px 22px', background: '#1a1a1a', color: '#ccc', border: '1px solid #2a2a2a', borderRadius: 8, fontFamily: 'var(--mono)', fontSize: 12, cursor: 'pointer' }}>
        ← Go back
      </button>
    </div>
  )

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ background: '#080808', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }
      `}</style>

      {/* ── Toolbar ── */}
      <div style={{
        height: TOOLBAR_H,
        background: '#0a0a0a',
        borderBottom: '1px solid #222222',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 12,
        flexShrink: 0,
        WebkitAppRegion: 'drag',
      } as React.CSSProperties}>

        {/* Left: logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ width: 24, height: 24, background: '#c8f135', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="12" height="12" fill="#0a0a0a" viewBox="0 0 24 24"><path d="m13 2-2 2.5h3L12 7l1 1-2.5 3H14l-5 11 1-7H7l5-13z"/></svg>
          </div>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: '#eee' }}>AgentBoard</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#3a3a3a', padding: '2px 6px', background: '#141414', borderRadius: 4, letterSpacing: 0.5 }}>DESKTOP</span>
        </div>

        <div style={{ width: 1, height: 18, background: '#222', flexShrink: 0 }} />

        {/* Agent selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#3a3a3a', letterSpacing: 0.5 }}>AGENT</span>
          <select value={selectedAgentId} onChange={e => setSelectedAgentId(e.target.value)}
            style={{ background: '#141414', border: '1px solid #222', borderRadius: 6, color: '#ccc', fontFamily: 'var(--mono)', fontSize: 11, padding: '4px 10px', cursor: 'pointer', outline: 'none', maxWidth: 200 }}>
            {agents.map(a => (
              <option key={a.id} value={a.id}>{a.agent_name} — {a.business_name}</option>
            ))}
          </select>
          {selectedAgent?.portal_color && (
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: selectedAgent.portal_color, flexShrink: 0 }} />
          )}
        </div>

        <div style={{ flex: 1 }} />

        {/* Center: Flip Clock */}
        <div style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <FlipClock />
        </div>

        <div style={{ flex: 1 }} />

        {/* Right actions */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', WebkitAppRegion: 'no-drag' } as React.CSSProperties}>

          <button onClick={() => setShowPicker(true)}
            style={{ padding: '5px 12px', background: '#c8f135', border: 'none', borderRadius: 6, color: '#0a0a0a', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Panel
          </button>

          <button onClick={saveLayout}
            style={{ padding: '5px 11px', background: '#141414', border: '1px solid #222', borderRadius: 6, color: '#888', fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer', transition: 'all 0.12s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#c8f135'; e.currentTarget.style.color = '#c8f135' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#222'; e.currentTarget.style.color = '#888' }}>
            Save Layout
          </button>

          <button onClick={resetLayout}
            style={{ padding: '5px 11px', background: '#141414', border: '1px solid #222', borderRadius: 6, color: '#888', fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer', transition: 'all 0.12s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.color = '#ccc' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#222'; e.currentTarget.style.color = '#888' }}>
            Reset
          </button>

          <div style={{ width: 1, height: 18, background: '#222' }} />

          <button onClick={exit}
            style={{ padding: '5px 11px', background: 'transparent', border: '1px solid #222', borderRadius: 6, color: '#555', fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.12s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#222'; e.currentTarget.style.color = '#555' }}>
            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
            Exit
          </button>
        </div>
      </div>

      {/* ── Canvas ── */}
      <div style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        background: '#080808',
        backgroundImage: 'radial-gradient(circle, #1c1c1c 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}>
        {panels.map(panel => (
          <FloatingPanel
            key={panel.id}
            panel={panel}
            agentId={selectedAgentId}
            isDragging={draggingId === panel.id}
            isFlashing={flashingIds.has(panel.id)}
            isLive={liveTypes.has(panel.type)}
            onMouseDownPanel={() => bringToFront(panel.id)}
            onMouseDownHeader={e => { bringToFront(panel.id); startDrag(e, panel) }}
            onMouseDownHandle={(e, handle) => { bringToFront(panel.id); startResize(e, panel, handle) }}
            onClose={() => closePanel(panel.id)}
            onRefresh={() => refreshPanel(panel.id)}
            onToggleMinimize={() => toggleMinimize(panel.id)}
            onToggleMaximize={() => toggleMaximize(panel.id)}
            panelRef={el => {
              if (el) panelRefs.current.set(panel.id, el)
              else panelRefs.current.delete(panel.id)
            }}
          />
        ))}

        {panels.length === 0 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, pointerEvents: 'none' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: '#2a2a2a' }}>No panels open</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#222' }}>Click &ldquo;Add Panel&rdquo; to get started</div>
          </div>
        )}
      </div>

      {/* ── Panel picker ── */}
      {showPicker && (
        <PanelPicker onSelect={addPanel} onClose={() => setShowPicker(false)} />
      )}
    </div>
  )
}

// ─── Exported page (Suspense wrapper required for useSearchParams) ─────────────

export default function DesktopModePage() {
  return (
    <Suspense fallback={
      <div style={{ background: '#080808', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: '#444' }}>Loading…</span>
      </div>
    }>
      <DesktopModeInner />
    </Suspense>
  )
}
