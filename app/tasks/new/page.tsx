'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewTaskPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '', description: '', category: '', budget: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('You must be logged in to post a task.'); setLoading(false); return }

    const { error } = await supabase.from('tasks').insert({
      title: form.title,
      description: form.description,
      category: form.category,
      budget: Number(form.budget),
      user_id: user.id,
    })

    if (error) { setError(error.message); setLoading(false); return }
    router.push('/tasks')
  }

  const field = (label: string, key: string, type = 'text', placeholder = '') => (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={form[key as keyof typeof form]}
        onChange={e => setForm({ ...form, [key]: e.target.value })}
        required
        style={{ width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, background: 'transparent', color: 'inherit' }}
      />
    </div>
  )

  return (
    <main style={{ fontFamily: 'sans-serif', maxWidth: 560, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>Post a Task</h1>
        <Link href="/tasks" style={{ color: '#666', textDecoration: 'none' }}>← Back</Link>
      </div>

      <form onSubmit={handleSubmit}>
        {field('Task title', 'title', 'text', 'e.g. Scrape 500 product listings')}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Description</label>
          <textarea
            placeholder="Describe what you need done, inputs, outputs, and any requirements..."
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            required
            rows={4}
            style={{ width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, resize: 'vertical', background: 'transparent', color: 'inherit' }}
          />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Category</label>
          <select
            value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value })}
            required
            style={{ width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, background: 'transparent', color: 'inherit' }}
          >
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
        {field('Budget (USD)', 'budget', 'number', '50')}

        {error && <p style={{ color: 'red', fontSize: 14, marginBottom: 16 }}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: '12px', background: '#000', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}
        >
          {loading ? 'Posting...' : 'Post Task →'}
        </button>
      </form>
    </main>
  )
}