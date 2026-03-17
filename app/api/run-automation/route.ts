import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  try {
    const { automationId } = await req.json()

    if (!automationId) {
      return NextResponse.json({ error: 'Missing automationId' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: automation } = await supabase
      .from('scheduled_automations')
      .select('*, business_agents(*)')
      .eq('id', automationId)
      .single()

    if (!automation) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 })
    }

    const agent = automation.business_agents
    const today = new Date()
    const formatDate = (d: Date) => d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

    const [{ data: memories }, { data: knowledge }, { data: contacts }, { data: events }] = await Promise.all([
      supabase.from('agent_memory').select('*').eq('business_agent_id', agent.id),
      supabase.from('knowledge_base').select('*').eq('business_agent_id', agent.id),
      supabase.from('contacts').select('*').eq('business_agent_id', agent.id),
      supabase.from('calendar_events').select('*').eq('business_agent_id', agent.id).gte('event_date', today.toISOString().split('T')[0]).limit(5),
    ])

    const memoryContext = memories?.length ? `MEMORY:\n${memories.map((m: any) => `- ${m.key}: ${m.value}`).join('\n')}` : ''
    const knowledgeContext = knowledge?.length ? `KNOWLEDGE:\n${knowledge.map((k: any) => `${k.title}: ${k.content}`).join('\n')}` : ''
    const contactsContext = contacts?.length ? `CONTACTS:\n${contacts.map((c: any) => `- ${c.name}${c.email ? ` (${c.email})` : ''}`).join('\n')}` : ''
    const eventsContext = events?.length ? `UPCOMING:\n${events.map((e: any) => `- ${e.event_date}: ${e.title}`).join('\n')}` : ''

    const systemPrompt = `You are ${agent.agent_name}, AI business agent for ${agent.business_name}.
Today: ${formatDate(today)}
${memoryContext}
${knowledgeContext}
${contactsContext}
${eventsContext}

You are running a scheduled automation. Complete the task fully and professionally.
Be concise and actionable. Format output clearly.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: automation.prompt }],
      }),
    })

    const data = await response.json()
    const result = data.content[0].text

    await supabase.from('automation_results').insert({
      automation_id: automationId,
      business_agent_id: agent.id,
      result,
      status: 'completed',
      ran_at: new Date().toISOString(),
    })

    const nextRun = calculateNextRun(automation.schedule, automation.schedule_day, automation.schedule_time)
    await supabase.from('scheduled_automations').update({
      last_run: new Date().toISOString(),
      next_run: nextRun,
    }).eq('id', automationId)

    if (automation.notify_email) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: 'AgentBoard <onboarding@resend.dev>',
          to: automation.notify_email,
          subject: `${automation.name} — ${agent.business_name}`,
          html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f4f6;padding:48px 24px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:16px;overflow:hidden;">
  <tr><td style="background:#0a0a0a;padding:28px 40px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td><div style="color:#ffffff;font-size:17px;font-weight:700;">${agent.business_name}</div>
      <div style="color:#9ca3af;font-size:11px;font-family:monospace;margin-top:4px;">Scheduled Automation</div></td>
      <td align="right"><span style="background:#c8f135;color:#0a0a0a;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:5px 12px;border-radius:20px;font-family:monospace;">${automation.name}</span></td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:32px 40px;">
    <div style="font-family:monospace;font-size:11px;color:#9ca3af;margin-bottom:16px;letter-spacing:1px;text-transform:uppercase;">Result — ${formatDate(today)}</div>
    <div style="font-size:14px;line-height:1.8;color:#374151;white-space:pre-wrap;">${result.replace(/\n/g, '<br>')}</div>
  </td></tr>
  <tr><td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="font-size:11px;color:#9ca3af;font-family:monospace;">Sent by ${agent.agent_name}</td>
      <td align="right" style="font-size:11px;color:#9ca3af;font-family:monospace;">AgentBoard</td>
    </tr></table>
  </td></tr>
</table></td></tr></table>
</body></html>`
        })
      } catch { }
    }

    return NextResponse.json({ success: true, result })
  } catch (err) {
    console.error('Run automation error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function calculateNextRun(schedule: string, day: string, time: string): string {
  const now = new Date()
  const [hours, minutes] = time.split(':').map(Number)
  const next = new Date()
  next.setHours(hours, minutes, 0, 0)

  if (schedule === 'daily') {
    if (next <= now) next.setDate(next.getDate() + 1)
  } else if (schedule === 'weekly') {
    const days: Record<string, number> = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 }
    const targetDay = days[day?.toLowerCase()] ?? 1
    const currentDay = now.getDay()
    let daysUntil = targetDay - currentDay
    if (daysUntil < 0 || (daysUntil === 0 && next <= now)) daysUntil += 7
    next.setDate(next.getDate() + daysUntil)
  } else if (schedule === 'monthly') {
    const targetDate = parseInt(day) || 1
    next.setDate(targetDate)
    if (next <= now) {
      next.setMonth(next.getMonth() + 1)
      next.setDate(targetDate)
    }
  }

  return next.toISOString()
}