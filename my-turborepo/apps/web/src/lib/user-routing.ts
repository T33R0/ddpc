const USERNAME_SCOPED_SEGMENTS = new Set([
  'about',
  'account',
  'admin',
  'community',
  'console',
  'contact',
  'dashboard',
  'details',
  'docs',
  'explore',
  'financials',
  'garage',
  'issues',
  'more',
  'policy',
  'pricing',
  'privacy',
  'scrutineer',
  'terms',
  'vehicle',
])

const STATIC_PATH_PREFIXES = [
  '/_next',
  '/api',
  '/favicon',
  '/robots',
  '/sitemap',
  '/site.webmanifest',
  '/branding',
  '/media',
  '/images',
  '/fonts',
  '/public',
  '/assets',
  '/android-chrome',
  '/apple-touch-icon',
]

const USERNAME_SANITIZE_REGEX = /[^a-z0-9-_]/gi

const normalizeSegment = (segment?: string) =>
  (segment ?? '').trim().toLowerCase()

export const isKnownAppSegment = (segment?: string) =>
  USERNAME_SCOPED_SEGMENTS.has(normalizeSegment(segment))

export const shouldSkipUsernameRouting = (pathname: string) => {
  if (!pathname || pathname === '/') {
    return false
  }

  const lowerPath = pathname.toLowerCase()
  if (STATIC_PATH_PREFIXES.some((prefix) => lowerPath.startsWith(prefix))) {
    return true
  }

  return false
}

export const stripUsernamePrefixFromPathname = (pathname: string) => {
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length < 2) {
    return {
      pathname,
      stripped: false,
    }
  }

  // Prevent stripping if the first segment is a reserved root route (like 'admin')
  if (segments[0] === 'admin') {
    return {
      pathname,
      stripped: false,
    }
  }

  if (!isKnownAppSegment(segments[1])) {
    return {
      pathname,
      stripped: false,
    }
  }

  const remainder = segments.slice(1).join('/')

  return {
    pathname: remainder ? `/${remainder}` : '/',
    stripped: true,
  }
}

export const toUsernameSlug = (value?: string | null) => {
  if (!value || typeof value !== 'string') {
    return null
  }

  const normalized = value
    .trim()
    .toLowerCase()
    .replace(USERNAME_SANITIZE_REGEX, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return normalized || null
}

