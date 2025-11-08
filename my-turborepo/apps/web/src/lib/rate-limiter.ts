import { ipRateLimit } from 'ip-rate-limit'
import { kv } from '@vercel/kv'

// Create a new rate limiter that allows 10 requests per 10 seconds
// (adjust as needed)
export const apiRateLimiter = ipRateLimit({
  // Use Vercel KV for storage
  store: kv,
  // 10 requests per 10 seconds per IP
  window: 10 * 1000,
  max: 10,
  // The key prefix in your KV store
  prefix: 'ddpc-rate-limit',
})