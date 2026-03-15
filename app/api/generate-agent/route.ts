import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const form = await req.json()

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 500 })
    }

    const prompt = `You are an expert AI business consultant. A business owner has filled out a form describing their business. Your job is to design a completely custom AI automation suite specifically for their business needs.

Business Name: ${form.businessName}
Industry: ${form.industry}
Description: ${form.description}
Tasks they mentioned: ${form.tasks.join(', ')}
Agent Name: ${form.agentName}
Tone: ${form.tone}
Extra requirements: ${form.extraInfo || 'None'}

Based on this SPECIFIC business, design a custom set of AI automations they actually need. Do not use a fixed template - think deeply about what THIS business specifically needs.

Respond with ONLY a valid JSON object, no markdown, no backticks:
{
  "name": "agent name",
  "description": "2-3 sentence description of what this agent does",
  "category": "Customer support",
  "tags": ["tag1", "tag2", "tag3"],
  "systemPrompt": "detailed system prompt for this specific business",
  "automations": [
    {
      "id": "unique_id",
      "title": "Automation title",
      "description": "What this automation does for this specific business",
      "icon": "single emoji",
      "inputLabel": "What the user needs to paste or type to use this",
      "inputPlaceholder": "example of what to paste here",
      "outputLabel": "What the AI will generate",
      "promptTemplate": "The Claude prompt to run this automation. Use {{input}} where the user input goes and include all business context: business name, tone, industry etc"
    }
  ],
  "setupSteps": ["step 1", "step 2", "step 3"],
  "tips": ["tip 1", "tip 2", "tip 3"]
}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: `Anthropic error: ${data.error?.message}` }, { status: 500 })
    }

    if (!data.content || !data.content[0]) {
      return NextResponse.json({ error: 'No content returned' }, { status: 500 })
    }

    const text = data.content[0].text
    const cleaned = text.replace(/```json|```/g, '').trim()

    let result
    try {
      result = JSON.parse(cleaned)
    } catch (parseErr) {
      console.error('Parse error:', text.slice(0, 500))
      return NextResponse.json({ error: 'Failed to parse response' }, { status: 500 })
    }

    return NextResponse.json(result)

  } catch (err) {
    console.error('Generate agent error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}