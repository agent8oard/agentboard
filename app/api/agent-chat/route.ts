import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { message, agent, history } = await req.json()

    const today = new Date()
    const dueDate = new Date(today)
    dueDate.setDate(dueDate.getDate() + 30)
    const formatDate = (d: Date) => d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const [{ data: memories }, { data: knowledge }, { data: contacts }, { data: upcomingEvents }] = await Promise.all([
      supabase.from('agent_memory').select('*').eq('business_agent_id', agent.id).order('updated_at', { ascending: false }),
      supabase.from('knowledge_base').select('*').eq('business_agent_id', agent.id),
      supabase.from('contacts').select('*').eq('business_agent_id', agent.id),
      supabase.from('calendar_events').select('*').eq('business_agent_id', agent.id).gte('event_date', today.toISOString().split('T')[0]).order('event_date', { ascending: true }).limit(10),
    ])

    const memoryContext = memories?.length ? `
WHAT I REMEMBER ABOUT THIS BUSINESS:
${memories.map((m: Record<string, unknown>) => `- ${m.key}: ${m.value}`).join('\n')}` : ''

    const knowledgeContext = knowledge?.length ? `
BUSINESS KNOWLEDGE BASE:
${knowledge.map((k: Record<string, unknown>) => `[${k.type}] ${k.title}: ${k.content}`).join('\n')}` : ''

    const contactsContext = contacts?.length ? `
KNOWN CUSTOMERS & CONTACTS:
${contacts.map((c: Record<string, unknown>) => `- ${c.name}${c.email ? ` (${c.email})` : ''}${c.company ? ` at ${c.company}` : ''}${c.notes ? ` — ${c.notes}` : ''}`).join('\n')}` : ''

    const calendarContext = upcomingEvents?.length ? `
UPCOMING CALENDAR EVENTS:
${upcomingEvents.map((e: Record<string, unknown>) => `- ${e.event_date} ${e.event_time || ''}: ${e.title}${e.location ? ` at ${e.location}` : ''}${e.description ? ` — ${e.description}` : ''}`).join('\n')}` : ''

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
            <div style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">${agent.business_name}</div>
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
          <td align="right"><div style="color:#6b7280;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;font-family:monospace;margin-bottom:5px;">PREPARED BY</div><div style="color:#ffffff;font-size:13px;font-weight:500;">${agent.agent_name}</div></td>
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
              <div style="font-size:12px;color:#6b7280;font-family:monospace;">SIGNATURE — ${agent.business_name}</div>
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
          <td><div style="font-size:14px;font-weight:700;color:#0a0a0a;margin-bottom:3px;">${agent.business_name}</div><div style="font-size:11px;color:#9ca3af;font-family:monospace;">Generated by ${agent.agent_name} · ${formatDate(today)}</div></td>
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

    const in14Days = new Date(today)
    in14Days.setDate(in14Days.getDate() + 14)

    const systemPrompt = `You are ${agent.agent_name}, a professional AI business agent for ${agent.business_name}.
Industry: ${agent.industry}
Tone: ${agent.tone}
${agent.system_prompt || ''}

TODAY: ${formatDate(today)}
DUE DATE (invoices): ${formatDate(dueDate)}

${memoryContext}
${knowledgeContext}
${contactsContext}
${calendarContext}

MEMORY INSTRUCTIONS:
When you learn important information, save it:
[REMEMBER:category:key:value]
Categories: customer, pricing, product, preference, general

CONTACT INSTRUCTIONS:
When you encounter a new customer:
[ADD_CONTACT:name:email:company:notes]

CALENDAR INSTRUCTIONS:
When user mentions a meeting, appointment, deadline or scheduled activity:
[ADD_EVENT:title:date:time:type:location:description:attendees]
- date format: YYYY-MM-DD
- time format: HH:MM (24hr)
- type: meeting, appointment, call, deadline, event, reminder

━━━ INVOICE RULES ━━━

CRITICAL: Every single service, phase, or scope item mentioned by the user MUST appear as its own separate line item on the invoice. Never combine multiple items into one line.

PRICING RULES:
- If user gives individual prices per item → use those exact prices per line
- If user gives one total price for multiple items → show each item as its own line with "Included" in rate column and $0.00 in amount EXCEPT the last item which gets the full total
- If user says "lump sum" or "one total" → still list every item separately, put full amount on first line, rest show "— Included" with $0.00
- If user says "split evenly" → divide total by number of items

INVOICE TEXT FORMAT (show this in your response):
INVOICE #INV-[YEAR]-[NUMBER]
Bill To: [client name]

[Item 1] | 1 | $[rate or "Included"] | $[amount or 0.00]
[Item 2] | 1 | Included | $0.00
...

Subtotal: $[total before tax]
Tax (10%): $[tax]
Total Due: $[grand total]

INVOICE MARKER FORMAT — items separated by &&:
[SEND_INVOICE:email:INV-[YEAR]-[NUM]:clientName:subtotal:tax:total:Item1|1|$rate|$amount&&Item2|1|Included|$0.00&&...]

━━━ ORDER RECORD RULES ━━━

When user wants to create an order record, track an order, or record a sale:

ORDER TEXT FORMAT (show in response):
ORDER #ORD-[YEAR]-[NUMBER]
Client: [name]
Status: pending

[Item description] | Qty: [qty] | Unit price: $[price] | Line total: $[amount]
Delivery: $[amount] (if applicable)

Subtotal: $[subtotal]
Tax (10%): $[tax]
Total: $[total]
Due: [due date]

ORDER MARKER:
[CREATE_ORDER:clientName:clientEmail:clientPhone:status:dueDate:notes:item1desc|qty|unitprice|linetotal&&item2desc|qty|unitprice|linetotal:subtotal:tax:delivery:discount:grandtotal]

EXAMPLE — "Order for David Chen, 5 oak shelves at $85 each, $40 delivery, due in 14 days":
[CREATE_ORDER:David Chen:::pending:${in14Days.toISOString().split('T')[0]}::5x Custom Oak Shelves|5|85|425&&Delivery Charge|1|40|40:425:0:40:0:465]

After creating order ask: "Would you like me to also generate an invoice for this order?"

CONTRACT FORMAT:
# Parties
# Services
# Terms
# Payment
# Termination
# Signatures
[CREATE_DOCUMENT:CONTRACT:title|party1|party2]

PROPOSAL FORMAT:
# Executive Summary
# Scope of Work
# Timeline
# Investment
# Next Steps
[CREATE_DOCUMENT:PROPOSAL:title|clientName|date]

REPORT FORMAT:
# Overview
# Key Metrics
# Highlights
# Challenges
# Recommendations
[CREATE_DOCUMENT:REPORT:title|period|date]

MEETING AGENDA FORMAT:
# Meeting Details
# Attendees
# Agenda Items
# Action Items
[CREATE_DOCUMENT:MEETING AGENDA:title|organizer|date]

JOB LISTING FORMAT:
# About the Role
# Responsibilities
# Requirements
# What We Offer
# How to Apply
[CREATE_DOCUMENT:JOB LISTING:title|company|date]

EMAIL FORMAT:
Keep emails SHORT — max 5 lines.
[SEND_EMAIL:email:subject]

GENERAL RULES:
- Be brief and professional
- No markdown bold (**)
- Use # for headings, - for bullets
- Always confirm in one line what you did`

    const conversationHistory = history.slice(-10).map((msg: { role: string; content: string }) => ({
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
        messages: [...conversationHistory, { role: 'user', content: message }],
      }),
    })

    const data = await response.json()
    let reply = data.content[0].text
    let emailSent = false
    let documentId = null
    let documentType = null
    let invoiceHTML = null
    let calendarEvent = null

    // Handle order
    const orderMatch = reply.match(/\[CREATE_ORDER:([^\]]+)\]/)
    if (orderMatch) {
      const parts = orderMatch[1].split(':')
      const clientName = parts[0]?.trim()
      const clientEmail = parts[1]?.trim()
      const clientPhone = parts[2]?.trim()
      const status = parts[3]?.trim() || 'pending'
      const orderDueDate = parts[4]?.trim()
      const notes = parts[5]?.trim()
      const itemsRaw = parts[6]?.split('&&') || []
      const subtotal = parseFloat(parts[7]) || 0
      const tax = parseFloat(parts[8]) || 0
      const delivery = parseFloat(parts[9]) || 0
      const discount = parseFloat(parts[10]) || 0
      const total = parseFloat(parts[11]) || 0

      const items = itemsRaw.map((item: string) => {
        const p = item.split('|')
        return {
          description: p[0]?.trim(),
          quantity: parseFloat(p[1]) || 1,
          unit_price: parseFloat(p[2]) || 0,
          total: parseFloat(p[3]) || 0,
        }
      })

      const year = new Date().getFullYear()
      const orderNumber = `ORD-${year}-${Math.floor(Math.random() * 900) + 100}`

      const { data: order } = await supabase.from('orders').insert({
        business_agent_id: agent.id,
        order_number: orderNumber,
        client_name: clientName,
        client_email: clientEmail || null,
        client_phone: clientPhone || null,
        status,
        items,
        subtotal,
        tax,
        delivery,
        discount,
        total,
        notes: notes || null,
        due_date: orderDueDate || null,
      }).select().single()

      if (order) {
        reply = reply.replace(/\[CREATE_ORDER:[^\]]+\]/g, '').trim()
      }
    }

    // Save memories
    const memoryMatches = [...reply.matchAll(/\[REMEMBER:([^:]+):([^:]+):([^\]]+)\]/g)]
    for (const match of memoryMatches) {
      await supabase.from('agent_memory').upsert({
        business_agent_id: agent.id,
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
        business_agent_id: agent.id,
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
        business_agent_id: agent.id,
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
            <div style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">${agent.business_name}</div>
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
            <div style="color:#ffffff;font-size:13px;line-height:1.6;">Please remit payment by ${formatDate(dueDate)}. Contact ${agent.business_name} for payment enquiries.</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="background:#f9fafb;padding:24px 48px;border-top:2px solid #0a0a0a;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td><div style="font-size:14px;font-weight:700;color:#0a0a0a;margin-bottom:3px;">${agent.business_name}</div><div style="font-size:11px;color:#9ca3af;font-family:monospace;">Generated by ${agent.agent_name}</div></td>
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
          agent_id: agent.id,
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
          subject: `Invoice ${invoiceNumber} from ${agent.business_name}`,
          html: invoiceHTML,
        })
        if (!error) { emailSent = true; reply += `\n\nInvoice ${invoiceNumber} sent to ${recipientEmail}.` }
      } catch { }
    }

    // Handle regular email
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
          <td><div style="color:#ffffff;font-size:17px;font-weight:700;">${agent.business_name}</div></td>
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
          <td style="font-size:11px;color:#9ca3af;font-family:monospace;">Sent by ${agent.agent_name}</td>
          <td align="right" style="font-size:11px;color:#9ca3af;font-family:monospace;">${agent.business_name}</td>
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

    // Handle all other documents
    const docMatch = reply.match(/\[CREATE_DOCUMENT:([^:]+):([^\]]+)\]/)
    if (docMatch && !invoiceMatch) {
      documentType = docMatch[1].trim()
      const params = docMatch[2].split('|')
      reply = reply.replace(/\[CREATE_DOCUMENT:[^\]]+\]/g, '').trim()

      const metadata: Record<string, unknown> = {
        title: params[0]?.trim(),
        party1: params[1]?.trim() || agent.business_name,
        party2: params[2]?.trim(),
        date: params[3]?.trim() || formatDate(today),
      }

      const docHTML = buildDocumentHTML(documentType, reply, metadata)

      try {
        const { data: doc } = await supabase.from('documents').insert({
          agent_id: agent.id,
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
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}