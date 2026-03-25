'use client'
import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function SuccessContent() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const activate = async () => {
      const session_id = searchParams.get('session_id')
      if (session_id) {
        try {
          await fetch('/api/stripe/activate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id }),
          })
        } catch (err) {
          console.error('Activation error:', err)
        }
      }
      window.location.href = '/dashboard'
    }
    activate()
  }, [searchParams])

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 32, height: 32, border: '2px solid #1f1f1f', borderTopColor: '#c8f135', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <p style={{ color: '#808080', fontSize: 14, fontFamily: 'system-ui', margin: 0 }}>Activating your subscription...</p>
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
