import { NextRequest } from 'next/server'

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

// Clean up expired entries every minute to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  for (const [key, val] of rateLimitMap.entries()) {
    if (now > val.resetTime) rateLimitMap.delete(key)
  }
}, 60_000)

export function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  )
}

function inMemoryRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(key)
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }
  if (record.count >= maxRequests) return false
  record.count++
  return true
}

export async function rateLimit(key: string, maxRequests = 20, windowSeconds = 60): Promise<boolean> {
  if (UPSTASH_URL && UPSTASH_TOKEN) {
    try {
      const redisKey = `rate_limit:${key}`
      const response = await fetch(`${UPSTASH_URL}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${UPSTASH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          ['INCR', redisKey],
          ['EXPIRE', redisKey, windowSeconds],
        ]),
      })
      const data = await response.json()
      const count = data[0].result
      return count <= maxRequests
    } catch {
      return inMemoryRateLimit(key, maxRequests, windowSeconds * 1000)
    }
  }
  return inMemoryRateLimit(key, maxRequests, windowSeconds * 1000)
}