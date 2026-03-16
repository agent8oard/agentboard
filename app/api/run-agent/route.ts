import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { task } = await req.json()

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: task
          }
        ]
      })
    })

    const data = await response.json()

    return NextResponse.json({
      result: data.content?.[0]?.text || "No result returned"
    })

  } catch (error) {
    return NextResponse.json({ error: "Agent failed" }, { status: 500 })
  }
}