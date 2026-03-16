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

    const systemPrompt = `You are ${agent.agent_name}, a professional AI business agent for ${agent.business_name}.
Industry: ${agent.industry}
Tone: ${agent.tone}

You are concise, professional, and action-oriented. You complete tasks immediately.

TODAY: ${formatDate(today)}
DUE DATE (invoices): ${formatDate(dueDate)}

RULES:
- Be brief. Never repeat yourself.
- Never use ** for bold. Use plain text only.
- Keep all documents SHORT and professional
- Confirm task in ONE line at the end

INVOICE FORMAT:
When creating an invoice respond with ONLY this structure:

INVOICE #[NUMBER]
Bill To: [client name]

[Item description] | [qty] | $[rate] | $[amount]

Subtotal: $[amount]
Tax (10%): $[amount]
Total Due: $[amount]

Then add: [SEND_INVOICE:email:invoiceNumber:clientName:subtotal:tax:total:desc|qty|rate|amount]

EMAIL FORMAT:
Keep emails SHORT - max 5 lines.
Then add: [SEND_EMAIL:email:subject]

CONTRACT FORMAT:
Keep to ONE page max. Essential clauses only.
Then add: [CREATE_DOCUMENT:CONTRACT:title|party1|party2|date]

GENERAL:
- Professional = short and clear
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
        max_tokens: 1500,
        system: systemPrompt,
        messages: [...conversationHistory, { role: 'user', content: message }],
      }),
    })

    const data = await response.json()
    let reply = data.content[0].text
    let emailSent = false
    let documentId = null
    let documentType = null

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
      const itemParts = (parts[6] || '').split('|')
      const itemDesc = itemParts[0]?.trim() || 'Service'
      const itemQty = itemParts[1]?.trim() || '1'
      const itemRate = itemParts[2]?.trim() || subtotal
      const itemAmount = itemParts[3]?.trim() || subtotal

      reply = reply.replace(/\[SEND_INVOICE:[^\]]+\]/g, '').trim()

      const lineItemsHTML = `
        <tr>
          <td style="padding:14px 16px;font-size:14px;color:#374151;border-bottom:1px solid #f3f4f6;">${itemDesc}</td>
          <td align="center" style="padding:14px 16px;font-size:14px;color:#6b7280;border-bottom:1px solid #f3f4f6;">${itemQty}</td>
          <td align="right" style="padding:14px 16px;font-size:14px;color:#6b7280;border-bottom:1px solid #f3f4f6;">$${itemRate}</td>
          <td align="right" style="padding:14px 16px;font-size:14px;font-weight:700;color:#0a0a0a;border-bottom:1px solid #f3f4f6;">$${itemAmount}</td>
        </tr>`

      const invoiceHTML = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f4f6;padding:48px 24px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:16px;overflow:hidden;">

  <!-- HEADER -->
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

  <!-- DATE BAR -->
  <tr>
    <td style="background:#111111;padding:18px 48px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <div style="color:#6b7280;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;font-family:monospace;margin-bottom:5px;">ISSUE DATE</div>
            <div style="color:#ffffff;font-size:13px;font-weight:500;">${formatDate(today)}</div>
          </td>
          <td>
            <div style="color:#6b7280;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;font-family:monospace;margin-bottom:5px;">DUE DATE</div>
            <div style="color:#c8f135;font-size:13px;font-weight:600;">${formatDate(dueDate)}</div>
          </td>
          <td>
            <div style="color:#6b7280;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;font-family:monospace;margin-bottom:5px;">STATUS</div>
            <div style="color:#fbbf24;font-size:13px;font-weight:600;">Unpaid</div>
          </td>
          <td align="right">
            <div style="color:#6b7280;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;font-family:monospace;margin-bottom:5px;">TERMS</div>
            <div style="color:#ffffff;font-size:13px;font-weight:500;">Net 30</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- BODY -->
  <tr>
    <td style="padding:40px 48px;background:#ffffff;">

      <!-- BILL TO -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
        <tr>
          <td style="background:#f9fafb;border-left:4px solid #0a0a0a;padding:18px 24px;border-radius:0 8px 8px 0;">
            <div style="color:#9ca3af;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;font-family:monospace;margin-bottom:8px;">BILLED TO</div>
            <div style="color:#0a0a0a;font-size:17px;font-weight:700;margin-bottom:4px;">${clientName}</div>
            ${recipientEmail ? `<div style="color:#6b7280;font-size:13px;">${recipientEmail}</div>` : ''}
          </td>
        </tr>
      </table>

      <!-- LINE ITEMS -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;border-radius:8px;overflow:hidden;">
        <tr style="background:#0a0a0a;">
          <td style="padding:12px 16px;color:#ffffff;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;font-family:monospace;">DESCRIPTION</td>
          <td align="center" style="padding:12px 16px;color:#ffffff;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;font-family:monospace;width:60px;">QTY</td>
          <td align="right" style="padding:12px 16px;color:#ffffff;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;font-family:monospace;width:100px;">RATE</td>
          <td align="right" style="padding:12px 16px;color:#ffffff;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;font-family:monospace;width:100px;">AMOUNT</td>
        </tr>
        ${lineItemsHTML}
      </table>

      <!-- TOTALS -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
        <tr>
          <td width="60%"></td>
          <td width="40%">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;border-radius:10px;padding:20px 24px;">
              <tr>
                <td style="padding:5px 0;font-size:13px;color:#6b7280;">Subtotal</td>
                <td align="right" style="padding:5px 0;font-size:13px;color:#374151;">$${subtotal}</td>
              </tr>
              <tr>
                <td style="padding:5px 0;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;padding-bottom:12px;">GST / Tax (10%)</td>
                <td align="right" style="padding:5px 0;font-size:13px;color:#374151;border-bottom:1px solid #e5e7eb;padding-bottom:12px;">$${tax}</td>
              </tr>
              <tr>
                <td style="padding-top:12px;font-size:17px;font-weight:800;color:#0a0a0a;">Total Due</td>
                <td align="right" style="padding-top:12px;font-size:17px;font-weight:800;color:#0a0a0a;">$${total}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- PAYMENT INFO -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;">
        <tr>
          <td style="background:#0a0a0a;border-radius:10px;padding:20px 24px;">
            <div style="color:#6b7280;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;font-family:monospace;margin-bottom:8px;">PAYMENT INSTRUCTIONS</div>
            <div style="color:#ffffff;font-size:13px;line-height:1.6;">Please remit payment by ${formatDate(dueDate)}. Contact ${agent.business_name} for payment enquiries.</div>
          </td>
        </tr>
      </table>

    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td style="background:#f9fafb;padding:24px 48px;border-top:2px solid #0a0a0a;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <div style="font-size:14px;font-weight:700;color:#0a0a0a;margin-bottom:3px;">${agent.business_name}</div>
            <div style="font-size:11px;color:#9ca3af;font-family:monospace;">Generated by ${agent.agent_name}</div>
          </td>
          <td align="right">
            <div style="font-size:10px;color:#9ca3af;font-family:monospace;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">AMOUNT DUE</div>
            <div style="font-size:26px;font-weight:800;color:#0a0a0a;">$${total}</div>
          </td>
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
          subject: `Invoice ${invoiceNumber} from ${agent.business_name}`,
          html: invoiceHTML,
        })
        if (!error) {
          emailSent = true
          reply += `\n\nInvoice ${invoiceNumber} sent to ${recipientEmail}.`
        }
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
          <td>
            <div style="color:#ffffff;font-size:17px;font-weight:700;">${agent.business_name}</div>
          </td>
          <td align="right">
            <span style="background:#c8f135;color:#0a0a0a;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:5px 12px;border-radius:20px;font-family:monospace;">Message</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:36px 40px;font-size:14px;line-height:1.8;color:#374151;">
      ${reply.replace(/\n/g, '<br>')}
    </td>
  </tr>
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
        if (!error) {
          emailSent = true
          reply += `\n\nEmail sent to ${recipientEmail}.`
        }
      } catch { }
    }

    // Handle document creation
    const docMatch = reply.match(/\[CREATE_DOCUMENT:([^:]+):([^\]]+)\]/)
    if (docMatch) {
      documentType = docMatch[1]
      const params = docMatch[2].split('|')
      reply = reply.replace(/\[CREATE_DOCUMENT:[^\]]+\]/g, '').trim()

      const metadata: Record<string, unknown> = {
        title: params[0],
        party1: params[1],
        party2: params[2],
        date: params[3] || formatDate(today),
      }

      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const { data: doc } = await supabase
          .from('documents')
          .insert({ agent_id: agent.id, type: documentType, content: reply, metadata })
          .select()
          .single()

        if (doc) {
          documentId = doc.id
          reply += `\n\n📄 ${documentType} ready — click to open and print.`
        }
      } catch { }
    }

    return NextResponse.json({ reply, emailSent, documentId, documentType })

  } catch (err) {
    console.error('Agent chat error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}