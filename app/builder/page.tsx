'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

const STEPS = ['Business', 'Purpose', 'Personality', 'Generate']

const TASKS = [
'Customer support', 'Email management', 'Order tracking',
'Appointment booking', 'FAQ answering', 'Lead generation',
'Invoice handling', 'Social media replies', 'Product recommendations'
]

export default function BuildPage() {
const router = useRouter()
const [step, setStep] = useState(0)
const [loading, setLoading] = useState(false)
const [done, setDone] = useState(false)
const [result, setResult] = useState<any>(null)
const [form, setForm] = useState({
businessName: '',
industry: '',
description: '',
tasks: [] as string[],
agentName: '',
tone: 'professional',
extraInfo: '',
})

const update = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }))

const toggleTask = (task: string) => {
setForm(f => ({
...f,
tasks: f.tasks.includes(task)
? f.tasks.filter(t => t !== task)
: [...f.tasks, task]
}))
}

const generate = async () => {
setLoading(true)
try {
const response = await fetch('/api/generate-agent', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(form),
})
const data = await response.json()
setResult(data)
setStep(3)
} catch (err) {
console.error(err)
}
setLoading(false)
}

const saveAgent = async () => {
setLoading(true)
const { data: { user } } = await supabase.auth.getUser()
if (!user) { router.push('/auth'); return }

await supabase.from('agents').insert({
user_id: user.id,
name: result.name,
description: result.description,
category: result.category,
tags: result.tags,
price_label: 'Contact for pricing',
price_amount: 0,
is_active: true,
badge: 'new',
})

setDone(true)
setLoading(false)
}

const inputStyle = {
width: '100%', padding: '11px 16px',
border: '1px solid var(--border2)', borderRadius: 10,
fontFamily: 'var(--sans)', fontSize: 14,
background: 'var(--bg2)', color: 'var(--fg)',
outline: 'none',
}

if (done) return (
<>
<Navbar />
<div className="page" style={{ textAlign: 'center', paddingTop: 80 }}>
<div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
<h1 style={{ fontFamily: 'var(--serif)', fontSize: 40, fontWeight: 400, marginBottom: 12 }}>
Your agent is live!
</h1>
<p style={{ color: 'var(--muted)', fontSize: 16, marginBottom: 32 }}>
{result?.name} has been listed on AgentBoard.
</p>
<div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
<button onClick={() => router.push('/agents')} className="btn btn-accent" style={{ fontSize: 13, padding: '12px 28px' }}>
View on marketplace →
</button>
<button onClick={() => router.push('/dashboard')} className="btn btn-outline" style={{ fontSize: 13, padding: '12px 28px' }}>
Go to dashboard
</button>
</div>
</div>
</>
)

return (
<>
<Navbar />
<div className="page" style={{ maxWidth: 640 }}>

{/* Header */}
<div style={{ marginBottom: 40 }}>
<div className="section-label">agent builder</div>
<h1 style={{ fontFamily: 'var(--serif)', fontSize: 40, fontWeight: 400, marginBottom: 8 }}>
Build your AI agent
</h1>
<p style={{ color: 'var(--muted)', fontSize: 15 }}>
Answer a few questions and we'll create a custom AI agent for your business.
</p>
</div>

{/* Progress */}
<div style={{ display: 'flex', gap: 8, marginBottom: 40 }}>
{STEPS.map((s, i) => (
<div key={s} style={{ flex: 1 }}>
<div style={{
height: 3, borderRadius: 2,
background: i <= step ? 'var(--accent)' : 'var(--border2)',
marginBottom: 6, transition: 'background 0.3s'
}} />
<div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: i <= step ? 'var(--fg)' : 'var(--muted)' }}>
{s}
</div>
</div>
))}
</div>

{/* Step 0 — Business Info */}
{step === 0 && (
<div>
<div className="form-group">
<label className="label">business name</label>
<input style={inputStyle} placeholder="e.g. Sunrise Bakery" value={form.businessName}
onChange={e => update('businessName', e.target.value)} />
</div>
<div className="form-group">
<label className="label">industry</label>
<select style={inputStyle} value={form.industry} onChange={e => update('industry', e.target.value)}>
<option value="">Select your industry</option>
{['E-commerce', 'Food & Beverage', 'Healthcare', 'Legal', 'Real Estate',
'Education', 'Finance', 'Retail', 'Technology', 'Hospitality', 'Other'].map(i => (
<option key={i}>{i}</option>
))}
</select>
</div>
<div className="form-group">
<label className="label">what does your business do?</label>
<textarea style={{ ...inputStyle, resize: 'vertical' }} rows={3}
placeholder="e.g. We sell handmade cakes and pastries online and in-store"
value={form.description} onChange={e => update('description', e.target.value)} />
</div>
<button
className="btn btn-accent"
style={{ fontSize: 13, padding: '12px 28px', opacity: (!form.businessName || !form.industry || !form.description) ? 0.4 : 1 }}
disabled={!form.businessName || !form.industry || !form.description}
onClick={() => setStep(1)}>
Next →
</button>
</div>
)}

