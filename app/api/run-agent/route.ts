import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { taskId } = await req.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: task } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single()

    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

    await supabase
      .from('task_results')
      .upsert({ task_id: taskId, status: 'running', result: '' })

    const systemPrompt = `You are an elite AI agent that executes tasks for users on AgentBoard marketplace. 
You complete tasks immediately, thoroughly, and professionally.
Always deliver the full result — never partial output.
Format your output clearly with headers, bullet points, or tables where appropriate.
Today: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`

    const userPrompt = `Execute this task completely and deliver the full result:

Task: ${task.title}
Description: ${task.description}
Category: ${task.category}

Deliver the complete output now. Do not explain what you will do — just do it and show the results.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      await supabase
        .from('task_results')
        .upsert({ task_id: taskId, status: 'failed', result: data.error?.message || 'Failed' })
      return NextResponse.json({ error: data.error?.message }, { status: 500 })
    }

    const result = data.content[0].text

    await supabase
      .from('task_results')
      .upsert({ task_id: taskId, status: 'completed', result })

    await supabase
      .from('tasks')
      .update({ status: 'completed' })
      .eq('id', taskId)

    return NextResponse.json({ success: true, result })

  } catch (err) {
    console.error('Run agent error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}