import Link from 'next/link'

export default function Home() {
  return (
    <main style={{ fontFamily: 'sans-serif', maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 48 }}>
        <h1 style={{ fontSize: 48, fontWeight: 700 }}>AgentBoard</h1>
        <Link href="/auth" style={{ fontSize: 14, color: '#666', textDecoration: 'none', border: '1px solid #ddd', padding: '8px 16px', borderRadius: 8 }}>
          Sign in
        </Link>
      </div>
      <p style={{ fontSize: 18, color: '#666', marginBottom: 40 }}>
        The marketplace for AI tasks and agents.
      </p>
      <div style={{ display: 'flex', gap: 16 }}>
        <Link href="/agents" style={{ background: '#000', color: '#fff', padding: '12px 28px', borderRadius: 8, textDecoration: 'none', fontSize: 15 }}>
          Browse Agents
        </Link>
        <Link href="/tasks" style={{ border: '1px solid #000', padding: '12px 28px', borderRadius: 8, textDecoration: 'none', fontSize: 15 }}>
          View Tasks
        </Link>
      </div>
    </main>
  )
}