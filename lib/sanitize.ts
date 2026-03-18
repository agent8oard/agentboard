export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function sanitize(input: string, maxLength = 4000): string {
  if (!input || typeof input !== 'string') return ''
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:\s*text\/html/gi, '')
    .replace(/(\b)(DROP|DELETE|INSERT|UPDATE|SELECT|UNION|ALTER|CREATE|EXEC|EXECUTE)(\s+)/gi, (match, p1, p2, p3) => `${p1}[${p2}]${p3}`)
    .replace(/\0/g, '')
}

export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase().slice(0, 254)
}

export function sanitizeNumber(value: unknown, fallback = 0): number {
  const n = parseFloat(String(value))
  return isNaN(n) || !isFinite(n) ? fallback : Math.abs(n)
}