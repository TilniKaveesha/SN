/**
 * Simple in-memory rate limiting for API endpoints
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

export function getRateLimitKey(identifier: string, endpoint: string): string {
  return `${identifier}:${endpoint}`
}

export function checkRateLimit(key: string, maxRequests = 100, windowMs: number = 60 * 1000): boolean {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    })
    return true
  }

  if (entry.count < maxRequests) {
    entry.count++
    return true
  }

  return false
}

export function getRateLimitInfo(key: string): { remaining: number; resetTime: number } | null {
  const entry = rateLimitStore.get(key)
  if (!entry) return null

  return {
    remaining: Math.max(0, 100 - entry.count),
    resetTime: entry.resetTime,
  }
}
