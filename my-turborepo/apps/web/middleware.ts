import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

import { apiRateLimiter } from '@/lib/rate-limiter'
import { createClient } from '@/lib/supabase/middleware'
import {
  isKnownAppSegment,
  shouldSkipUsernameRouting,
  stripUsernamePrefixFromPathname,
  toUsernameSlug,
} from '@/lib/user-routing'

const DASHBOARD_PATH = '/dashboard'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Rate Limiter for API
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

  // 2. Skip static assets and API routes from routing logic
  if (shouldSkipUsernameRouting(pathname)) {
    return NextResponse.next()
  }

  const { supabase, applyPendingCookies } = createClient(request)
  
  // 3. Check for scoped path (e.g. /teehanrh/dashboard)
  const { pathname: strippedPathname, stripped } = stripUsernamePrefixFromPathname(pathname)

  if (stripped) {
    // Rewrite internal request to the app route
    const rewriteUrl = request.nextUrl.clone()
    rewriteUrl.pathname = strippedPathname
    return applyPendingCookies(NextResponse.rewrite(rewriteUrl))
  }

  // 4. Auth Check & Redirects
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    const username = await getUsernameForRequest(supabase, session)
    
    if (username) {
      const segments = pathname.split('/').filter(Boolean)
      
      // Case A: User visiting root / -> redirect to /username/dashboard
      if (pathname === '/') {
        return applyPendingCookies(
          NextResponse.redirect(buildUrl(request, `/${username}${DASHBOARD_PATH}`))
        )
      }

      // Case B: User visiting /dashboard (or other known segment) -> redirect to /username/dashboard
      if (segments.length > 0 && segments[0] && isKnownAppSegment(segments[0])) {
         return applyPendingCookies(
           NextResponse.redirect(buildUrl(request, `/${username}${pathname}`))
         )
      }

      // Case C: User visiting /teehanrh (root username path) -> redirect to /teehanrh/dashboard
      // This handles the "stripped: false" case where segments.length === 1
      if (segments.length === 1 && segments[0] && segments[0].toLowerCase() === username) {
         return applyPendingCookies(
           NextResponse.redirect(buildUrl(request, `/${username}${DASHBOARD_PATH}`))
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

const getUsernameForRequest = async (supabase: SupabaseClient, session: Session | null) => {
  const fallback = deriveMetadataUsername(session)
  const userId = session?.user?.id

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

const deriveMetadataUsername = (session: Session | null) => {
  const user = session?.user
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
     * Feel free to modify this pattern to extend or restrict
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
