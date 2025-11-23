import type { User } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

import { apiRateLimiter } from '@/lib/rate-limiter'
import { createClient } from '@/lib/supabase/middleware'
import {
  shouldSkipUsernameRouting,
  stripUsernamePrefixFromPathname,
  toUsernameSlug,
} from '@/lib/user-routing'

const DASHBOARD_PATH = '/dashboard'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

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

  const { supabase, applyPendingCookies } = createClient(request)
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const username = getUsernameFromSession(session?.user)

  if (username) {
    const scopedResponse = handleUserScopedRouting(request, username)
    if (scopedResponse) {
      return applyPendingCookies(scopedResponse)
    }
  } else if (!shouldSkipUsernameRouting(pathname)) {
    const { pathname: strippedPathname, stripped } = stripUsernamePrefixFromPathname(pathname)
    if (stripped) {
      const rewriteUrl = request.nextUrl.clone()
      rewriteUrl.pathname = strippedPathname
      return applyPendingCookies(NextResponse.rewrite(rewriteUrl))
    }
  }

  return applyPendingCookies(NextResponse.next())
}

const handleUserScopedRouting = (request: NextRequest, username: string) => {
  const { pathname } = request.nextUrl

  if (shouldSkipUsernameRouting(pathname)) {
    return null
  }

  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 0) {
    return NextResponse.redirect(buildUrl(request, `/${username}${DASHBOARD_PATH}`))
  }

  const firstSegmentMatchesUser = segments[0]?.toLowerCase() === username

  if (firstSegmentMatchesUser) {
    if (segments.length === 1) {
      return NextResponse.redirect(buildUrl(request, `/${username}${DASHBOARD_PATH}`))
    }

    const remainder = segments.slice(1).join('/')
    const rewritePath = remainder ? `/${remainder}` : '/'
    const rewriteUrl = buildUrl(request, rewritePath)
    return NextResponse.rewrite(rewriteUrl)
  }

  const { pathname: strippedPathname, stripped } = stripUsernamePrefixFromPathname(pathname)
  const effectivePath = stripped ? strippedPathname : pathname
  const targetPath =
    effectivePath === '/'
      ? `/${username}${DASHBOARD_PATH}`
      : `/${username}${effectivePath}`

  return NextResponse.redirect(buildUrl(request, targetPath))
}

const buildUrl = (request: NextRequest, pathname: string) => {
  const url = request.nextUrl.clone()
  url.pathname = pathname
  return url
}

const getUsernameFromSession = (user?: User | null) => {
  if (!user) {
    return null
  }

  const metadata = user.user_metadata ?? {}
  const candidate =
    metadata.username ??
    metadata.preferred_username ??
    metadata.user_name ??
    (user.email ? user.email.split('@')[0] : null)

  return toUsernameSlug(candidate)
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
