import type { User, SupabaseClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

import { apiRateLimiter } from '@/lib/rate-limiter'
import { createClient } from '@/lib/supabase/middleware'
import {
  isKnownAppSegment,
  shouldSkipUsernameRouting,
  stripUsernamePrefixFromPathname,
  toUsernameSlug,
} from '@/lib/user-routing'

const DASHBOARD_PATH = '/hub'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Handle username-prefixed routes first
  const { pathname: strippedPathname, stripped } = stripUsernamePrefixFromPathname(pathname)

  if (stripped) {
    // Rewrite internal request to the app route
    const rewriteUrl = request.nextUrl.clone()
    rewriteUrl.pathname = strippedPathname
    return NextResponse.rewrite(rewriteUrl)
  }

  // 2. Rate Limiter for API
  if (pathname.startsWith('/api/')) {
    try {
      const res = await apiRateLimiter.check(request, 1)
      if (!res.ok) {
        return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    } catch (error) {
      console.error('Rate limiter error:', error)
    }
  }

  // 3. Skip static assets from routing logic
  if (shouldSkipUsernameRouting(pathname)) {
    return NextResponse.next()
  }

  // 4. Auth Check & Redirects
  const { supabase, applyPendingCookies } = createClient(request)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const username = await getUsernameForRequest(supabase, user)

    if (username) {
      // Case A: User visiting root / -> redirect to /hub
      if (pathname === '/') {
        return applyPendingCookies(
          NextResponse.redirect(buildUrl(request, DASHBOARD_PATH))
        )
      }
    }
  }

  return applyPendingCookies(NextResponse.next())
}

const buildUrl = (request: NextRequest, pathname: string) => {
  const url = request.nextUrl.clone()
  url.pathname = pathname
  return url
}

const getUsernameForRequest = async (supabase: SupabaseClient, user: User | null) => {
  const fallback = deriveMetadataUsername(user)
  const userId = user?.id

  if (!userId) {
    return fallback ? toUsernameSlug(fallback) : null
  }

  // Attempt to get profile username
  const { data, error } = await supabase
    .from('user_profile')
    .select('username')
    .eq('user_id', userId)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    // console.error('Error fetching username from profile:', error)
  }

  if (data?.username) {
    return toUsernameSlug(data.username)
  }

  return fallback ? toUsernameSlug(fallback) : null
}

const deriveMetadataUsername = (user: User | null) => {
  if (!user) {
    return null
  }

  const metadata = user.user_metadata ?? {}
  return (
    metadata.username ??
    metadata.preferred_username ??
    metadata.user_name ??
    (user.email ? user.email.split('@')[0] : null)
  )
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     * Feel free to modify this pattern to extend or restrict
     */
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
}