{/* Step 1 — Purpose */}
{step === 1 && (
<div>
<div className="form-group">
<label className="label">what should your agent help with? (select all that apply)</label>
<div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
{TASKS.map(task => (
<button key={task} onClick={() => toggleTask(task)}
style={{
fontFamily: 'var(--mono)', fontSize: 12, padding: '8px 16px',
borderRadius: 20, cursor: 'pointer', transition: 'all 0.15s',
background: form.tasks.includes(task) ? 'var(--accent)' : 'var(--bg3)',
color: form.tasks.includes(task) ? '#0a0a0a' : 'var(--muted)',
border: `1px solid ${form.tasks.includes(task) ? 'var(--accent)' : 'var(--border2)'}`,
}}>
{task}
</button>
))}
</div>
</div>
<div className="form-group">
<label className="label">anything else you want the agent to do?</label>
<textarea style={{ ...inputStyle, resize: 'vertical' }} rows={3}
placeholder="e.g. Notify me when an order is over $500, speak in French..."
value={form.extraInfo} onChange={e => update('extraInfo', e.target.value)} />
</div>
<div style={{ display: 'flex', gap: 10 }}>
<button className="btn btn-outline" style={{ fontSize: 13, padding: '12px 28px' }} onClick={() => setStep(0)}>← Back</button>
<button className="btn btn-accent" style={{ fontSize: 13, padding: '12px 28px', opacity: form.tasks.length === 0 ? 0.4 : 1 }}
disabled={form.tasks.length === 0} onClick={() => setStep(2)}>Next →</button>
</div>
</div>
)}

{/* Step 2 — Personality */}
{step === 2 && (
<div>
<div className="form-group">
<label className="label">agent name</label>
<input style={inputStyle} placeholder="e.g. Aria, Max, Nova..." value={form.agentName}
onChange={e => update('agentName', e.target.value)} />
</div>
<div className="form-group">
<label className="label">tone & personality</label>
<div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
{['Professional', 'Friendly', 'Casual', 'Formal', 'Enthusiastic', 'Empathetic'].map(tone => (
<button key={tone} onClick={() => update('tone', tone.toLowerCase())}
style={{
fontFamily: 'var(--mono)', fontSize: 12, padding: '8px 16px',
borderRadius: 20, cursor: 'pointer', transition: 'all 0.15s',
background: form.tone === tone.toLowerCase() ? 'var(--accent)' : 'var(--bg3)',
color: form.tone === tone.toLowerCase() ? '#0a0a0a' : 'var(--muted)',
border: `1px solid ${form.tone === tone.toLowerCase() ? 'var(--accent)' : 'var(--border2)'}`,
}}>
{tone}
</button>
))}
</div>
</div>
<div style={{ display: 'flex', gap: 10 }}>
<button className="btn btn-outline" style={{ fontSize: 13, padding: '12px 28px' }} onClick={() => setStep(1)}>← Back</button>
<button className="btn btn-accent" style={{ fontSize: 13, padding: '12px 28px', opacity: loading ? 0.6 : 1 }}
disabled={loading || !form.agentName} onClick={generate}>
{loading ? 'Generating...' : 'Generate Agent ✦'}
</button>
</div>
</div>
)}

{/* Step 3 — Result */}
{step === 3 && result && (
<div>
<div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, marginBottom: 24 }}>
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
<div>
<div className="section-label" style={{ marginBottom: 6 }}>your agent is ready</div>
<h2 style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 400 }}>{result.name}</h2>
</div>
<span className="tag">{result.category}</span>
</div>
<p style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 20 }}>{result.description}</p>
<div style={{ marginBottom: 20 }}>
<div className="label" style={{ marginBottom: 8 }}>capabilities</div>
<div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
{result.tags?.map((tag: string) => <span key={tag} className="tag">{tag}</span>)}
</div>
</div>
<div>
<div className="label" style={{ marginBottom: 8 }}>system prompt</div>
<div style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 10, padding: 16, fontFamily: 'var(--mono)', fontSize: 12, lineHeight: 1.7, color: 'var(--muted)', whiteSpace: 'pre-wrap' }}>
{result.systemPrompt}
</div>
</div>
</div>

<div style={{ display: 'flex', gap: 10 }}>
<button className="btn btn-accent" style={{ fontSize: 13, padding: '12px 28px', opacity: loading ? 0.6 : 1 }}
disabled={loading} onClick={saveAgent}>
{loading ? 'Saving...' : 'List on AgentBoard →'}
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
