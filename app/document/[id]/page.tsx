import { createClient } from '@supabase/supabase-js'
import PrintDocument from './PrintDocument'

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: doc } = await supabase
    .from('documents')
    .select('*, business_agents(*)')
    .eq('id', id)
    .single()

  if (!doc) return <div style={{ padding: 40 }}>Document not found</div>

  return <PrintDocument doc={doc} />
}