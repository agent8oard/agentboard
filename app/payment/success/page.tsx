'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function SuccessContent() {
  const searchParams = useSearchParams()
  const [error, setError] = useState('')

  useEffect(() => {
    const activate = async () => {
      const session_id = searchParams.get('session_id')
      if (!session_id) {
        setError('Missing session ID.')
        return
      }
      try {
        const res = await fetch('/api/stripe/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id }),
        })
        const data = await res.json()
        if (data.success) {
          await new Promise(resolve => setTimeout(resolve, 500))
          window.location.href = '/dashboard'
        } else {
          setError(data.error || 'Payment verification failed.')
        }
      } catch {
        setError('Payment verification failed. Please contact support.')
      }
    }
    activate()
  }, [searchParams])

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24 }}>
        <p style={{ color: '#f44336', fontSize: 15, fontFamily: 'system-ui', margin: 0, fontWeight: 600 }}>Payment verification failed</p>
        <p style={{ color: '#808080', fontSize: 13, fontFamily: 'system-ui', margin: 0, textAlign: 'center', maxWidth: 360 }}>{error}</p>
        <a href="/payment" style={{ marginTop: 8, color: '#c8f135', fontSize: 13, fontFamily: 'system-ui', fontWeight: 600 }}>← Back to payment</a>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 32, height: 32, border: '2px solid #1f1f1f', borderTopColor: '#c8f135', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <p style={{ color: '#808080', fontSize: 14, fontFamily: 'system-ui', margin: 0 }}>Verifying payment...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#000' }} />}>
      <SuccessContent />
    </Suspense>
  )
}
