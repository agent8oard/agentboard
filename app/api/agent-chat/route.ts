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
}

const QUICK_ACTIONS = [
  { icon: '📧', label: 'Reply to customer', prompt: 'Help me reply to this customer message: ' },
  { icon: '📄', label: 'Create invoice', prompt: 'Create and send an invoice to ' },
  { icon: '📝', label: 'Write contract', prompt: 'Draft a service contract for ' },
  { icon: '📱', label: 'Social media post', prompt: 'Write a social media post about ' },
  { icon: '📊', label: 'Weekly report', prompt: 'Generate a weekly business report covering ' },
  { icon: '✉️', label: 'Follow-up email', prompt: 'Write a follow-up email to ' },
  { icon: '🎯', label: 'Marketing email', prompt: 'Write a marketing email campaign about ' },
  { icon: '😤', label: 'Handle complaint', prompt: 'Help me respond to this customer complaint: ' },
  { icon: '💼', label: 'Business proposal', prompt: 'Write a business proposal for ' },
  { icon: '📋', label: 'Meeting agenda', prompt: 'Create a meeting agenda for ' },
  { icon: '👋', label: 'Welcome message', prompt: 'Write a welcome message for new customers: ' },
  { icon: '⚡', label: 'Custom task', prompt: '' },
]

export default function AgentClient({ agent }: { agent: Record<string, unknown> }) {
  const router = useRouter()
  const [view, setView] = useState<'home' | 'chat'>('home')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [running, setRunning] = useState(false)
  const [recentRuns, setRecentRuns] = useState<Record<string, unknown>[]>([])
  const [previewDoc, setPreviewDoc] = useState<{ html: string; type: string } | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { loadRecentRuns() }, [])
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
      }
      setMessages(prev => [...prev, assistantMessage])
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
    if (inlineHTML) {
      setPreviewDoc({ html: inlineHTML, type: documentType })
      return
    }
    const { data } = await supabase.from('documents').select('*').eq('id', documentId).single()
    if (data) {
      const html = (data.metadata as Record<string, unknown>)?.invoiceHTML as string || data.content as string
      setPreviewDoc({ html, type: documentType })
    }
  }

  return (
    <>
      <Navbar />

      {/* Document preview modal */}
      {previewDoc && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: 'var(--bg)', border: '1px solid var(--border)',
            borderRadius: 16, width: '100%', maxWidth: 740,
            maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0
            }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)' }}>
                {previewDoc.type} PREVIEW
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => {
                    const win = window.open('', '_blank')
                    if (win) { win.document.write(previewDoc.html); win.document.close(); win.print() }
                  }}
                  className="btn btn-accent" style={{ fontSize: 12, padding: '7px 16px' }}>
                  🖨 Print / Save PDF
                </button>
                <button onClick={() => setPreviewDoc(null)} className="btn btn-outline" style={{ fontSize: 12, padding: '7px 16px' }}>
                  Close ✕
                </button>
              </div>
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <iframe
                srcDoc={previewDoc.html}
                style={{ width: '100%', height: '600px', border: 'none' }}
                title="Document Preview"
              />
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'var(--fg)', color: 'var(--bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--serif)', fontSize: 22,
            }}>
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
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setView(view === 'home' ? 'chat' : 'home')} className="btn btn-outline" style={{ fontSize: 12 }}>
              {view === 'home' ? '💬 Open chat' : '⊞ Dashboard'}
            </button>
            <button onClick={() => router.push('/dashboard')} className="btn btn-outline" style={{ fontSize: 12 }}>← Back</button>
          </div>
        </div>

        {/* HOME VIEW */}
        {view === 'home' && (
          <div>
            <div style={{
              background: 'var(--fg)', color: 'var(--bg)',
              borderRadius: 16, padding: '28px 32px', marginBottom: 28,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
            }}>
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, opacity: 0.5, marginBottom: 8, letterSpacing: 1 }}>YOUR AI BUSINESS ASSISTANT</div>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 400, marginBottom: 6 }}>What do you need done today?</h2>
                <p style={{ fontSize: 14, opacity: 0.6, maxWidth: 400 }}>Pick an action below or chat directly. No technical knowledge needed.</p>
              </div>
              <button onClick={() => startAction(QUICK_ACTIONS[11])} className="btn btn-accent" style={{ fontSize: 13, padding: '12px 24px' }}>
                Start chatting →
              </button>
            </div>

            <div style={{ marginBottom: 28 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 }}>Quick actions</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                {QUICK_ACTIONS.map((action, i) => (
                  <button key={i} onClick={() => startAction(action)}
                    style={{
                      textAlign: 'left', padding: '16px 18px',
                      background: 'var(--bg2)', border: '1px solid var(--border)',
                      borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--fg)'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)' }}
                  >
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{action.icon}</div>
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
                    <div key={i}
                      style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                      onClick={() => {
                        setView('chat')
                        setMessages([
                          { role: 'user', content: run.input as string, timestamp: run.created_at as string },
                          { role: 'assistant', content: run.output as string, timestamp: run.created_at as string },
                        ])
                      }}
                    >
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
                  style={{ fontFamily: 'var(--mono)', fontSize: 11, padding: '6px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, cursor: 'pointer', color: 'var(--muted)', transition: 'all 0.15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--fg)'}
                  onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)'}
                >
                  {action.icon} {action.label}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 16 }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
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
                        ✓ email sent
                      </div>
                    )}

                    {msg.documentId && (
                      <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          onClick={() => viewDocument(msg.documentId!, msg.documentType!, msg.invoiceHTML)}
                          style={{
                            fontFamily: 'var(--mono)', fontSize: 11, padding: '7px 14px',
                            background: 'var(--fg)', color: 'var(--bg)',
                            border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600,
                          }}>
                          👁 View {msg.documentType}
                        </button>
                        <button
                          onClick={() => {
                            const win = window.open('', '_blank')
                            if (win && msg.invoiceHTML) { win.document.write(msg.invoiceHTML); win.document.close(); win.print() }
                          }}
                          style={{
                            fontFamily: 'var(--mono)', fontSize: 11, padding: '7px 14px',
                            background: '#c8f135', color: '#0a0a0a',
                            border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600,
                          }}>
                          🖨 Print / PDF
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
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Tell ${agent.agent_name as string} what to do...`}
                rows={2}
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--fg)', resize: 'none', lineHeight: 1.6 }}
              />
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