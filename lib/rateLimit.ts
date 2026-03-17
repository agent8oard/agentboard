const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function inMemoryRateLimit(ip: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }
  if (record.count >= maxRequests) return false
  record.count++
  return true
}

export async function rateLimit(ip: string, maxRequests = 20, windowSeconds = 60): Promise<boolean> {
  if (UPSTASH_URL && UPSTASH_TOKEN) {
    try {
      const key = `rate_limit:${ip}`
      const response = await fetch(`${UPSTASH_URL}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${UPSTASH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          ['INCR', key],
          ['EXPIRE', key, windowSeconds],
        ]),
      })
      const data = await response.json()
      const count = data[0].result
      return count <= maxRequests
    } catch {
      return inMemoryRateLimit(ip, maxRequests, windowSeconds * 1000)
    }
  }
  return inMemoryRateLimit(ip, maxRequests, windowSeconds * 1000)
}