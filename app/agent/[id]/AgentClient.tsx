'use client'
import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { useRouter } from 'next/navigation'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  emailSent?: boolean
  documentId?: string
  documentType?: string
  invoiceHTML?: string
  calendarEvent?: Record<string, unknown>
}

interface CalendarEvent {
  id: string
  title: string
  event_date: string
  event_time?: string
  event_type: string
  location?: string
  description?: string
  attendees?: string[]
  status: string
}

const QUICK_ACTIONS = [
  { label: 'Reply to customer', prompt: 'Help me reply to this customer message: ', icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/></svg> },
  { label: 'Create invoice', prompt: 'Create and send an invoice to ', icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg> },
  { label: 'Write contract', prompt: 'Draft a service contract for ', icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 12h6M9 16h6M9 8h6M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg> },
  { label: 'Social media post', prompt: 'Write a social media post about ', icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/></svg> },
  { label: 'Weekly report', prompt: 'Generate a weekly business report covering ', icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg> },
  { label: 'Follow-up email', prompt: 'Write a follow-up email to ', icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M22 2 11 13M22 2 15 22l-4-9-9-4 20-7z"/></svg> },
  { label: 'Marketing email', prompt: 'Write a marketing email campaign about ', icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
  { label: 'Handle complaint', prompt: 'Help me respond to this customer complaint: ', icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg> },
  { label: 'Business proposal', prompt: 'Write a business proposal for ', icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
  { label: 'Meeting agenda', prompt: 'Create a meeting agenda for ', icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> },
  { label: 'Welcome message', prompt: 'Write a welcome message for new customers: ', icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
  { label: 'Custom task', prompt: '', icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg> },
]

const EVENT_COLORS: Record<string, string> = {
  meeting: '#3b82f6',
  appointment: '#8b5cf6',
  call: '#10b981',
  deadline: '#ef4444',
  event: '#f59e0b',
  reminder: '#6b7280',
}

export default function AgentClient({ agent }: { agent: Record<string, unknown> }) {
  const router = useRouter()
  const [view, setView] = useState<'home' | 'chat' | 'calendar'>('home')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [running, setRunning] = useState(false)
  const [recentRuns, setRecentRuns] = useState<Record<string, unknown>[]>([])
  const [previewDoc, setPreviewDoc] = useState<{ html: string; type: string } | null>(null)
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [calendarDate, setCalendarDate] = useState(new Date())
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { loadRecentRuns(); loadCalendarEvents() }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const loadRecentRuns = async () => {
    const { data } = await supabase
      .from('automation_runs')
      .select('*')
      .eq('business_agent_id', agent.id as string)
      .order('created_at', { ascending: false })
      .limit(5)
    setRecentRuns(data || [])
  }

  const loadCalendarEvents = async () => {
    const { data } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('business_agent_id', agent.id as string)
      .order('event_date', { ascending: true })
    setCalendarEvents(data || [])
  }

  const startAction = (action: typeof QUICK_ACTIONS[0]) => {
    setView('chat')
    if (action.prompt) {
      setInput(action.prompt)
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.setSelectionRange(action.prompt.length, action.prompt.length)
      }, 100)
    } else {
      setInput('')
      setTimeout(() => inputRef.current?.focus(), 100)
    }
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `Hi! I'm ${agent.agent_name as string}, your AI assistant for ${agent.business_name as string}. What do you need done?`,
        timestamp: new Date().toISOString(),
      }])
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || running) return
    const userMessage: Message = { role: 'user', content: input, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setRunning(true)

    try {
      const response = await fetch('/api/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, agent, history: messages }),
      })
      const data = await response.json()
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toISOString(),
        emailSent: data.emailSent,
        documentId: data.documentId,
        documentType: data.documentType,
        invoiceHTML: data.invoiceHTML,
        calendarEvent: data.calendarEvent,
      }
      setMessages(prev => [...prev, assistantMessage])
      if (data.calendarEvent) loadCalendarEvents()
      await supabase.from('automation_runs').insert({
        business_agent_id: agent.id as string,
        automation_type: 'chat',
        input,
        output: data.reply,
      })
      loadRecentRuns()
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Something went wrong. Please try again.',
        timestamp: new Date().toISOString(),
      }])
    }
    setRunning(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const timeAgo = (date: string) => {
    const s = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
    if (s < 60) return 'just now'
    if (s < 3600) return `${Math.floor(s / 60)}m ago`
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`
    return `${Math.floor(s / 86400)}d ago`
  }

  const viewDocument = async (documentId: string, documentType: string, inlineHTML?: string) => {
    if (inlineHTML) { setPreviewDoc({ html: inlineHTML, type: documentType }); return }
    const { data } = await supabase.from('documents').select('*').eq('id', documentId).single()
    if (data) {
      const html = (data.metadata as Record<string, unknown>)?.invoiceHTML as string || data.content as string
      setPreviewDoc({ html, type: documentType })
    }
  }

  const deleteEvent = async (id: string) => {
    await supabase.from('calendar_events').delete().eq('id', id)
    setCalendarEvents(prev => prev.filter(e => e.id !== id))
  }

  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  const getEventsForDay = (day: number) => {
    const dateStr = `${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return calendarEvents.filter(e => e.event_date === dateStr)
  }

  const formatEventTime = (time?: string) => {
    if (!time) return ''
    const parts = time.split(':')
    const h = parseInt(parts[0])
    const m = parts[1] ? parts[1].padStart(2, '0') : '00'
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 === 0 ? 12 : h % 12
    return `${hour}:${m} ${ampm}`
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const today = new Date()
  const upcomingEvents = calendarEvents.filter(e => e.event_date >= today.toISOString().split('T')[0]).slice(0, 5)

  // Icons
  const IconManage = <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
  const IconCalendar = <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
  const IconAnalytics = <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
  const IconChat = <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  const IconGrid = <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
  const IconBack = <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
  const IconPrint = <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
  const IconView = <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
  const IconEvent = <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
  const IconCheck = <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>

  return (
    <>
      <Navbar />

      {/* Document preview modal */}
      {previewDoc && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 16, width: '100%', maxWidth: 740, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)' }}>{previewDoc.type} PREVIEW</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { const win = window.open('', '_blank'); if (win) { win.document.write(previewDoc.html); win.document.close(); win.print() } }} className="btn btn-accent" style={{ fontSize: 12, padding: '7px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {IconPrint} Print / Save PDF
                </button>
                <button onClick={() => setPreviewDoc(null)} className="btn btn-outline" style={{ fontSize: 12, padding: '7px 16px' }}>Close</button>
              </div>
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <iframe srcDoc={previewDoc.html} style={{ width: '100%', height: '600px', border: 'none' }} title="Document Preview" />
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--fg)', color: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontSize: 22 }}>
              {(agent.agent_name as string)?.[0]}
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 400, marginBottom: 2 }}>{agent.agent_name as string}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>active · {agent.business_name as string}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => router.push(`/agent/${agent.id as string}/manage`)} className="btn btn-outline" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              {IconManage} Manage
            </button>
            <button onClick={() => router.push(`/agent/${agent.id as string}/analytics`)} className="btn btn-outline" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              {IconAnalytics} Analytics
            </button>
            <button onClick={() => setView(view === 'calendar' ? 'home' : 'calendar')} className="btn btn-outline" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, background: view === 'calendar' ? 'var(--fg)' : 'transparent', color: view === 'calendar' ? 'var(--bg)' : 'var(--fg)' }}>
              {IconCalendar} Calendar {upcomingEvents.length > 0 && `(${upcomingEvents.length})`}
            </button>
            <button onClick={() => setView(view === 'home' ? 'chat' : 'home')} className="btn btn-outline" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              {view === 'home' ? <>{IconChat} Open chat</> : <>{IconGrid} Dashboard</>}
            </button>
            <button onClick={() => router.push('/dashboard')} className="btn btn-outline" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              {IconBack} Back
            </button>
          </div>
        </div>

        {/* CALENDAR VIEW */}
        {view === 'calendar' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                  <h2 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 400 }}>
                    {monthNames[calendarDate.getMonth()]} {calendarDate.getFullYear()}
                  </h2>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1))} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border2)', background: 'transparent', color: 'var(--fg)', cursor: 'pointer', fontSize: 14 }}>‹</button>
                    <button onClick={() => setCalendarDate(new Date())} style={{ padding: '0 12px', height: 32, borderRadius: 8, border: '1px solid var(--border2)', background: 'transparent', color: 'var(--fg)', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 11 }}>Today</button>
                    <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1))} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border2)', background: 'transparent', color: 'var(--fg)', cursor: 'pointer', fontSize: 14 }}>›</button>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border)' }}>
                  {dayNames.map(d => (
                    <div key={d} style={{ padding: '10px 0', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: 1 }}>{d}</div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                  {Array.from({ length: getFirstDayOfMonth(calendarDate) }).map((_, i) => (
                    <div key={`empty-${i}`} style={{ minHeight: 88, borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: 8, background: 'var(--bg3)', opacity: 0.4 }} />
                  ))}
                  {Array.from({ length: getDaysInMonth(calendarDate) }).map((_, i) => {
                    const day = i + 1
                    const events = getEventsForDay(day)
                    const isToday = today.getDate() === day && today.getMonth() === calendarDate.getMonth() && today.getFullYear() === calendarDate.getFullYear()
                    const colIndex = (getFirstDayOfMonth(calendarDate) + i) % 7
                    return (
                      <div key={day} style={{ minHeight: 88, padding: 8, borderRight: colIndex === 6 ? 'none' : '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: isToday ? 'rgba(200,241,53,0.04)' : 'transparent' }}>
                        <div style={{ width: 26, height: 26, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 12, background: isToday ? 'var(--accent)' : 'transparent', color: isToday ? '#0a0a0a' : 'var(--fg)', fontWeight: isToday ? 700 : 400, marginBottom: 4 }}>
                          {day}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {events.slice(0, 2).map(event => (
                            <div key={event.id} style={{ padding: '2px 6px', borderRadius: 4, fontSize: 10, background: `${EVENT_COLORS[event.event_type] || '#6b7280'}22`, color: EVENT_COLORS[event.event_type] || '#6b7280', border: `1px solid ${EVENT_COLORS[event.event_type] || '#6b7280'}44`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--mono)' }}>
                              {event.title}
                            </div>
                          ))}
                          {events.length > 2 && <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)', paddingLeft: 2 }}>+{events.length - 2} more</div>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 }}>Upcoming</div>
                  {upcomingEvents.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                      <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>No upcoming events</p>
                      <button onClick={() => setView('chat')} style={{ fontFamily: 'var(--mono)', fontSize: 11, padding: '6px 12px', background: 'transparent', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--muted)', cursor: 'pointer' }}>
                        + Add via chat
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {upcomingEvents.map(event => (
                        <div key={event.id} style={{ padding: '12px 14px', background: 'var(--bg3)', borderRadius: 10, border: '1px solid var(--border)', borderLeft: `3px solid ${EVENT_COLORS[event.event_type] || '#6b7280'}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{event.title}</div>
                            <button onClick={() => deleteEvent(event.id)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 11, padding: '0 0 0 8px', flexShrink: 0 }}>✕</button>
                          </div>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>
                            {new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            {event.event_time && ` · ${formatEventTime(event.event_time)}`}
                          </div>
                          {event.location && <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>📍 {event.location}</div>}
                          {event.description && <div style={{ fontSize: 11, color: 'var(--muted)' }}>{event.description}</div>}
                          <div style={{ marginTop: 6 }}>
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, padding: '2px 6px', borderRadius: 4, background: `${EVENT_COLORS[event.event_type] || '#6b7280'}22`, color: EVENT_COLORS[event.event_type] || '#6b7280' }}>
                              {event.event_type}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>Add event via AI</div>
                  <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 12 }}>
                    Tell your agent about any meeting or appointment in the chat — it adds it automatically.
                  </p>
                  <button onClick={() => setView('chat')} className="btn btn-accent" style={{ width: '100%', fontSize: 12, padding: '10px' }}>Open chat →</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HOME VIEW */}
        {view === 'home' && (
          <div>
            <div style={{ background: 'var(--fg)', color: 'var(--bg)', borderRadius: 16, padding: '28px 32px', marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, opacity: 0.5, marginBottom: 8, letterSpacing: 1 }}>YOUR AI BUSINESS ASSISTANT</div>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 400, marginBottom: 6 }}>What do you need done today?</h2>
                <p style={{ fontSize: 14, opacity: 0.6, maxWidth: 400 }}>Pick an action below or chat directly. No technical knowledge needed.</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button onClick={() => startAction(QUICK_ACTIONS[11])} className="btn btn-accent" style={{ fontSize: 13, padding: '12px 24px' }}>Start chatting →</button>
                <button onClick={() => router.push(`/agent/${agent.id as string}/manage`)} className="btn btn-outline" style={{ fontSize: 12, padding: '10px 24px', color: 'var(--bg)', borderColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {IconManage} Manage agent
                </button>
              </div>
            </div>

            {upcomingEvents.length > 0 && (
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 20px', marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: 1.5, textTransform: 'uppercase' }}>Upcoming events</div>
                  <button onClick={() => setView('calendar')} style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>View calendar →</button>
                </div>
                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
                  {upcomingEvents.map(event => (
                    <div key={event.id} style={{ flexShrink: 0, padding: '10px 14px', background: 'var(--bg3)', borderRadius: 10, border: '1px solid var(--border)', borderLeft: `3px solid ${EVENT_COLORS[event.event_type] || '#6b7280'}`, minWidth: 160 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>{event.title}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)' }}>
                        {new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {event.event_time && ` · ${formatEventTime(event.event_time)}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: 28 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 }}>Quick actions</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                {QUICK_ACTIONS.map((action, i) => (
                  <button key={i} onClick={() => startAction(action)}
                    style={{ textAlign: 'left', padding: '16px 18px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--fg)'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)' }}>
                    <div style={{ color: 'var(--muted)', marginBottom: 10 }}>{action.icon}</div>
                    <div style={{ fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 500, color: 'var(--fg)' }}>{action.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {recentRuns.length > 0 && (
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 }}>Recent activity</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {recentRuns.map((run, i) => (
                    <div key={i} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                      onClick={() => { setView('chat'); setMessages([{ role: 'user', content: run.input as string, timestamp: run.created_at as string }, { role: 'assistant', content: run.output as string, timestamp: run.created_at as string }]) }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{(run.input as string)?.slice(0, 60)}{(run.input as string)?.length > 60 ? '...' : ''}</div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>{run.automation_type as string}</div>
                      </div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', flexShrink: 0, marginLeft: 16 }}>{timeAgo(run.created_at as string)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CHAT VIEW */}
        {view === 'chat' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)' }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {QUICK_ACTIONS.slice(0, 6).map((action, i) => (
                <button key={i} onClick={() => startAction(action)}
                  style={{ fontFamily: 'var(--mono)', fontSize: 11, padding: '6px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, cursor: 'pointer', color: 'var(--muted)', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6 }}
                  onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--fg)'}
                  onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)'}>
                  {action.icon} {action.label}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 16 }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth: '80%', background: msg.role === 'user' ? 'var(--fg)' : 'var(--bg2)', color: msg.role === 'user' ? 'var(--bg)' : 'var(--fg)', border: `1px solid ${msg.role === 'user' ? 'var(--fg)' : 'var(--border)'}`, borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', padding: '14px 18px' }}>
                    {msg.role === 'assistant' && (
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', marginBottom: 8, letterSpacing: 1 }}>{agent.agent_name as string}</div>
                    )}
                    <div style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{msg.content}</div>

                    {msg.emailSent && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--mono)', fontSize: 11, color: '#4ade80', marginTop: 10, padding: '6px 10px', background: '#0d2e14', borderRadius: 6, border: '1px solid #1a4a24', width: 'fit-content' }}>
                        {IconCheck} Email sent
                      </div>
                    )}

                    {msg.calendarEvent && (
                      <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ color: '#3b82f6', flexShrink: 0 }}>{IconEvent}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#3b82f6', marginBottom: 2 }}>Added to calendar</div>
                          <div style={{ fontSize: 12, fontWeight: 500 }}>{(msg.calendarEvent as Record<string, unknown>).title as string}</div>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)' }}>
                            {new Date((msg.calendarEvent as Record<string, unknown>).event_date as string + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            {(msg.calendarEvent as Record<string, unknown>).event_time && ` · ${formatEventTime((msg.calendarEvent as Record<string, unknown>).event_time as string)}`}
                          </div>
                        </div>
                        <button onClick={() => setView('calendar')} style={{ fontFamily: 'var(--mono)', fontSize: 10, padding: '4px 8px', background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 6, color: '#3b82f6', cursor: 'pointer', flexShrink: 0 }}>
                          View →
                        </button>
                      </div>
                    )}

                    {msg.documentId && (
                      <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button onClick={() => viewDocument(msg.documentId!, msg.documentType!, msg.invoiceHTML)}
                          style={{ fontFamily: 'var(--mono)', fontSize: 11, padding: '7px 14px', background: 'var(--fg)', color: 'var(--bg)', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                          {IconView} View {msg.documentType}
                        </button>
                        <button onClick={() => { const win = window.open('', '_blank'); if (win && msg.invoiceHTML) { win.document.write(msg.invoiceHTML); win.document.close(); win.print() } }}
                          style={{ fontFamily: 'var(--mono)', fontSize: 11, padding: '7px 14px', background: '#c8f135', color: '#0a0a0a', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                          {IconPrint} Print / PDF
                        </button>
                      </div>
                    )}

                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', marginTop: 8, opacity: 0.5 }}>
                      {new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}

              {running && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '16px 16px 16px 4px', padding: '14px 18px' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', marginBottom: 8, letterSpacing: 1 }}>{agent.agent_name as string}</div>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--muted)', animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                placeholder={`Tell ${agent.agent_name as string} what to do...`}
                rows={2}
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--fg)', resize: 'none', lineHeight: 1.6 }} />
              <button onClick={sendMessage} disabled={running || !input.trim()} className="btn btn-accent"
                style={{ fontSize: 12, padding: '8px 18px', flexShrink: 0, opacity: (running || !input.trim()) ? 0.5 : 1 }}>
                Send →
              </button>
            </div>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 8 }}>
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 60%, 100% { opacity: 0.3; transform: scale(1); }
          30% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </>
  )
}