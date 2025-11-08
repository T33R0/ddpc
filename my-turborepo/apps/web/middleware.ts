import { NextResponse, type NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/middleware'

import { apiRateLimiter } from '@/lib/rate-limiter'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // --- 1. API RATE LIMITING (NEW) ---
  // Run rate limiter for all API routes
  if (pathname.startsWith('/api/')) {
    try {
      const res = await apiRateLimiter.check(request, 1) // '1' is the cost of the request
      if (!res.ok) {
        // IP is over the limit
        return new NextResponse(
          JSON.stringify({ error: 'Too many requests' }),
          {
            status: 429,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }
    } catch (e) {
      // Failed to check rate limit (e.g., KV store down)
      console.error('Rate limiter error:', e)
      // Fail open or closed? Failing open for now.
    }
  }

  // --- 2. SUPABASE AUTH (EXISTING) ---
  // This is your existing Supabase auth logic, unchanged.
  const { supabase, response } = createClient(request)

  // Refresh session if expired - required for Server Components
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  await supabase.auth.getSession()

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to extend or restrict
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
