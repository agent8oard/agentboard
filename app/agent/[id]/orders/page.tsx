import { createClient } from '@supabase/supabase-js'
import OrdersClient from './OrdersClient'

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [{ data: agent }, { data: orders }] = await Promise.all([
    supabase.from('business_agents').select('*').eq('id', id).single(),
    supabase.from('orders').select('*').eq('business_agent_id', id).order('created_at', { ascending: false }),
  ])

  if (!agent) return <div style={{ padding: 40, color: '#fff' }}>Agent not found</div>

  return <OrdersClient agent={agent} orders={orders || []} />
}