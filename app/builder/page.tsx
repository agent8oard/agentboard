'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

const STEPS = ['Business', 'Purpose', 'Personality', 'Your Agent']

const TASKS = [
  'Customer support', 'Email management', 'Order tracking',
  'Appointment booking', 'FAQ answering', 'Lead generation',
  'Invoice handling', 'Social media replies', 'Product recommendations',
  'Inventory management', 'Staff scheduling', 'Marketing content',
  'Contract drafting', 'Financial reporting', 'Client onboarding'
]

export default function BuildPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    businessName: '', industry: '', description: '',
    tasks: [] as string[], agentName: '', tone: 'professional', extraInfo: '',
  })

  const update = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }))
  const toggleTask = (task: string) => setForm(f => ({
    ...f,
    tasks: f.tasks.includes(task) ? f.tasks.filter(t => t !== task) : [...f.tasks, task]
  }))

  const generate = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/generate-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await response.json()
      if (data.error) { alert(data.error); setLoading(false); return }
      setResult(data)
      setStep(3)
    } catch (err) {
      console.error(err)
      alert('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  const saveToDashboard = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }

    const { data, error } = await supabase.from('business_agents').insert({
      user_id: user.id,
      business_name: form.businessName,
      industry: form.industry,
      description: form.description,
      agent_name: result.name,
      tone: form.tone,
      tasks: form.tasks,
      system_prompt: result.systemPrompt,
      automations: result.automations,
    }).select().single()

    if (error) { alert(error.message); setSaving(false); return }
    router.push(`/agent/${data.id}`)
  }

  const inputStyle = {
    width: '100%', padding: '11px 16px',
    border: '1px solid var(--border2)', borderRadius: 10,
    fontFamily: 'var(--sans)', fontSize: 14,
    background: 'var(--bg2)', color: 'var(--fg)', outline: 'none',
  }

  return (
    <>
      <Navbar active="builder" />
      <div className="page" style={{ maxWidth: 720 }}>
        <div style={{ marginBottom: 40 }}>
          <div className="section-label">agent builder</div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 40, fontWeight: 400, marginBottom: 8 }}>Build your AI agent</h1>
          <p style={{ color: 'var(--muted)', fontSize: 15 }}>Answer a few questions and get a fully custom AI automation suite for your business.</p>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 40 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1 }}>
              <div style={{ height: 3, borderRadius: 2, background: i <= step ? 'var(--accent)' : 'var(--border2)', marginBottom: 6, transition: 'background 0.3s' }} />
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: i <= step ? 'var(--fg)' : 'var(--muted)' }}>{s}</div>
            </div>
          ))}
        </div>

        {step === 0 && (
          <div>
            <div className="form-group">
              <label className="label">business name</label>
              <input style={inputStyle} placeholder="e.g. Sunrise Bakery" value={form.businessName} onChange={e => update('businessName', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">industry</label>
              <select style={inputStyle} value={form.industry} onChange={e => update('industry', e.target.value)}>
                <option value="">Select your industry</option>
                {['E-commerce', 'Food & Beverage', 'Healthcare', 'Legal', 'Real Estate', 'Education', 'Finance', 'Retail', 'Technology', 'Hospitality', 'Beauty & Wellness', 'Construction', 'Marketing', 'Other'].map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">what does your business do?</label>
              <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={4}
                placeholder="Describe your business in detail. What do you sell or offer? Who are your customers? What are your biggest challenges?"
                value={form.description} onChange={e => update('description', e.target.value)} />
            </div>
            <button className="btn btn-accent" style={{ fontSize: 13, padding: '12px 28px', opacity: (!form.businessName || !form.industry || !form.description) ? 0.4 : 1 }}
              disabled={!form.businessName || !form.industry || !form.description} onClick={() => setStep(1)}>Next →</button>
          </div>
        )}

        {step === 1 && (
          <div>
            <div className="form-group">
              <label className="label">what areas do you want AI to help with? (select all that apply)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
                {TASKS.map(task => (
                  <button key={task} onClick={() => toggleTask(task)} style={{
                    fontFamily: 'var(--mono)', fontSize: 12, padding: '8px 16px', borderRadius: 20, cursor: 'pointer',
                    background: form.tasks.includes(task) ? 'var(--accent)' : 'var(--bg3)',
                    color: form.tasks.includes(task) ? '#0a0a0a' : 'var(--muted)',
                    border: `1px solid ${form.tasks.includes(task) ? 'var(--accent)' : 'var(--border2)'}`,
                  }}>{task}</button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="label">describe any specific problems or tasks you want automated</label>
              <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={4}
                placeholder="e.g. I spend 3 hours a day replying to the same customer questions. I need weekly sales reports. I want to follow up with leads automatically..."
                value={form.extraInfo} onChange={e => update('extraInfo', e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-outline" style={{ fontSize: 13, padding: '12px 28px' }} onClick={() => setStep(0)}>← Back</button>
              <button className="btn btn-accent" style={{ fontSize: 13, padding: '12px 28px', opacity: form.tasks.length === 0 ? 0.4 : 1 }}
                disabled={form.tasks.length === 0} onClick={() => setStep(2)}>Next →</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="form-group">
              <label className="label">name your AI agent</label>
              <input style={inputStyle} placeholder="e.g. Aria, Max, Nova..." value={form.agentName} onChange={e => update('agentName', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">how should your agent communicate?</label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                {['Professional', 'Friendly', 'Casual', 'Formal', 'Enthusiastic', 'Empathetic'].map(tone => (
                  <button key={tone} onClick={() => update('tone', tone.toLowerCase())} style={{
                    fontFamily: 'var(--mono)', fontSize: 12, padding: '8px 16px', borderRadius: 20, cursor: 'pointer',
                    background: form.tone === tone.toLowerCase() ? 'var(--accent)' : 'var(--bg3)',
                    color: form.tone === tone.toLowerCase() ? '#0a0a0a' : 'var(--muted)',
                    border: `1px solid ${form.tone === tone.toLowerCase() ? 'var(--accent)' : 'var(--border2)'}`,
                  }}>{tone}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-outline" style={{ fontSize: 13, padding: '12px 28px' }} onClick={() => setStep(1)}>← Back</button>
              <button className="btn btn-accent" style={{ fontSize: 13, padding: '12px 28px', opacity: (loading || !form.agentName) ? 0.6 : 1 }}
                disabled={loading || !form.agentName} onClick={generate}>
                {loading ? 'Building your agent...' : 'Build My Agent ✦'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && result && (
          <div>
            <div style={{ background: 'var(--fg)', color: 'var(--bg)', borderRadius: 16, padding: '28px 32px', marginBottom: 24 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, opacity: 0.5, marginBottom: 8, letterSpacing: 1 }}>YOUR CUSTOM AI AGENT IS READY</div>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: 36, fontWeight: 400, marginBottom: 8 }}>{result.name}</h2>
              <p style={{ fontSize: 15, opacity: 0.7, lineHeight: 1.6, marginBottom: 16 }}>{result.description}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {result.tags?.map((tag: string) => (
                  <span key={tag} style={{ fontFamily: 'var(--mono)', fontSize: 11, padding: '4px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>{tag}</span>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div className="label" style={{ marginBottom: 16 }}>your custom automations ({result.automations?.length})</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {result.automations?.map((auto: any) => (
                  <div key={auto.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
                    <div style={{ fontSize: 28, marginBottom: 10 }}>{auto.icon}</div>
                    <h3 style={{ fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 400, marginBottom: 6 }}>{auto.title}</h3>
                    <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{auto.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
              <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>
                Click <strong style={{ color: 'var(--fg)' }}>Launch My Dashboard</strong> to get your personal AI agent dashboard where you can run all these automations instantly — no setup required.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-accent" style={{ fontSize: 13, padding: '12px 32px', opacity: saving ? 0.6 : 1 }}
                disabled={saving} onClick={saveToDashboard}>
                {saving ? 'Setting up...' : 'Launch My Dashboard →'}
              </button>
              <button className="btn btn-outline" style={{ fontSize: 13, padding: '12px 28px' }} onClick={() => setStep(2)}>
                Regenerate
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}