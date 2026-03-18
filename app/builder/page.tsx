'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

const INDUSTRIES = [
  'Food & Beverage', 'Retail', 'Healthcare', 'Finance', 'Legal',
  'Real Estate', 'Education', 'Technology', 'Construction',
  'Trades & Services', 'Salons & Beauty', 'E-commerce', 'Other'
]

const TASKS = [
  'Reply to customer emails',
  'Create and send invoices',
  'Draft contracts',
  'Write proposals',
  'Handle complaints',
  'Generate reports',
  'Social media content',
  'Marketing campaigns',
  'Meeting agendas',
  'Job listings',
  'Follow-up emails',
  'Welcome messages',
]

const TONES = [
  { value: 'professional', label: 'Professional', desc: 'Formal and business-like' },
  { value: 'friendly', label: 'Friendly', desc: 'Warm and approachable' },
  { value: 'direct', label: 'Direct', desc: 'Short and to the point' },
  { value: 'luxury', label: 'Luxury', desc: 'Premium and sophisticated' },
]

export default function BuilderPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [user, setUser] = useState<any>(null)
  const [authChecking, setAuthChecking] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [form, setForm] = useState({
    business_name: '',
    industry: '',
    description: '',
    agent_name: '',
    tone: 'professional',
    tasks: [] as string[],
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setAuthChecking(false)
    })
  }, [])

  const toggleTask = (task: string) => {
    setForm(prev => ({
      ...prev,
      tasks: prev.tasks.includes(task)
        ? prev.tasks.filter(t => t !== task)
        : [...prev.tasks, task]
    }))
  }

  const generate = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/generate-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const { data: agent } = await supabase
        .from('business_agents')
        .insert({
          user_id: user.id,
          business_name: form.business_name,
          industry: form.industry,
          agent_name: form.agent_name || data.agent_name,
          tone: form.tone,
          tasks: form.tasks,
          system_prompt: data.system_prompt,
          automations: data.automations,
        })
        .select()
        .single()

      if (agent) router.push(`/agent/${agent.id}`)
    } catch (err) {
      console.error(err)
    }
    setGenerating(false)
  }

  const inputStyle = {
    width: '100%', padding: '12px 16px',
    border: '1px solid var(--border2)', borderRadius: 10,
    fontFamily: 'var(--sans)', fontSize: 14,
    background: 'var(--bg2)', color: 'var(--fg)', outline: 'none',
  }

  // Loading auth
  if (authChecking) return (
    <>
      <Navbar />
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)' }}>Loading...</p>
      </div>
    </>
  )

  // Not logged in — show gate
  if (!user) return (
    <>
      <Navbar />
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 20, padding: '52px 40px',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: 'var(--fg)', color: 'var(--bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: 30, fontWeight: 400, marginBottom: 12 }}>
            Sign in to build your agent
          </h2>
          <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 32 }}>
            You need a free account to build and manage your AI business agent. It only takes 30 seconds to sign up.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={() => router.push('/auth?redirect=/builder')}
              className="btn btn-accent"
              style={{ fontSize: 14, padding: '13px', width: '100%' }}>
              Sign up free →
            </button>
            <button
              onClick={() => router.push('/auth?redirect=/builder')}
              className="btn btn-outline"
              style={{ fontSize: 14, padding: '13px', width: '100%' }}>
              Sign in to existing account
            </button>
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 20, fontFamily: 'var(--mono)' }}>
            Free to use · No credit card required
          </p>
        </div>
      </div>
    </>
  )

  // Logged in — show builder
  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '48px 24px' }}>

        {/* Progress */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 40 }}>
          {[1, 2, 3, 4].map(s => (
            <div key={s} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: s <= step ? 'var(--fg)' : 'var(--border)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {/* Step 1 — Business info */}
        {step === 1 && (
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: 2, marginBottom: 12 }}>STEP 1 OF 4</div>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 36, fontWeight: 400, marginBottom: 8 }}>Tell us about your business</h1>
            <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 36, lineHeight: 1.7 }}>This helps us build an agent that truly understands your business.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 8, letterSpacing: 0.5 }}>Business name *</label>
                <input style={inputStyle} placeholder="e.g. Sunrise Bakery" value={form.business_name} onChange={e => setForm({ ...form, business_name: e.target.value })} />
              </div>
              <div>
                <label style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 8, letterSpacing: 0.5 }}>Industry *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
                  {INDUSTRIES.map(ind => (
                    <button key={ind} onClick={() => setForm({ ...form, industry: ind })}
                      style={{
                        padding: '10px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, textAlign: 'left',
                        background: form.industry === ind ? 'var(--fg)' : 'var(--bg2)',
                        color: form.industry === ind ? 'var(--bg)' : 'var(--fg)',
                        border: `1px solid ${form.industry === ind ? 'var(--fg)' : 'var(--border)'}`,
                        transition: 'all 0.15s',
                      }}>
                      {ind}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 8, letterSpacing: 0.5 }}>What does your business do? (optional)</label>
                <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={3}
                  placeholder="e.g. We are a bakery specialising in custom cakes and pastries for events..."
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>

            <div style={{ marginTop: 36 }}>
              <button
                onClick={() => setStep(2)}
                disabled={!form.business_name || !form.industry}
                className="btn btn-accent"
                style={{ fontSize: 14, padding: '13px 32px', opacity: (!form.business_name || !form.industry) ? 0.4 : 1 }}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Tasks */}
        {step === 2 && (
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: 2, marginBottom: 12 }}>STEP 2 OF 4</div>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 36, fontWeight: 400, marginBottom: 8 }}>What should your agent handle?</h1>
            <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 36, lineHeight: 1.7 }}>Select all the tasks you want your agent to take care of automatically.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginBottom: 36 }}>
              {TASKS.map(task => (
                <button key={task} onClick={() => toggleTask(task)}
                  style={{
                    padding: '12px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 13, textAlign: 'left',
                    background: form.tasks.includes(task) ? 'var(--fg)' : 'var(--bg2)',
                    color: form.tasks.includes(task) ? 'var(--bg)' : 'var(--fg)',
                    border: `1px solid ${form.tasks.includes(task) ? 'var(--fg)' : 'var(--border)'}`,
                    transition: 'all 0.15s',
                  }}>
                  {form.tasks.includes(task) && <span style={{ marginRight: 6 }}>✓</span>}
                  {task}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(1)} className="btn btn-outline" style={{ fontSize: 14, padding: '13px 24px' }}>← Back</button>
              <button
                onClick={() => setStep(3)}
                disabled={form.tasks.length === 0}
                className="btn btn-accent"
                style={{ fontSize: 14, padding: '13px 32px', opacity: form.tasks.length === 0 ? 0.4 : 1 }}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Personality */}
        {step === 3 && (
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: 2, marginBottom: 12 }}>STEP 3 OF 4</div>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 36, fontWeight: 400, marginBottom: 8 }}>Give your agent a personality</h1>
            <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 36, lineHeight: 1.7 }}>How should your agent communicate with customers and in documents?</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 8, letterSpacing: 0.5 }}>Agent name (optional)</label>
                <input style={inputStyle} placeholder={`e.g. Aria, Max, Sam — or leave blank and we'll pick one`}
                  value={form.agent_name} onChange={e => setForm({ ...form, agent_name: e.target.value })} />
              </div>
              <div>
                <label style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 12, letterSpacing: 0.5 }}>Communication tone *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {TONES.map(t => (
                    <button key={t.value} onClick={() => setForm({ ...form, tone: t.value })}
                      style={{
                        padding: '16px 18px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                        background: form.tone === t.value ? 'var(--fg)' : 'var(--bg2)',
                        color: form.tone === t.value ? 'var(--bg)' : 'var(--fg)',
                        border: `1px solid ${form.tone === t.value ? 'var(--fg)' : 'var(--border)'}`,
                        transition: 'all 0.15s',
                      }}>
                      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{t.label}</div>
                      <div style={{ fontSize: 12, opacity: 0.6 }}>{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 36 }}>
              <button onClick={() => setStep(2)} className="btn btn-outline" style={{ fontSize: 14, padding: '13px 24px' }}>← Back</button>
              <button onClick={() => setStep(4)} className="btn btn-accent" style={{ fontSize: 14, padding: '13px 32px' }}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 4 — Review & Generate */}
        {step === 4 && (
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: 2, marginBottom: 12 }}>STEP 4 OF 4</div>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 36, fontWeight: 400, marginBottom: 8 }}>
              {generating ? 'Building your agent...' : 'Ready to build your agent'}
            </h1>
            <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 36, lineHeight: 1.7 }}>
              {generating ? 'This takes about 10 seconds. We\'re creating a custom AI agent for your business.' : 'Review your setup and hit build to create your agent.'}
            </p>

            {!generating && (
              <>
                <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 28 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>Business</span>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{form.business_name}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>Industry</span>
                      <span style={{ fontSize: 14 }}>{form.industry}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>Tone</span>
                      <span style={{ fontSize: 14 }}>{form.tone}</span>
                    </div>
                    <div>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 10 }}>Tasks ({form.tasks.length})</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {form.tasks.map(t => (
                          <span key={t} className="tag">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setStep(3)} className="btn btn-outline" style={{ fontSize: 14, padding: '13px 24px' }}>← Back</button>
                  <button onClick={generate} className="btn btn-accent" style={{ fontSize: 14, padding: '13px 32px' }}>
                    Build my agent →
                  </button>
                </div>
              </>
            )}

            {generating && (
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 40, textAlign: 'center' }}>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 20 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
                <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)' }}>
                  Building {form.agent_name || 'your agent'} for {form.business_name}...
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 60%, 100% { opacity: 0.3; transform: scale(1); }
          30% { opacity: 1; transform: scale(1.3); }
        }
      `}</style>
    </>
  )
}