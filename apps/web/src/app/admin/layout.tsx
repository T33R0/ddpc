import { createClient } from '@/lib/supabase/server'
import { isBreakglassEmail } from '@/lib/require-admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const EXTERNAL_REDIRECT = 'https://myddpc.com'

  if (!user) {
    redirect(EXTERNAL_REDIRECT)
  }

  const isBreakglass = isBreakglassEmail(user.email)

  if (!isBreakglass) {
    const { data: profile } = await supabase
      .from('user_profile')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      redirect(EXTERNAL_REDIRECT)
    }
  }

  const navLinkClasses = "inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-muted-foreground hover:border-border hover:text-foreground whitespace-nowrap"

  return (
    <div className="min-h-screen bg-muted/30">
      <nav className="fixed top-16 left-0 right-0 z-50 bg-card shadow border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-auto min-h-[4rem] flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-2 sm:py-0">
            <div className="flex items-center justify-between">
              <Link href="/admin" className="text-lg sm:text-xl font-bold text-foreground">
                Admin Console
              </Link>
              <span className="text-xs text-muted-foreground sm:hidden truncate ml-3 max-w-[140px]">
                {user.email?.split('@')[0]} {isBreakglass && '(SA)'}
              </span>
            </div>
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 sm:gap-4 pb-1 sm:pb-0">
              <Link href="/admin" className={navLinkClasses}>Dashboard</Link>
              <Link href="/admin/growth" className={navLinkClasses}>Growth</Link>
              <Link href="/admin/users" className={navLinkClasses}>Users</Link>
              <Link href="/admin/issues" className={navLinkClasses}>Issues</Link>
              <Link href="/admin/structure" className={navLinkClasses}>Structure</Link>
              <Link href="/admin/steward" className={navLinkClasses}>Steward</Link>
              <Link href="/admin/email" className={navLinkClasses}>Email</Link>
            </div>
            <div className="hidden sm:flex items-center">
              <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                {user.email} {isBreakglass && '(Super Admin)'}
              </span>
            </div>
          </div>
        </div>
      </nav>
      <div className="pt-36 pb-10">
        <main>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
