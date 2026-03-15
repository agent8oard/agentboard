import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const form = await req.json()

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 500 })
    }

    const prompt = `You are an expert AI consultant helping businesses set up AI agents. Based on this business information, create a complete AI agent package.

Business Name: ${form.businessName}
Industry: ${form.industry}
Description: ${form.description}
Tasks needed: ${form.tasks.join(', ')}
Agent Name: ${form.agentName}
Tone: ${form.tone}
Extra requirements: ${form.extraInfo || 'None'}

Respond with ONLY a valid JSON object, no markdown, no backticks, no extra text:
{
  "name": "agent name",
  "description": "2-3 sentence description",
  "category": "Customer support",
  "tags": ["tag1", "tag2", "tag3"],
  "systemPrompt": "detailed system prompt",
  "setupSteps": ["step 1", "step 2", "step 3", "step 4", "step 5"],
  "useCases": [{"task": "task name", "howTo": "how to use", "examplePrompt": "example"}],
  "emailTemplates": [{"subject": "subject", "body": "email body", "useCase": "when to use"}],
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
    console.log('Anthropic response status:', response.status)
    console.log('Anthropic response:', JSON.stringify(data).slice(0, 200))

    if (!response.ok) {
      return NextResponse.json({ error: `Anthropic error: ${data.error?.message || 'Unknown'}` }, { status: 500 })
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
      console.error('Parse error, text was:', text.slice(0, 500))
      return NextResponse.json({ error: 'Failed to parse response' }, { status: 500 })
    }

    return NextResponse.json(result)

  } catch (err) {
    console.error('Generate agent error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}