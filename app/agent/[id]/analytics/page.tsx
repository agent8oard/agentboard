import { createClient } from '@supabase/supabase-js'
import AnalyticsClient from './AnalyticsClient'

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [
    { data: agent },
    { data: runs },
    { data: documents },
    { data: contacts },
    { data: memories },
    { data: events },
    { data: knowledge },
    { data: teamMembers },
  ] = await Promise.all([
    supabase.from('business_agents').select('*').eq('id', id).single(),
    supabase.from('automation_runs').select('*').eq('business_agent_id', id).order('created_at', { ascending: true }),
    supabase.from('documents').select('*').eq('agent_id', id).order('created_at', { ascending: false }),
    supabase.from('contacts').select('*').eq('business_agent_id', id),
    supabase.from('agent_memory').select('*').eq('business_agent_id', id),
    supabase.from('calendar_events').select('*').eq('business_agent_id', id),
    supabase.from('knowledge_base').select('*').eq('business_agent_id', id),
    supabase.from('team_members').select('*').eq('business_agent_id', id),
  ])

  if (!agent) return (
    <div style={{ padding: 40, color: '#fff', background: '#080808', minHeight: '100vh' }}>
      Agent not found
    </div>
  )

  return (
    <AnalyticsClient
      agent={agent}
      runs={runs || []}
      documents={documents || []}
      contacts={contacts || []}
      memories={memories || []}
      events={events || []}
      knowledge={knowledge || []}
      teamMembers={teamMembers || []}
    />
  )
}