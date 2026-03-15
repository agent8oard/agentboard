import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const form = await req.json()

    const prompt = `You are an AI agent builder. Based on this business information, create a custom AI agent.

Business: ${form.businessName}
Industry: ${form.industry}
Description: ${form.description}
Tasks: ${form.tasks.join(', ')}
Agent Name: ${form.agentName}
Tone: ${form.tone}
Extra info: ${form.extraInfo}

Respond with ONLY a JSON object, no markdown, no backticks, no extra text:
{
  "name": "agent name",
  "description": "2-3 sentence description",
  "category": "one of: Customer support, Data extraction, Copywriting, Research, Code generation, Email / outreach, Image processing, Other",
  "tags": ["tag1", "tag2", "tag3"],
  "systemPrompt": "a detailed system prompt for this agent"
}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()

    if (!data.content || !data.content[0]) {
      console.error('Anthropic error:', data)
      return NextResponse.json({ error: 'Failed to generate agent' }, { status: 500 })
    }

    const text = data.content[0].text
    const cleaned = text.replace(/```json|```/g, '').trim()
    const result = JSON.parse(cleaned)

    return NextResponse.json(result)

  } catch (err) {
    console.error('Generate agent error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}