import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default async function AgentsPage() {
  const { data: agents } = await supabase
    .from('agents')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return (
    <main style={{ fontFamily: 'sans-serif', maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700 }}>Browse Agents</h1>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link href="/agents/new" style={{ background: '#000', color: '#fff', padding: '10px 20px', borderRadius: 8, textDecoration: 'none', fontSize: 14 }}>
            + List Agent
          </Link>
          <Link href="/" style={{ color: '#666', textDecoration: 'none' }}>← Home</Link>
        </div>
      </div>

      {agents?.length === 0 && (
        <p style={{ color: '#666' }}>No agents listed yet. Be the first!</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
        {agents?.map(agent => (
          <div key={agent.id} style={{ border: '1px solid #e5e5e5', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13, background: '#f3f3f3', display: 'inline-block', padding: '3px 10px', borderRadius: 20, marginBottom: 10 }}>
              {agent.category}
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{agent.name}</h2>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 16, lineHeight: 1.5 }}>{agent.description}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>{agent.price_label}</span>
              <span style={{ fontSize: 13, color: '#888' }}>★ {agent.rating}</span>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}