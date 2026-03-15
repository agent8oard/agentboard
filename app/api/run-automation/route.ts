import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { promptTemplate, input, systemPrompt } = await req.json()

    const finalPrompt = promptTemplate.replace('{{input}}', input)

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
        messages: [{ role: 'user', content: finalPrompt }],
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: data.error?.message }, { status: 500 })
    }

    const output = data.content[0].text
    return NextResponse.json({ output })

  } catch (err) {
    console.error('Run automation error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}