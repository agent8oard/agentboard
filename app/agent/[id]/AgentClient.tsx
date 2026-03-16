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
}

export default function AgentClient({ agent }: { agent: Record<string, unknown> }) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi! I'm ${agent.agent_name as string}, your AI agent for ${agent.business_name as string}. I know everything about your business and I'm ready to help.\n\nJust tell me what you need done — I can write emails and send them, handle customer inquiries, generate reports, draft documents, and much more. What would you like me to do?`,
      timestamp: new Date().toISOString(),
    }
  ])
  const [input, setInput] = useState('')
  const [running, setRunning] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || running) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setRunning(true)

    try {
      const response = await fetch('/api/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          agent,
          history: messages,
        }),
      })

      const data = await response.json()

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toISOString(),
        emailSent: data.emailSent,
        documentId: data.documentId,
        documentType: data.documentType,
      }

      setMessages(prev => [...prev, assistantMessage])

      await supabase.from('automation_runs').insert({
        business_agent_id: agent.id as string,
        automation_type: 'chat',
        input,
        output: data.reply,
      })

    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date().toISOString(),
      }])
    }

    setRunning(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px', height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexShrink: 0 }}>
          <div>
            <div className="section-label">ai agent</div>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 400 }}>{agent.agent_name as string}</h1>
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>{agent.business_name as string} · {agent.industry as string}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => router.push('/dashboard')} className="btn btn-outline" style={{ fontSize: 12 }}>← Dashboard</button>
            <button onClick={() => router.push('/builder')} className="btn btn-accent" style={{ fontSize: 12 }}>+ New Agent</button>
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16,
          padding: '16px 0', marginBottom: 16
        }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}>
              <div style={{
                maxWidth: '80%',
                background: msg.role === 'user' ? 'var(--fg)' : 'var(--bg2)',
                color: msg.role === 'user' ? 'var(--bg)' : 'var(--fg)',
                border: `1px solid ${msg.role === 'user' ? 'var(--fg)' : 'var(--border)'}`,
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                padding: '14px 18px',
              }}>
                {msg.role === 'assistant' && (
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', marginBottom: 8, letterSpacing: 1 }}>
                    {agent.agent_name as string}
                  </div>
                )}
                <div style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{msg.content}</div>

                {msg.emailSent && (
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#4ade80', marginTop: 10, padding: '4px 10px', background: '#0d2e14', borderRadius: 6, display: 'inline-block', border: '1px solid #1a4a24' }}>
                    ✓ email sent automatically
                  </div>
                )}

                {msg.documentId && (
                  <div>
                    <a
                      href={`/document/${msg.documentId}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-block',
                        marginTop: 10,
                        fontFamily: 'var(--mono)',
                        fontSize: 11,
                        color: '#1a1a1a',
                        background: '#c8f135',
                        padding: '6px 14px',
                        borderRadius: 6,
                        textDecoration: 'none',
                        fontWeight: 600,
                      }}
                    >
                      📄 Open & Print {msg.documentType} →
                    </a>
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
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', marginBottom: 8, letterSpacing: 1 }}>
                  {agent.agent_name as string}
                </div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 6, height: 6, borderRadius: '50%', background: 'var(--muted)',
                      animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{
          display: 'flex', gap: 10, alignItems: 'flex-end', flexShrink: 0,
          background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: '12px 16px',
        }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Tell ${agent.agent_name as string} what to do... (e.g. "Send a follow-up email to john@gmail.com about his order")`}
            rows={2}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--fg)', resize: 'none', lineHeight: 1.6,
            }}
          />
          <button
            onClick={sendMessage}
            disabled={running || !input.trim()}
            className="btn btn-accent"
            style={{ fontSize: 12, padding: '8px 18px', flexShrink: 0, opacity: (running || !input.trim()) ? 0.5 : 1 }}
          >
            Send →
          </button>
        </div>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 8 }}>
          Press Enter to send · Shift+Enter for new line
        </p>
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