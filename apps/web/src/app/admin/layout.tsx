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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="fixed top-16 left-0 right-0 z-50 bg-white shadow dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <Link href="/admin" className="text-xl font-bold text-gray-900 dark:text-white">
                  Admin Console
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/admin"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/users"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                >
                  Users
                </Link>
                <Link
                  href="/admin/issues"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                >
                  Issues
                </Link>
                <Link
                  href="/admin/structure"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                >
                  Structure
                </Link>
                <Link
                  href="/admin/ogma"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                >
                  Ogma
                </Link>
                <Link
                  href="/admin/email"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                >
                  Email Ops
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">
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
