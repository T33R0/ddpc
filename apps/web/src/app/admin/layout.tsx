import { createClient } from '@/lib/supabase/server'
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

  const isBreakglass = user.email === 'myddpc@gmail.com'

  if (!isBreakglass) {
    // Check role
    const { data: profile } = await supabase
      .from('user_profile')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      redirect(EXTERNAL_REDIRECT)
    }
  }

  const navLinkClasses = "inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-muted-foreground hover:border-border hover:text-foreground"

  return (
    <div className="min-h-screen bg-muted/30">
      <nav className="fixed top-16 left-0 right-0 z-50 bg-card shadow border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <Link href="/admin" className="text-xl font-bold text-foreground">
                  Admin Console
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link href="/admin" className={navLinkClasses}>Dashboard</Link>
                <Link href="/admin/users" className={navLinkClasses}>Users</Link>
                <Link href="/admin/issues" className={navLinkClasses}>Issues</Link>
                <Link href="/admin/structure" className={navLinkClasses}>Structure</Link>
                <Link href="/admin/ogma" className={navLinkClasses}>Ogma</Link>
                <Link href="/admin/email" className={navLinkClasses}>Email Ops</Link>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-muted-foreground">
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
