import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { rateLimit } from '@/lib/rateLimit'
import { sanitize } from '@/lib/sanitize'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { agent, history } = body
    const message = body.message

    if (!message || !agent?.id) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const allowed = await rateLimit(ip, 20, 60)
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 })
    }

    // Sanitize message
    const cleanMessage = sanitize(message)
    if (!cleanMessage) {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 })
    }

    // Sanitize agent fields
    const safeAgent = {
      id: String(agent.id).trim(),
      agent_name: sanitize(String(agent.agent_name || ''), 100),
      business_name: sanitize(String(agent.business_name || ''), 100),
      industry: sanitize(String(agent.industry || ''), 100),
      tone: sanitize(String(agent.tone || ''), 100),
      system_prompt: sanitize(String(agent.system_prompt || ''), 1000),
    }

    const today = new Date()
    const dueDate = new Date(today)
    dueDate.setDate(dueDate.getDate() + 30)
    const in14Days = new Date(today)
    in14Days.setDate(in14Days.getDate() + 14)
    const formatDate = (d: Date) => d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verify agent exists
    const { data: agentCheck } = await supabase
      .from('business_agents')
      .select('id, user_id')
      .eq('id', safeAgent.id)
      .single()

    if (!agentCheck) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const [{ data: memories }, { data: knowledge }, { data: contacts }, { data: upcomingEvents }, { data: recentOrders }, { data: recentDocs }] = await Promise.all([
      supabase.from('agent_memory').select('*').eq('business_agent_id', safeAgent.id).order('updated_at', { ascending: false }),
      supabase.from('knowledge_base').select('*').eq('business_agent_id', safeAgent.id),
      supabase.from('contacts').select('*').eq('business_agent_id', safeAgent.id),
      supabase.from('calendar_events').select('*').eq('business_agent_id', safeAgent.id).gte('event_date', today.toISOString().split('T')[0]).order('event_date', { ascending: true }).limit(10),
      supabase.from('orders').select('*').eq('business_agent_id', safeAgent.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('documents').select('*').eq('agent_id', safeAgent.id).order('created_at', { ascending: false }).limit(5),
    ])

    const memoryContext = memories?.length ? `
MEMORY:
${memories.map((m: Record<string, unknown>) => `- ${m.key}: ${m.value}`).join('\n')}` : ''

    const knowledgeContext = knowledge?.length ? `
KNOWLEDGE BASE:
${knowledge.map((k: Record<string, unknown>) => `[${k.type}] ${k.title}: ${k.content}`).join('\n')}` : ''

    const contactsContext = contacts?.length ? `
CONTACTS:
${contacts.map((c: Record<string, unknown>) => `- ${c.name}${c.email ? ` (${c.email})` : ''}${c.company ? ` at ${c.company}` : ''}${c.notes ? ` — ${c.notes}` : ''}`).join('\n')}` : ''

    const calendarContext = upcomingEvents?.length ? `
UPCOMING:
${upcomingEvents.map((e: Record<string, unknown>) => `- ${e.event_date} ${e.event_time || ''}: ${e.title}${e.location ? ` at ${e.location}` : ''}`).join('\n')}` : ''

    const ordersContext = recentOrders?.length ? `
RECENT ORDERS:
${recentOrders.map((o: Record<string, unknown>) => `- ${o.order_number} | ${o.client_name} | $${o.total} | ${o.status}`).join('\n')}` : ''

    const docsContext = recentDocs?.length ? `
RECENT DOCUMENTS:
${recentDocs.map((d: Record<string, unknown>) => `- ${d.type} | ${(d.metadata as Record<string, unknown>)?.clientName || (d.metadata as Record<string, unknown>)?.title || 'Document'} | ${new Date(d.created_at as string).toLocaleDateString()}`).join('\n')}` : ''

    const buildDocumentHTML = (type: string, content: string, metadata: Record<string, unknown>) => {
      const docNumber = `DOC-${Date.now().toString().slice(-6)}`
      return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f4f6;padding:48px 24px;">
<tr><td align="center">
<table width="680" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:16px;overflow:hidden;">
  <tr>
    <td style="background:#0a0a0a;padding:40px 48px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td valign="top">
            <div style="color:#9ca3af;font-size:10px;letter-spacing:2px;text-transform:uppercase;font-family:monospace;margin-bottom:8px;">FROM</div>
            <div style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">${safeAgent.business_name}</div>
          </td>
          <td align="right" valign="top">
            <div style="color:#9ca3af;font-size:10px;letter-spacing:2px;text-transform:uppercase;font-family:monospace;margin-bottom:8px;">DOCUMENT</div>
            <div style="color:#ffffff;font-size:22px;font-weight:800;">${type}</div>
            <div style="margin-top:10px;">
              <span style="background:#c8f135;color:#0a0a0a;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;padding:5px 14px;border-radius:20px;font-family:monospace;">${docNumber}</span>
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="background:#111111;padding:18px 48px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td><div style="color:#6b7280;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;font-family:monospace;margin-bottom:5px;">DATE</div><div style="color:#ffffff;font-size:13px;font-weight:500;">${formatDate(today)}</div></td>
          ${metadata?.party1 ? `<td><div style="color:#6b7280;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;font-family:monospace;margin-bottom:5px;">PARTY 1</div><div style="color:#ffffff;font-size:13px;font-weight:500;">${metadata.party1}</div></td>` : ''}
          ${metadata?.party2 ? `<td><div style="color:#6b7280;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;font-family:monospace;margin-bottom:5px;">PARTY 2</div><div style="color:#c8f135;font-size:13px;font-weight:600;">${metadata.party2}</div></td>` : ''}
          <td align="right"><div style="color:#6b7280;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;font-family:monospace;margin-bottom:5px;">PREPARED BY</div><div style="color:#ffffff;font-size:13px;font-weight:500;">${safeAgent.agent_name}</div></td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:40px 48px;background:#ffffff;">
      ${metadata?.title ? `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;"><tr><td style="background:#f9fafb;border-left:4px solid #0a0a0a;padding:18px 24px;border-radius:0 8px 8px 0;"><div style="color:#9ca3af;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;font-family:monospace;margin-bottom:8px;">SUBJECT</div><div style="color:#0a0a0a;font-size:18px;font-weight:700;">${metadata.title}</div></td></tr></table>` : ''}
      <div style="font-size:14px;line-height:1.9;color:#374151;">
        ${content
          .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#0a0a0a;font-weight:700;">$1</strong>')
          .replace(/^#{1,3}\s+(.+)$/gm, '<div style="font-size:16px;font-weight:700;color:#0a0a0a;margin:24px 0 10px;padding-bottom:8px;border-bottom:1px solid #e5e7eb;">$1</div>')
          .replace(/^[-•]\s+(.+)$/gm, '<div style="padding:4px 0 4px 20px;position:relative;"><span style="position:absolute;left:6px;color:#c8f135;">▸</span>$1</div>')
          .replace(/\n\n/g, '</p><p style="margin:0 0 14px;">')
          .replace(/\n/g, '<br>')
        }
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:48px;">
        <tr>
          <td width="45%" style="padding:20px 0 0;">
            <div style="border-top:2px solid #0a0a0a;padding-top:10px;">
              <div style="font-size:12px;color:#6b7280;font-family:monospace;">SIGNATURE — ${safeAgent.business_name}</div>
              <div style="font-size:13px;color:#0a0a0a;margin-top:4px;font-weight:600;">Authorised Representative</div>
              <div style="margin-top:24px;font-size:12px;color:#9ca3af;">Date: _______________</div>
            </div>
          </td>
          <td width="10%"></td>
          ${metadata?.party2 ? `<td width="45%" style="padding:20px 0 0;"><div style="border-top:2px solid #0a0a0a;padding-top:10px;"><div style="font-size:12px;color:#6b7280;font-family:monospace;">SIGNATURE — ${metadata.party2}</div><div style="font-size:13px;color:#0a0a0a;margin-top:4px;font-weight:600;">Authorised Representative</div><div style="margin-top:24px;font-size:12px;color:#9ca3af;">Date: _______________</div></div></td>` : ''}
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="background:#f9fafb;padding:24px 48px;border-top:2px solid #0a0a0a;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td><div style="font-size:14px;font-weight:700;color:#0a0a0a;margin-bottom:3px;">${safeAgent.business_name}</div><div style="font-size:11px;color:#9ca3af;font-family:monospace;">Generated by ${safeAgent.agent_name} · ${formatDate(today)}</div></td>
          <td align="right"><div style="font-size:10px;color:#9ca3af;font-family:monospace;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">DOCUMENT TYPE</div><div style="font-size:16px;font-weight:800;color:#0a0a0a;">${type}</div></td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`
    }

    const systemPrompt = `You are ${safeAgent.agent_name}, the AI business assistant for ${safeAgent.business_name}.
Industry: ${safeAgent.industry}
Tone: ${safeAgent.tone}
${safeAgent.system_prompt ? `Business context: ${safeAgent.system_prompt}` : ''}

TODAY: ${formatDate(today)}

${memoryContext}
${knowledgeContext}
${contactsContext}
${calendarContext}
${ordersContext}
${docsContext}

━━━ WHO YOU ARE ━━━

You are NOT a generic AI. You are the dedicated assistant for ${safeAgent.business_name}.
- You know this business deeply — its clients, pricing, history, and preferences
- You speak in the voice of the business — professional, direct, on-brand
- When a client name appears in CONTACTS, use what you know about them
- When pricing appears in KNOWLEDGE BASE, use those exact prices
- You remember past orders, documents, and calendar events shown above
- You make decisions the business owner would make — not generic safe answers

━━━ HOW YOU RESPOND ━━━

SPEED AND CONCISENESS:
- Get to the point immediately — no preamble, no "Sure!", no "Great question!"
- First sentence = what you are doing or have done
- Use short paragraphs, never walls of text
- If asked to do multiple things, do all of them in sequence without asking for permission
- Confirm completion in one line at the end

MULTI-STEP TASKS:
When given a complex task with multiple steps, execute ALL steps automatically:
1. Identify every sub-task in the request
2. Execute them in logical order
3. Use the appropriate markers for each action
4. Give a brief summary at the end listing what was completed

Example: "Schedule inspection for Jane on April 3 at 10:30 AM, generate invoice for $180, email her confirmation"
→ You MUST: add calendar event + create invoice + send email — all in one response

BUSINESS VOICE:
- Match the tone: ${safeAgent.tone}
- Use industry-appropriate language for ${safeAgent.industry}
- Reference the business name naturally where appropriate
- Sound like a knowledgeable team member, not a chatbot

━━━ MEMORY ━━━
[REMEMBER:category:key:value]
Categories: customer, pricing, product, preference, general

━━━ CONTACTS ━━━
[ADD_CONTACT:name:email:company:notes]

━━━ CALENDAR ━━━
[ADD_EVENT:title:date:time:type:location:description:attendees]
- date: YYYY-MM-DD, time: HH:MM 24hr
- type: meeting, appointment, call, deadline, event, reminder

━━━ INVOICE RULES ━━━

Every service or item = its own line. Never combine.

PRICING:
- Individual prices → use exact prices per line
- One lump sum → first line gets full amount, rest show Included / $0.00
- Split evenly → divide total by number of items

INVOICE FORMAT:
INVOICE #INV-[YEAR]-[NUMBER]
Bill To: [client]

[Item] | 1 | $[rate] | $[amount]

Subtotal: $[x]
Tax (10%): $[x]
Total Due: $[x]

INVOICE MARKER:
[SEND_INVOICE:email:INV-[YEAR]-[NUM]:clientName:subtotal:tax:total:Item1|1|$rate|$amount&&Item2|1|Included|$0.00]

━━━ ORDER RULES ━━━

ORDER FORMAT:
ORDER #ORD-[YEAR]-[NUMBER]
Client: [name]

[Item] | Qty: [n] | Unit: $[price] | Total: $[amount]
Subtotal: $[x] | Delivery: $[x] | Total: $[x]

ORDER MARKER:
[CREATE_ORDER:clientName:clientEmail:clientPhone:status:dueDate:notes:itemdesc|qty|price|total&&item2|qty|price|total:subtotal:tax:delivery:discount:grandtotal]

RULES:
- && separates items, | separates fields
- Last 5 colon values: subtotal:tax:delivery:discount:grandtotal
- No colons inside item descriptions

After order: "Want me to generate an invoice for this order?"

━━━ QUOTE RULES ━━━

QUOTE FORMAT:
QUOTE #Q-[YEAR]-[NUMBER]
Client: [name]

[Item] | Qty: [n] | Unit: $[price] | Total: $[amount]
Total: $[x]

QUOTE MARKER:
[CREATE_QUOTE:clientName:clientEmail:validUntil:notes:itemdesc|qty|price|total&&item2|qty|price|total:subtotal:tax:discount:grandtotal]

When user says "convert quote to invoice" → generate SEND_INVOICE marker automatically.

━━━ DOCUMENTS ━━━

CONTRACT: [CREATE_DOCUMENT:CONTRACT:title|party1|party2]
PROPOSAL: [CREATE_DOCUMENT:PROPOSAL:title|clientName|date]
REPORT: [CREATE_DOCUMENT:REPORT:title|period|date]
MEETING AGENDA: [CREATE_DOCUMENT:MEETING AGENDA:title|organizer|date]
JOB LISTING: [CREATE_DOCUMENT:JOB LISTING:title|company|date]

━━━ EMAIL ━━━
Short — max 5 lines. Professional.
[SEND_EMAIL:email:subject]

━━━ MULTI-STEP EXECUTION ━━━

Chain ALL actions in one response. Never ask "should I also...?"
End with a one-line summary of everything completed.`

    const conversationHistory = history.slice(-12).map((msg: { role: string; content: string }) => ({
      role: msg.role,
      content: msg.content,
    }))

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [...conversationHistory, { role: 'user', content: cleanMessage }],
      }),
    })

    const data = await response.json()

    if (!data.content?.[0]?.text) {
      return NextResponse.json({ error: 'AI response failed' }, { status: 500 })
    }

    let reply = data.content[0].text
    let emailSent = false
    let documentId = null
    let documentType = null
    let invoiceHTML = null
    let calendarEvent = null

    // Handle quote
    const quoteMatch = reply.match(/\[CREATE_QUOTE:([^\]]+)\]/)
    if (quoteMatch) {
      try {
        const raw = quoteMatch[1]
        const parts = raw.split(':')
        const clientName = parts[0]?.trim() || ''
        const clientEmail = parts[1]?.trim() || ''
        const validUntil = parts[2]?.trim() || ''
        const notes = parts[3]?.trim() || ''
        const remainder = parts.slice(4).join(':')
        const remainderParts = remainder.split(':')
        const grandtotal = parseFloat(remainderParts[remainderParts.length - 1]) || 0
        const discount = parseFloat(remainderParts[remainderParts.length - 2]) || 0
        const tax = parseFloat(remainderParts[remainderParts.length - 3]) || 0
        const subtotal = parseFloat(remainderParts[remainderParts.length - 4]) || 0
        const itemsStr = remainderParts.slice(0, remainderParts.length - 4).join(':')
        const items = itemsStr.split('&&').filter((i: string) => i.trim()).map((item: string) => {
          const p = item.split('|')
          return {
            description: p[0]?.trim() || '',
            quantity: parseFloat(p[1]) || 1,
            unit_price: parseFloat(p[2]) || 0,
            total: parseFloat(p[3]) || 0,
          }
        })
        const quoteNumber = `Q-${new Date().getFullYear()}-${Math.floor(Math.random() * 900) + 100}`
        await supabase.from('quotes').insert({
          business_agent_id: safeAgent.id,
          quote_number: quoteNumber,
          client_name: clientName,
          client_email: clientEmail || null,
          status: 'draft',
          items, subtotal, tax, discount,
          total: grandtotal,
          notes: notes || null,
          valid_until: validUntil || null,
          converted_to_invoice: false,
        })
        reply = reply.replace(/\[CREATE_QUOTE:[^\]]+\]/g, '').trim()
      } catch (e) {
        console.error('Quote error:', e)
        reply = reply.replace(/\[CREATE_QUOTE:[^\]]+\]/g, '').trim()
      }
    }

    // Handle order
    const orderMatch = reply.match(/\[CREATE_ORDER:([^\]]+)\]/)
    if (orderMatch) {
      try {
        const raw = orderMatch[1]
        const parts = raw.split(':')
        const clientName = parts[0]?.trim() || ''
        const clientEmail = parts[1]?.trim() || ''
        const clientPhone = parts[2]?.trim() || ''
        const status = parts[3]?.trim() || 'pending'
        const orderDueDate = parts[4]?.trim() || ''
        const notes = parts[5]?.trim() || ''
        const remainder = parts.slice(6).join(':')
        const remainderParts = remainder.split(':')
        const grandtotal = parseFloat(remainderParts[remainderParts.length - 1]) || 0
        const discount = parseFloat(remainderParts[remainderParts.length - 2]) || 0
        const delivery = parseFloat(remainderParts[remainderParts.length - 3]) || 0
        const tax = parseFloat(remainderParts[remainderParts.length - 4]) || 0
        const subtotal = parseFloat(remainderParts[remainderParts.length - 5]) || 0
        const itemsStr = remainderParts.slice(0, remainderParts.length - 5).join(':')
        const items = itemsStr.split('&&').filter((i: string) => i.trim()).map((item: string) => {
          const p = item.split('|')
          return {
            description: p[0]?.trim() || '',
            quantity: parseFloat(p[1]) || 1,
            unit_price: parseFloat(p[2]) || 0,
            total: parseFloat(p[3]) || 0,
          }
        })
        const orderNumber = `ORD-${new Date().getFullYear()}-${Math.floor(Math.random() * 900) + 100}`
        await supabase.from('orders').insert({
          business_agent_id: safeAgent.id,
          order_number: orderNumber,
          client_name: clientName,
          client_email: clientEmail || null,
          client_phone: clientPhone || null,
          status, items, subtotal, tax, delivery, discount,
          total: grandtotal,
          notes: notes || null,
          due_date: orderDueDate || null,
        })
        reply = reply.replace(/\[CREATE_ORDER:[^\]]+\]/g, '').trim()
      } catch (e) {
        console.error('Order error:', e)
        reply = reply.replace(/\[CREATE_ORDER:[^\]]+\]/g, '').trim()
      }
    }

    // Save memories
    const memoryMatches = [...reply.matchAll(/\[REMEMBER:([^:]+):([^:]+):([^\]]+)\]/g)]
    for (const match of memoryMatches) {
      await supabase.from('agent_memory').upsert({
        business_agent_id: safeAgent.id,
        category: match[1].trim(),
        key: match[2].trim(),
        value: match[3].trim(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'business_agent_id,key' })
    }
    reply = reply.replace(/\[REMEMBER:[^\]]+\]/g, '').trim()

    // Save contacts
    const contactMatches = [...reply.matchAll(/\[ADD_CONTACT:([^:]+):([^:]*):([^:]*):([^\]]*)\]/g)]
    for (const match of contactMatches) {
      await supabase.from('contacts').insert({
        business_agent_id: safeAgent.id,
        name: match[1].trim(),
        email: match[2].trim(),
        company: match[3].trim(),
        notes: match[4].trim(),
      })
    }
    reply = reply.replace(/\[ADD_CONTACT:[^\]]+\]/g, '').trim()

    // Save calendar events
    const eventMatches = [...reply.matchAll(/\[ADD_EVENT:([^:]*):([^:]*):([^:]*):([^:]*):([^:]*):([^:]*):([^\]]*)\]/g)]
    for (const match of eventMatches) {
      const eventData = {
        business_agent_id: safeAgent.id,
        title: match[1].trim(),
        event_date: match[2].trim(),
        event_time: match[3].trim() || null,
        event_type: match[4].trim() || 'meeting',
        location: match[5].trim() || null,
        description: match[6].trim() || null,
        attendees: match[7].trim() ? match[7].trim().split(',').map((a: string) => a.trim()) : [],
        status: 'upcoming',
      }
      const { data: evt } = await supabase.from('calendar_events').insert(eventData).select().single()
      if (evt) calendarEvent = evt
    }
    reply = reply.replace(/\[ADD_EVENT:[^\]]+\]/g, '').trim()

    // Handle invoice
    const invoiceMatch = reply.match(/\[SEND_INVOICE:([^\]]+)\]/)
    if (invoiceMatch) {
      const parts = invoiceMatch[1].split(':')
      const recipientEmail = parts[0]?.trim()
      const invoiceNumber = parts[1]?.trim()
      const clientName = parts[2]?.trim()
      const subtotal = parts[3]?.trim()
      const tax = parts[4]?.trim()
      const total = parts[5]?.trim()
      const itemsRaw = (parts[6] || '').split('&&')
      const lineItemsHTML = itemsRaw.map((item: string) => {
        const p = item.split('|')
        const desc = p[0]?.trim() || 'Service'
        const qty = p[1]?.trim() || '1'
        const rate = p[2]?.trim() || ''
        const amount = p[3]?.trim() || ''
        const isIncluded = rate === 'Included' || amount === '$0.00' || amount === '0.00'
        return `<tr>
          <td style="padding:14px 16px;font-size:14px;color:#374151;border-bottom:1px solid #f3f4f6;">${desc}</td>
          <td align="center" style="padding:14px 16px;font-size:14px;color:#6b7280;border-bottom:1px solid #f3f4f6;">${qty}</td>
          <td align="right" style="padding:14px 16px;font-size:14px;color:#6b7280;border-bottom:1px solid #f3f4f6;">${rate}</td>
          <td align="right" style="padding:14px 16px;font-size:14px;font-weight:${isIncluded ? '400' : '700'};color:${isIncluded ? '#9ca3af' : '#0a0a0a'};border-bottom:1px solid #f3f4f6;">${isIncluded ? '—' : amount}</td>
        </tr>`
      }).join('')

      reply = reply.replace(/\[SEND_INVOICE:[^\]]+\]/g, '').trim()

      invoiceHTML = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f4f6;padding:48px 24px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:16px;overflow:hidden;">
  <tr>
    <td style="background:#0a0a0a;padding:40px 48px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td valign="top">
            <div style="color:#9ca3af;font-size:10px;letter-spacing:2px;text-transform:uppercase;font-family:monospace;margin-bottom:8px;">FROM</div>
            <div style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">${safeAgent.business_name}</div>
          </td>
          <td align="right" valign="top">
            <div style="color:#9ca3af;font-size:10px;letter-spacing:2px;text-transform:uppercase;font-family:monospace;margin-bottom:8px;">INVOICE</div>
            <div style="color:#ffffff;font-size:30px;font-weight:800;letter-spacing:-1px;">${invoiceNumber}</div>
            <div style="margin-top:10px;">
              <span style="background:#c8f135;color:#0a0a0a;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;padding:5px 14px;border-radius:20px;font-family:monospace;">TAX INVOICE</span>
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="background:#111111;padding:18px 48px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td><div style="color:#6b7280;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;font-family:monospace;margin-bottom:5px;">ISSUE DATE</div><div style="color:#ffffff;font-size:13px;font-weight:500;">${formatDate(today)}</div></td>
          <td><div style="color:#6b7280;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;font-family:monospace;margin-bottom:5px;">DUE DATE</div><div style="color:#c8f135;font-size:13px;font-weight:600;">${formatDate(dueDate)}</div></td>
          <td><div style="color:#6b7280;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;font-family:monospace;margin-bottom:5px;">STATUS</div><div style="color:#fbbf24;font-size:13px;font-weight:600;">Unpaid</div></td>
          <td align="right"><div style="color:#6b7280;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;font-family:monospace;margin-bottom:5px;">TERMS</div><div style="color:#ffffff;font-size:13px;font-weight:500;">Net 30</div></td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:40px 48px;background:#ffffff;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
        <tr>
          <td style="background:#f9fafb;border-left:4px solid #0a0a0a;padding:18px 24px;border-radius:0 8px 8px 0;">
            <div style="color:#9ca3af;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;font-family:monospace;margin-bottom:8px;">BILLED TO</div>
            <div style="color:#0a0a0a;font-size:17px;font-weight:700;margin-bottom:4px;">${clientName}</div>
            ${recipientEmail ? `<div style="color:#6b7280;font-size:13px;">${recipientEmail}</div>` : ''}
          </td>
        </tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;border-radius:8px;overflow:hidden;">
        <tr style="background:#0a0a0a;">
          <td style="padding:12px 16px;color:#ffffff;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;font-family:monospace;">DESCRIPTION</td>
          <td align="center" style="padding:12px 16px;color:#ffffff;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;font-family:monospace;width:60px;">QTY</td>
          <td align="right" style="padding:12px 16px;color:#ffffff;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;font-family:monospace;width:100px;">RATE</td>
          <td align="right" style="padding:12px 16px;color:#ffffff;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;font-family:monospace;width:100px;">AMOUNT</td>
        </tr>
        ${lineItemsHTML}
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
        <tr>
          <td width="55%"></td>
          <td width="45%">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;border-radius:10px;padding:20px 24px;">
              <tr><td style="padding:5px 0;font-size:13px;color:#6b7280;">Subtotal</td><td align="right" style="padding:5px 0;font-size:13px;color:#374151;">$${subtotal}</td></tr>
              <tr><td style="padding:5px 0 12px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">GST / Tax (10%)</td><td align="right" style="padding:5px 0 12px;font-size:13px;color:#374151;border-bottom:1px solid #e5e7eb;">$${tax}</td></tr>
              <tr><td style="padding-top:12px;font-size:17px;font-weight:800;color:#0a0a0a;">Total Due</td><td align="right" style="padding-top:12px;font-size:17px;font-weight:800;color:#0a0a0a;">$${total}</td></tr>
            </table>
          </td>
        </tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="background:#0a0a0a;border-radius:10px;padding:20px 24px;">
            <div style="color:#6b7280;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;font-family:monospace;margin-bottom:8px;">PAYMENT INSTRUCTIONS</div>
            <div style="color:#ffffff;font-size:13px;line-height:1.6;">Please remit payment by ${formatDate(dueDate)}. Contact ${safeAgent.business_name} for payment enquiries.</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="background:#f9fafb;padding:24px 48px;border-top:2px solid #0a0a0a;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td><div style="font-size:14px;font-weight:700;color:#0a0a0a;margin-bottom:3px;">${safeAgent.business_name}</div><div style="font-size:11px;color:#9ca3af;font-family:monospace;">Generated by ${safeAgent.agent_name}</div></td>
          <td align="right"><div style="font-size:10px;color:#9ca3af;font-family:monospace;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">AMOUNT DUE</div><div style="font-size:26px;font-weight:800;color:#0a0a0a;">$${total}</div></td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`

      try {
        const { data: doc } = await supabase.from('documents').insert({
          agent_id: safeAgent.id,
          type: 'INVOICE',
          content: invoiceHTML,
          metadata: { invoiceNumber, clientName, subtotal, tax, total, recipientEmail, invoiceHTML },
        }).select().single()
        if (doc) { documentId = doc.id; documentType = 'INVOICE' }
      } catch { }

      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const { error } = await resend.emails.send({
          from: 'AgentBoard <onboarding@resend.dev>',
          to: recipientEmail,
          subject: `Invoice ${invoiceNumber} from ${safeAgent.business_name}`,
          html: invoiceHTML,
        })
        if (!error) { emailSent = true; reply += `\n\nInvoice ${invoiceNumber} sent to ${recipientEmail}.` }
      } catch { }
    }

    // Handle email
    const emailMatch = reply.match(/\[SEND_EMAIL:([^\]:]+):([^\]]+)\]/)
    if (emailMatch && !invoiceMatch) {
      const recipientEmail = emailMatch[1].trim()
      const emailSubject = emailMatch[2].trim()
      reply = reply.replace(/\[SEND_EMAIL:[^\]]+\]/g, '').trim()

      const emailHTML = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f4f6;padding:48px 24px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:16px;overflow:hidden;">
  <tr>
    <td style="background:#0a0a0a;padding:28px 40px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td><div style="color:#ffffff;font-size:17px;font-weight:700;">${safeAgent.business_name}</div></td>
          <td align="right"><span style="background:#c8f135;color:#0a0a0a;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:5px 12px;border-radius:20px;font-family:monospace;">Message</span></td>
        </tr>
      </table>
    </td>
  </tr>
  <tr><td style="padding:36px 40px;font-size:14px;line-height:1.8;color:#374151;">${reply.replace(/\n/g, '<br>')}</td></tr>
  <tr>
    <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="font-size:11px;color:#9ca3af;font-family:monospace;">Sent by ${safeAgent.agent_name}</td>
          <td align="right" style="font-size:11px;color:#9ca3af;font-family:monospace;">${safeAgent.business_name}</td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`

      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const { error } = await resend.emails.send({
          from: 'AgentBoard <onboarding@resend.dev>',
          to: recipientEmail,
          subject: emailSubject,
          html: emailHTML,
        })
        if (!error) { emailSent = true; reply += `\n\nEmail sent to ${recipientEmail}.` }
      } catch { }
    }

    // Handle documents
    const docMatch = reply.match(/\[CREATE_DOCUMENT:([^:]+):([^\]]+)\]/)
    if (docMatch && !invoiceMatch) {
      documentType = docMatch[1].trim()
      const params = docMatch[2].split('|')
      reply = reply.replace(/\[CREATE_DOCUMENT:[^\]]+\]/g, '').trim()

      const metadata: Record<string, unknown> = {
        title: params[0]?.trim(),
        party1: params[1]?.trim() || safeAgent.business_name,
        party2: params[2]?.trim(),
        date: params[3]?.trim() || formatDate(today),
      }

      const docHTML = buildDocumentHTML(documentType, reply, metadata)

      try {
        const { data: doc } = await supabase.from('documents').insert({
          agent_id: safeAgent.id,
          type: documentType,
          content: docHTML,
          metadata: { ...metadata, invoiceHTML: docHTML },
        }).select().single()

        if (doc) {
          documentId = doc.id
          invoiceHTML = docHTML
          reply += `\n\n${documentType} ready — click to view and print.`
        }
      } catch { }
    }

    return NextResponse.json({ reply, emailSent, documentId, documentType, invoiceHTML, calendarEvent })

  } catch (err) {
    console.error('Agent chat error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}