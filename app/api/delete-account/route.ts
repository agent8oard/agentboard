import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    // Verify the user is authenticated via the anon client
    const { createClient: createBrowserClient } = await import('@supabase/supabase-js')
    const anonClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') || '' }
        }
      }
    )
    const { data: { user }, error: authError } = await anonClient.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id

    // Use service role client to delete all user data
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get all agent IDs for this user first
    const { data: agents } = await admin
      .from('business_agents')
      .select('id')
      .eq('user_id', userId)

    const agentIds = (agents || []).map(a => a.id)

    // Delete all related data in dependency order
    if (agentIds.length > 0) {
      await admin.from('knowledge_base').delete().in('business_agent_id', agentIds)
      await admin.from('contacts').delete().in('business_agent_id', agentIds)
      await admin.from('agent_memory').delete().in('business_agent_id', agentIds)
      await admin.from('calendar_events').delete().in('business_agent_id', agentIds)
      await admin.from('orders').delete().in('business_agent_id', agentIds)
      await admin.from('quotes').delete().in('business_agent_id', agentIds)
      await admin.from('documents').delete().in('business_agent_id', agentIds)
      await admin.from('automation_runs').delete().in('business_agent_id', agentIds)
      await admin.from('team_members').delete().in('business_agent_id', agentIds)
      await admin.from('portal_conversations').delete().in('business_agent_id', agentIds)
    }

    await admin.from('business_agents').delete().eq('user_id', userId)
    await admin.from('profiles').delete().eq('id', userId)

    // Delete the auth user
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId)
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Delete account error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
