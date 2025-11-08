import { kv } from '@vercel/kv'

// Simple rate limiter interface
interface RateLimitResult {
  ok: boolean
  remaining?: number
  resetTime?: Date
}

// Simple in-memory fallback for rate limiting
class SimpleRateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>()

  constructor(
    private windowMs: number = 10 * 1000, // 10 seconds
    private max: number = 10 // 10 requests per window
  ) {}

  async check(req: Request, cost: number = 1): Promise<RateLimitResult> {
    try {
      // Get client IP
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                 req.headers.get('x-real-ip') ||
                 'unknown'

      const key = `rate-limit:${ip}`
      const now = Date.now()

      // Get current rate limit data from KV
      const data = await kv.get(key) as { count: number; resetTime: number } | null

      let count = 0
      let resetTime = now + this.windowMs

      if (data && data.resetTime > now) {
        count = data.count
        resetTime = data.resetTime
      }

      // Check if limit exceeded
      if (count + cost > this.max) {
        return {
          ok: false,
          remaining: Math.max(0, this.max - count),
          resetTime: new Date(resetTime)
        }
      }

      // Update count and store
      count += cost
      await kv.set(key, { count, resetTime }, { ex: Math.ceil(this.windowMs / 1000) })

      return {
        ok: true,
        remaining: Math.max(0, this.max - count),
        resetTime: new Date(resetTime)
      }
    } catch (error) {
      // Fail open on errors
      console.error('Rate limiter error:', error)
      return { ok: true }
    }
  }
}

// Create a new rate limiter that allows 10 requests per 10 seconds
export const apiRateLimiter = new SimpleRateLimiter(10 * 1000, 10)