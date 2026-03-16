import { createClient } from '@supabase/supabase-js'
import AgentClient from './AgentClient'

export default async function AgentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: agent, error } = await supabase
    .from('business_agents')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !agent) {
    return (
      <div style={{
        fontFamily: 'sans-serif', padding: 40, color: 'white',
        background: '#080808', minHeight: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <p style={{ color: '#f87171', marginBottom: 16, fontSize: 16 }}>
          {error?.message || 'Agent not found'}
        </p>
        <a href="/dashboard" style={{ color: '#c8f135', fontFamily: 'monospace', fontSize: 13 }}>
          ← Back to dashboard
        </a>
      </div>
    )
  }

  return <AgentClient agent={agent} />
}