'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewAgentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', description: '', category: '', price_label: '', price_amount: '', tags: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('You must be logged in to list an agent.'); setLoading(false); return }

    const { error } = await supabase.from('agents').insert({
      name: form.name,
      description: form.description,
      category: form.category,
      price_label: form.price_label,
      price_amount: Number(form.price_amount),
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      user_id: user.id,
      is_active: true,
    })

    if (error) { setError(error.message); setLoading(false); return }
    router.push('/agents')
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px', border: '1px solid #ddd',
    borderRadius: 8, fontSize: 14, background: 'transparent', color: 'inherit'
  }

  return (
    <main style={{ fontFamily: 'sans-serif', maxWidth: 560, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>List an Agent</h1>
        <Link href="/agents" style={{ color: '#666', textDecoration: 'none' }}>← Back</Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Agent name</label>
          <input type="text" placeholder="e.g. SEO Writer Bot" required style={inputStyle}
            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Description</label>
          <textarea placeholder="What does your agent do? What are its inputs and outputs?" required rows={4}
            value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            style={{ ...inputStyle, resize: 'vertical' }} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Category</label>
          <select required style={inputStyle}
            value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
            <option value="">Select a category</option>
            <option>Data extraction</option>
            <option>Copywriting</option>
            <option>Research</option>
            <option>Code generation</option>
            <option>Email / outreach</option>
            <option>Image processing</option>
            <option>Customer support</option>
            <option>Other</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Price label</label>
            <input type="text" placeholder="e.g. $25/task or $49/mo" required style={inputStyle}
              value={form.price_label} onChange={e => setForm({ ...form, price_label: e.target.value })} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Price amount (USD)</label>
            <input type="number" placeholder="25" required style={inputStyle}
              value={form.price_amount} onChange={e => setForm({ ...form, price_amount: e.target.value })} />
          </div>
        </div>

        <div style={{ marginBottom: 28 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Tags <span style={{ color: '#999', fontWeight: 400 }}>(comma separated)</span></label>
          <input type="text" placeholder="e.g. writing, SEO, automation" style={inputStyle}
            value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
        </div>

        {error && <p style={{ color: 'red', fontSize: 14, marginBottom: 16 }}>{error}</p>}

        <button type="submit" disabled={loading}
          style={{ width: '100%', padding: 12, background: '#000', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Listing...' : 'List Agent →'}
        </button>
      </form>
    </main>
  )
}