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
  const sortBy = typeof params.sort === 'string' ? params.sort : 'joined'
  const sortDir = typeof params.dir === 'string' ? params.dir : 'desc'
  const pageSize = 20

  const { users, totalCount } = await getAdminUsers(page, pageSize, query, sortBy, sortDir)
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-6 sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Users</h1>
      </div>
      
      <AdminUserTable 
        users={users || []} 
        currentEmail={user?.email} 
        page={page}
        totalCount={totalCount}
        pageSize={pageSize}
        sortBy={sortBy}
        sortDir={sortDir}
      />
    </div>
  )
}












