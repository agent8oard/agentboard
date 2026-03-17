import { createClient } from '@supabase/supabase-js'
import PortalClient from './PortalClient'
import { notFound } from 'next/navigation'

export default async function PortalPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: agent } = await supabase
    .from('business_agents')
    .select('*')
    .eq('id', id)
    .eq('portal_enabled', true)
    .single()

  if (!agent) return notFound()

  const { data: knowledge } = await supabase
    .from('knowledge_base')
    .select('*')
    .eq('business_agent_id', id)

  return <PortalClient agent={agent} knowledge={knowledge || []} />
}