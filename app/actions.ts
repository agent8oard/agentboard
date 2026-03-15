'use server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

export async function sendProposalNotification(taskId: string, message: string, bidAmount: number) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: task } = await adminSupabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single()

    if (!task) return { error: 'Task not found' }

    const { data: ownerData } = await adminSupabase.auth.admin.getUserById(task.user_id)
    const ownerEmail = ownerData?.user?.email

    if (!ownerEmail) return { error: 'Owner not found' }

    await resend.emails.send({
      from: 'AgentBoard <onboarding@resend.dev>',
      to: 'YOUR_RESEND_SIGNUP_EMAIL',
      subject: `New proposal on: ${task.title}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2>New proposal received</h2>
          <p>Someone applied to your task on AgentBoard.</p>
          <p><strong>Task:</strong> ${task.title}</p>
          <p><strong>Message:</strong> ${message}</p>
          <p><strong>Bid:</strong> $${bidAmount}</p>
          <a href="https://agentboard-five.vercel.app/dashboard">View on Dashboard</a>
        </div>
      `,
    })

    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Failed to send' }
  }
}