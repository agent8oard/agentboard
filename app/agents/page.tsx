import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

export default async function AgentsPage() {
  const { data: agents } = await supabase
    .from('agents')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return (
    <>
      <Navbar active="agents" />
      <div className="page">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }}>
          <div>
            <div className="section-label">marketplace</div>
            <h1 className="section-title" style={{ marginBottom: 0 }}>Browse Agents</h1>
          </div>
          <Link href="/agents/new" className="btn btn-accent" style={{ fontSize: 13, padding: '10px 22px' }}>+ List your agent</Link>
        </div>

        {(!agents || agents.length === 0) && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 13 }}>
            No agents listed yet — be the first.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {agents?.map(agent => (
            <div key={agent.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <span className="tag">{agent.category}</span>
                <span className={`badge badge-${agent.badge || 'new'}`}>{agent.badge || 'new'}</span>
              </div>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 400, marginBottom: 8 }}>{agent.name}</h2>
              <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 20, minHeight: 60 }}>{agent.description}</p>
              {agent.tags?.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
                  {agent.tags.map((t: string) => <span key={t} className="tag">{t}</span>)}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 500 }}>{agent.price_label}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>★ {agent.rating || '—'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
