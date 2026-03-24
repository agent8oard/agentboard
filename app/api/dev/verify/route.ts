import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getIp } from '@/lib/rateLimit'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const ip = getIp(req)
  const allowed = await rateLimit(`dev-verify:${ip}`, 5, 60)
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const body = await req.json()
    const { password } = body

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    const expected = process.env.DEV_PASSWORD
    if (!expected) {
      console.error('DEV_PASSWORD env var is not set')
      return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
    }

    // Constant-time comparison to prevent timing attacks
    const passwordBuf = Buffer.from(password)
    const expectedBuf = Buffer.from(expected)
    const match =
      passwordBuf.length === expectedBuf.length &&
      crypto.timingSafeEqual(passwordBuf, expectedBuf)

    if (!match) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
    }

    // Generate a stable HMAC token derived from the password secret
    // Token changes if the password changes
    const token = crypto
      .createHmac('sha256', expected)
      .update('dev-access')
      .digest('hex')

    return NextResponse.json({ token })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
