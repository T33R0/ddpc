import { getAdminUsers } from '@/actions/admin'
import { AdminUserTable } from '@/features/admin/AdminUserTable'
import { createClient } from '@/lib/supabase/server'

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const page = typeof params.page === 'string' ? parseInt(params.page) : 1
  const query = typeof params.q === 'string' ? params.q : ''
  const pageSize = 20

  const users = await getAdminUsers(page, pageSize, query)
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Check if there are more results
  const hasMore = users && users.length === pageSize

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-6 sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Users</h1>
      </div>
      
      <AdminUserTable 
        users={users || []} 
        currentEmail={user?.email} 
        page={page}
        hasMore={hasMore}
      />
    </div>
  )
}












