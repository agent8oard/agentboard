import { createClient } from '@supabase/supabase-js'
import AgentClient from './AgentClient'

export default async function AgentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data: agent, error } = await supabase
    .from('business_agents')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !agent) {
    return (
      <div style={{ fontFamily: 'sans-serif', padding: 40, color: 'white', background: '#080808', minHeight: '100vh' }}>
        <p style={{ color: '#f87171', marginBottom: 16 }}>Error: {error?.message || 'Agent not found'}</p>
        <p style={{ color: '#666', fontSize: 13 }}>ID: [{id}]</p>
        <a href="/dashboard" style={{ color: '#c8f135' }}>← Back to dashboard</a>
      </div>
    )
  }

  return <AgentClient agent={agent} />
}