import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { message, agent, history } = await req.json()

    const systemPrompt = `You are ${agent.agent_name}, an elite AI business agent for ${agent.business_name}, a ${agent.industry} business.

Business description: ${agent.description}
Tone: ${agent.tone}
${agent.system_prompt}

You are a fully autonomous business operator. You DO the work immediately.

CAPABILITIES:
1. SEND EMAILS: Write email, add [SEND_EMAIL:email:subject] at end
2. CREATE INVOICE: Generate complete invoice, add [CREATE_DOCUMENT:INVOICE:invoiceNumber|billTo|date|dueDate|subtotal|tax|total|item1desc|item1qty|item1rate|item1amount] at end
3. CREATE CONTRACT: Draft contract, add [CREATE_DOCUMENT:CONTRACT:title|party1|party2|date] at end
4. CREATE PROPOSAL: Write proposal, add [CREATE_DOCUMENT:PROPOSAL:title|clientName|date] at end
5. CREATE REPORT: Write report, add [CREATE_DOCUMENT:REPORT:title|date] at end

INVOICE RULES:
- Always calculate all numbers correctly
- Format: [CREATE_DOCUMENT:INVOICE:INV-2025-001|John Smith, 123 Main St|March 16 2025|April 15 2025|450.00|45.00|495.00|Web Design Service|3|150.00|450.00]
- Generate the full invoice text AND the marker

DOCUMENT RULES:
- Always generate the complete document content
- Put the [CREATE_DOCUMENT:...] marker at the very end
- The marker triggers automatic PDF generation
- Tell the owner "Your [document type] is ready — click the link to download/print"

Today: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`

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
        max_tokens: 3000,
        system: systemPrompt,
        messages: [...conversationHistory, { role: 'user', content: message }],
      }),
    })

    const data = await response.json()
    let reply = data.content[0].text
    let emailSent = false
    let documentId = null
    let documentType = null

    // Handle email sending
    const emailMatch = reply.match(/\[SEND_EMAIL:([^\]:]+):([^\]]+)\]/)
    if (emailMatch) {
      const recipientEmail = emailMatch[1].trim()
      const emailSubject = emailMatch[2].trim()
      reply = reply.replace(/\[SEND_EMAIL:[^\]]+\]/g, '').trim()

      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const { error } = await resend.emails.send({
          from: 'AgentBoard <onboarding@resend.dev>',
          to: recipientEmail,
          subject: emailSubject,
          html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#1a1a1a;">
            <p style="font-size:12px;color:#888;margin-bottom:20px;text-transform:uppercase;letter-spacing:1px;">${agent.business_name}</p>
            <div style="font-size:15px;line-height:1.8;white-space:pre-wrap;">${reply}</div>
            <hr style="border:none;border-top:1px solid #eee;margin:28px 0;" />
            <p style="font-size:12px;color:#aaa;">Sent by ${agent.agent_name}, AI agent for ${agent.business_name}</p>
          </div>`,
        })
        if (!error) {
          emailSent = true
          reply += `\n\n✓ Email sent to ${recipientEmail}`
        }
      } catch { }
    }

    // Handle document creation
    const docMatch = reply.match(/\[CREATE_DOCUMENT:([^:]+):([^\]]+)\]/)
    if (docMatch) {
      documentType = docMatch[1]
      const params = docMatch[2].split('|')
      reply = reply.replace(/\[CREATE_DOCUMENT:[^\]]+\]/g, '').trim()

      let metadata: Record<string, unknown> = {}

      if (documentType === 'INVOICE') {
        const [invoiceNumber, billTo, date, dueDate, subtotal, tax, total, ...items] = params
        const lineItems = []
        for (let i = 0; i < items.length; i += 4) {
          if (items[i]) lineItems.push({
            description: items[i],
            qty: items[i + 1],
            rate: items[i + 2],
            amount: items[i + 3],
          })
        }
        metadata = { invoiceNumber, billTo, date, dueDate, subtotal, tax, total, lineItems }
      } else {
        const [title, party1, party2, date] = params
        metadata = { title, party1, party2, date }
      }

      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const { data: doc } = await supabase
          .from('documents')
          .insert({
            agent_id: agent.id,
            type: documentType,
            content: reply,
            metadata,
          })
          .select()
          .single()

        if (doc) {
          documentId = doc.id
          reply += `\n\n📄 Your ${documentType} is ready!`
        }
      } catch { }
    }

    return NextResponse.json({ reply, emailSent, documentId, documentType })

  } catch (err) {
    console.error('Agent chat error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}