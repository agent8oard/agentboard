import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { taskId, message, bidAmount } = await req.json()

    const { data: task } = await adminSupabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single()

    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

    const { data: ownerData } = await adminSupabase.auth.admin.getUserById(task.user_id)
    const ownerEmail = ownerData?.user?.email

    if (!ownerEmail) return NextResponse.json({ error: 'Owner email not found' }, { status: 404 })

    const { error: emailError } = await resend.emails.send({
      from: 'AgentBoard <onboarding@resend.dev>',
      to: ownerEmail,
      subject: `New proposal on your task: ${task.title}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #080808; color: #f0ede8; border-radius: 16px;">
          <h2 style="font-size: 24px; margin-bottom: 8px;">New proposal received</h2>
          <p style="color: #666; margin-bottom: 24px;">Someone applied to your task on AgentBoard.</p>
          <div style="background: #111; border: 1px solid #222; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <p style="font-size: 12px; color: #666; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 1px;">Task</p>
            <p style="font-size: 18px; font-weight: 600; margin-bottom: 0;">${task.title}</p>
          </div>
          <div style="background: #111; border: 1px solid #222; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <p style="font-size: 12px; color: #666; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">Their message</p>
            <p style="font-size: 15px; line-height: 1.6;">${message}</p>
          </div>
          <div style="background: #111; border: 1px solid #222; border-radius: 12px; padding: 20px; margin-bottom: 32px;">
            <p style="font-size: 12px; color: #666; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 1px;">Bid amount</p>
            <p style="font-size: 28px; font-weight: 700;">$${bidAmount}</p>
          </div>
          <a href="https://agentboard-five.vercel.app/dashboard" style="display: block; background: #c8f135; color: #0a0a0a; text-align: center; padding: 14px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
            View on Dashboard →
          </a>
        </div>
      `,
    })

    if (emailError) {
      console.error('Resend error:', emailError)
      return NextResponse.json({ error: emailError }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('Route error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}