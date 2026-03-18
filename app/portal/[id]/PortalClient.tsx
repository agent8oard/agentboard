'use client'
import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export default function PortalClient({
  agent,
  knowledge,
}: {
  agent: Record<string, unknown>
  knowledge: Record<string, unknown>[]
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [running, setRunning] = useState(false)
  const [started, setStarted] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const accentColor = (agent.portal_color as string) || '#c8f135'
  const avatarUrl = (agent.portal_avatar_url as string) || ''
  const isDark = isColorDark(accentColor)
  const textOnAccent = isDark ? '#ffffff' : '#0a0a0a'

  const theme = {
    bg: darkMode ? '#0a0a0a' : '#f9fafb',
    surface: darkMode ? '#111111' : '#ffffff',
    border: darkMode ? '#222222' : '#e5e7eb',
    text: darkMode ? '#ededed' : '#111111',
    textMuted: darkMode ? '#888888' : '#6b7280',
    textFaint: darkMode ? '#444444' : '#9ca3af',
    inputBg: darkMode ? '#161616' : '#f9fafb',
    messageBg: darkMode ? '#161616' : '#ffffff',
    messageBorder: darkMode ? '#222222' : '#e5e7eb',
    cardBg: darkMode ? '#111111' : '#ffffff',
    cardBorder: darkMode ? '#222222' : '#e5e7eb',
  }

  function isColorDark(hex: string): boolean {
    try {
      const c = hex.replace('#', '')
      const r = parseInt(c.substring(0, 2), 16)
      const g = parseInt(c.substring(2, 4), 16)
      const b = parseInt(c.substring(4, 6), 16)
      return (r * 299 + g * 587 + b * 114) / 1000 < 128
    } catch { return false }
  }

  function renderContent(content: string) {
    return content
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br />')
  }

  const AgentAvatar = ({ size, borderRadius, fontSize }: { size: number; borderRadius: number; fontSize: number }) => (
    <div style={{ width: size, height: size, borderRadius, background: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize, color: textOnAccent, flexShrink: 0, overflow: 'hidden', boxShadow: `0 4px 12px ${accentColor}44` }}>
      {avatarUrl ? (
        <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span>{(agent.agent_name as string)?.[0]}</span>
      )}
    </div>
  )

  const DarkToggle = () => (
    <button
      onClick={() => setDarkMode(d => !d)}
      title={darkMode ? 'Light mode' : 'Dark mode'}
      style={{ background: 'none', border: `1px solid ${theme.border}`, borderRadius: 8, cursor: 'pointer', padding: '6px 8px', display: 'flex', alignItems: 'center', color: theme.textMuted, transition: 'all 0.15s' }}>
      {darkMode ? (
        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      ) : (
        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  )

  useEffect(() => {
    if (started) {
      const greeting = (agent.portal_greeting as string) ||
        `Hi! I'm ${agent.agent_name as string}, the AI assistant for ${agent.business_name as string}. How can I help you today?`
      setMessages([{ role: 'assistant', content: greeting, timestamp: new Date().toISOString() }])
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [started])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || running) return
    const userMsg: Message = { role: 'user', content: input, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setRunning(true)
    try {
      const response = await fetch('/api/portal-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, agent, knowledge, history: messages }),
      })
      const data = await response.json()
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply || 'Sorry, something went wrong. Please try again.',
        timestamp: new Date().toISOString(),
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date().toISOString(),
      }])
    }
    setRunning(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const services = knowledge.filter(k => k.type === 'service' || k.type === 'product')
  const faqs = knowledge.filter(k => k.type === 'faq')
  const QUICK_PROMPTS = ['What services do you offer?', 'How much does it cost?', 'How do I get started?', 'Can I get a quote?']

  if (!started) {
    return (
      <div style={{ minHeight: '100vh', background: theme.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', transition: 'background 0.2s, color 0.2s' }}>

        <div style={{ background: theme.surface, borderBottom: `1px solid ${theme.border}`, padding: '0 clamp(16px, 4vw, 40px)', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10, transition: 'all 0.2s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AgentAvatar size={36} borderRadius={10} fontSize={16} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: theme.text }}>{agent.business_name as string}</div>
              <div style={{ fontSize: 12, color: theme.textMuted }}>AI Assistant</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <DarkToggle />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
              <span style={{ fontSize: 12, color: theme.textMuted }}>Online now</span>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 860, margin: '0 auto', padding: 'clamp(32px, 6vw, 60px) 16px 80px' }}>

          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <div style={{ margin: '0 auto 28px', width: 'fit-content' }}>
              <AgentAvatar size={88} borderRadius={22} fontSize={40} />
            </div>
            <h1 style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: 'clamp(32px, 6vw, 56px)', fontWeight: 400, color: theme.text, marginBottom: 16, letterSpacing: -1, lineHeight: 1.1 }}>
              {(agent.portal_tagline as string) || `Welcome to ${agent.business_name as string}`}
            </h1>
            <p style={{ fontSize: 17, color: theme.textMuted, maxWidth: 460, margin: '0 auto 36px', lineHeight: 1.7 }}>
              {(agent.portal_greeting as string) || `Hi! I'm ${agent.agent_name as string}, the AI assistant for ${agent.business_name as string}. Ask me anything about our services, pricing, or to get a quote.`}
            </p>
            <button
              onClick={() => setStarted(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px', background: accentColor, color: textOnAccent, border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit', boxShadow: `0 4px 16px ${accentColor}44` }}>
              Start chatting
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </button>
          </div>

          {services.length > 0 && (
            <div style={{ marginBottom: 60 }}>
              <div style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 600, color: theme.textFaint, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 20, textAlign: 'center' }}>Our services</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                {services.map((s, i) => (
                  <div key={i}
                    style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: 12, padding: '20px 24px', transition: 'all 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = accentColor; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 16px ${accentColor}22` }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = theme.cardBorder; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: accentColor, marginBottom: 12 }} />
                    <div style={{ fontWeight: 600, fontSize: 15, color: theme.text, marginBottom: 6 }}>{s.title as string}</div>
                    <div style={{ fontSize: 13, color: theme.textMuted, lineHeight: 1.6 }}>{(s.content as string)?.slice(0, 120)}{(s.content as string)?.length > 120 ? '...' : ''}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {faqs.length > 0 && (
            <div style={{ marginBottom: 60 }}>
              <div style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 600, color: theme.textFaint, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 20, textAlign: 'center' }}>Common questions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {faqs.map((f, i) => (
                  <button key={i}
                    onClick={() => { setStarted(true); setTimeout(() => setInput(f.title as string), 200) }}
                    style={{ textAlign: 'left', padding: '14px 20px', background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: 10, cursor: 'pointer', fontSize: 14, color: theme.text, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'inherit', transition: 'all 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = accentColor }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = theme.cardBorder }}>
                    {f.title as string}
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0, marginLeft: 12, opacity: 0.4 }}><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 600, color: theme.textFaint, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>Ask me about</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {QUICK_PROMPTS.map((prompt, i) => (
                <button key={i}
                  onClick={() => { setStarted(true); setTimeout(() => setInput(prompt), 200) }}
                  style={{ padding: '8px 16px', background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: 20, fontSize: 13, color: theme.textMuted, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = accentColor; (e.currentTarget as HTMLButtonElement).style.color = theme.text }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = theme.cardBorder; (e.currentTarget as HTMLButtonElement).style.color = theme.textMuted }}>
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${theme.border}`, padding: '20px 16px', textAlign: 'center', background: theme.surface, transition: 'all 0.2s' }}>
          <span style={{ fontSize: 12, color: theme.textFaint }}>Powered by </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: theme.textMuted }}>AgentBoard</span>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: theme.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', transition: 'background 0.2s' }}>

      <div style={{ background: theme.surface, borderBottom: `1px solid ${theme.border}`, padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, transition: 'all 0.2s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setStarted(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, padding: '4px 8px', borderRadius: 6, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
            Back
          </button>
          <div style={{ width: 1, height: 16, background: theme.border }} />
          <AgentAvatar size={32} borderRadius={8} fontSize={14} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: theme.text }}>{agent.agent_name as string}</div>
            <div style={{ fontSize: 11, color: theme.textMuted }}>{agent.business_name as string}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <DarkToggle />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
            <span style={{ fontSize: 12, color: theme.textMuted }}>Online</span>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 760, width: '100%', margin: '0 auto', alignSelf: 'center' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 10, alignItems: 'flex-end' }}>
            {msg.role === 'assistant' && <AgentAvatar size={28} borderRadius={8} fontSize={12} />}
            <div style={{ maxWidth: '72%', padding: '12px 16px', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: msg.role === 'user' ? accentColor : theme.messageBg, color: msg.role === 'user' ? textOnAccent : theme.text, fontSize: 14, lineHeight: 1.7, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: msg.role === 'assistant' ? `1px solid ${theme.messageBorder}` : 'none' }}>
              {msg.role === 'assistant' && (
                <div style={{ fontSize: 10, fontWeight: 700, color: theme.textMuted, marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase', fontFamily: 'monospace' }}>
                  {agent.agent_name as string}
                </div>
              )}
              <div dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }} style={{ fontSize: 14, lineHeight: 1.7 }} />
              <div style={{ fontSize: 10, color: msg.role === 'user' ? `${textOnAccent}88` : theme.textFaint, marginTop: 6 }}>
                {new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {running && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <AgentAvatar size={28} borderRadius={8} fontSize={12} />
            <div style={{ padding: '12px 16px', background: theme.messageBg, border: `1px solid ${theme.messageBorder}`, borderRadius: '16px 16px 16px 4px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: theme.textFaint, animation: `bounce 1.4s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ background: theme.surface, borderTop: `1px solid ${theme.border}`, padding: '16px clamp(12px, 3vw, 24px)', flexShrink: 0, transition: 'all 0.2s' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div style={{ flex: 1, background: theme.inputBg, border: `1px solid ${theme.border}`, borderRadius: 12, padding: '10px 14px' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${agent.agent_name as string}...`}
              rows={1}
              style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: 14, color: theme.text, resize: 'none', lineHeight: 1.6, maxHeight: 120 }}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={running || !input.trim()}
            style={{ width: 44, height: 44, borderRadius: 10, background: accentColor, border: 'none', cursor: (running || !input.trim()) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: (running || !input.trim()) ? 0.4 : 1, transition: 'all 0.15s', boxShadow: `0 2px 8px ${accentColor}44` }}>
            <svg width="16" height="16" fill="none" stroke={textOnAccent} strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
        </div>
        <div style={{ textAlign: 'center', marginTop: 10, fontSize: 11, color: theme.textFaint }}>
          Powered by <strong style={{ color: theme.textMuted }}>AgentBoard</strong>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}