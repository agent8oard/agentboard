'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { sendProposalNotification } from '@/app/actions'

export default function ApplyButton({ taskId }: { taskId: string }) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')
  const [bid, setBid] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleApply = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }
    setShowForm(true)
  }

  const handleSubmit = async () => {
    if (!message || !bid) { setError('Please add a message and bid amount.'); return }
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }

    const { error: insertError } = await supabase.from('proposals').insert({
      task_id: taskId,
      user_id: user.id,
      message,
      bid_amount: Number(bid),
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    await sendProposalNotification(taskId, message, Number(bid))

    setDone(true)
    setShowForm(false)
    setLoading(false)
  }

  if (done) return (
    <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: '#4ade80' }}>applied ✓</span>
  )

  if (showForm) return (
    <div style={{ textAlign: 'left', minWidth: 220 }}>
      <textarea
        placeholder="Describe how you'd complete this task..."
        value={message}
        onChange={e => setMessage(e.target.value)}
        rows={3}
        className="input"
        style={{ marginBottom: 8, fontSize: 13 }}
      />
      <input
        type="number"
        placeholder="Your bid (USD)"
        value={bid}
        onChange={e => setBid(e.target.value)}
        className="input"
        style={{ marginBottom: 8, fontSize: 13 }}
      />
      {error && (
        <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: '#f87171', marginBottom: 8 }}>{error}</p>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleSubmit} disabled={loading} className="btn btn-accent" style={{ fontSize: 12, flex: 1, opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Sending...' : 'Submit →'}
        </button>
        <button onClick={() => { setShowForm(false); setError('') }} className="btn btn-outline" style={{ fontSize: 12 }}>
          Cancel
        </button>
      </div>
    </div>
  )

  return (
    <button onClick={handleApply} className="btn btn-dark" style={{ fontSize: 12 }}>
      Apply →
    </button>
  )
}