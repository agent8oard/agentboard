const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(ip: string, maxRequests = 20, windowMs = 60000): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count >= maxRequests) {
    return false
  }

  record.count++
  return true
}