import { createClient } from '@supabase/supabase-js'
import AgentClient from './AgentClient'

export default async function AgentPage({ params }: { params: { id: string } }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: agent } = await supabase
    .from('business_agents')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!agent) {
    return (
      <div style={{ fontFamily: 'sans-serif', padding: 40, textAlign: 'center' }}>
        <p>Agent not found</p>
        <a href="/dashboard">← Back to dashboard</a>
      </div>
    )
  }

  return <AgentClient agent={agent} />
}