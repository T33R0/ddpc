'use client'

import { useState, useTransition } from 'react'
import { toggleUserSuspension, toggleAdminRole } from '@/actions/admin'
import { useRouter } from 'next/navigation'

interface User {
  user_id: string
  username: string
  join_date: string
  vehicle_count: number
  status_counts: Record<string, number>
  email: string
  provider: string
  role: string
  banned: boolean
}

export function AdminUserTable({
  users,
  currentEmail,
  page,
  hasMore
}: {
  users: User[]
  currentEmail?: string
  page: number
  hasMore: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirmSuspend, setConfirmSuspend] = useState<string | null>(null)

  const isBreakglass = currentEmail === 'myddpc@gmail.com'

  const handleSuspend = async (userId: string, shouldSuspend: boolean) => {
    startTransition(async () => {
      try {
        await toggleUserSuspension(userId, shouldSuspend)
        setConfirmSuspend(null)
        router.refresh()
      } catch (e) {
        console.error(e)
        alert('Failed to update suspension status')
      }
    })
  }

  const handleToggleAdmin = async (userId: string, makeAdmin: boolean) => {
    if (!confirm(`Are you sure you want to ${makeAdmin ? 'grant' : 'revoke'} admin access?`)) return

    startTransition(async () => {
      try {
        await toggleAdminRole(userId, makeAdmin)
        router.refresh()
      } catch (e) {
        console.error(e)
        alert('Failed to update admin role')
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Joined</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Vehicles</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Status Breakdown</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Account</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
            {users.map((user) => (
              <tr key={user.user_id} className={user.banned ? 'bg-red-50 dark:bg-red-900/20' : ''}>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{user.username}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{user.email}</span>
                    {user.role === 'admin' && (
                      <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        Admin
                      </span>
                    )}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {new Date(user.join_date).toLocaleDateString()}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white">
                  {user.vehicle_count}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {Object.entries(user.status_counts).map(([status, count]) => (
                    <div key={status} className="flex justify-between space-x-2">
                      <span className="capitalize">{status.replace('_', ' ')}:</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                  {Object.keys(user.status_counts).length === 0 && '-'}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex flex-col">
                    <span className="capitalize">{user.provider || 'Email'}</span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                  <div className="flex space-x-2">
                    {confirmSuspend === user.user_id ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-red-600 text-xs">Are you sure?</span>
                        <button
                          onClick={() => handleSuspend(user.user_id, !user.banned)}
                          disabled={isPending}
                          className="text-red-600 hover:text-red-900 font-bold"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmSuspend(null)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmSuspend(user.user_id)}
                        disabled={isPending}
                        className={`${user.banned ? 'text-green-600 hover:text-green-900' : 'text-red-600 hover:text-red-900'
                          }`}
                      >
                        {user.banned ? 'Unsuspend' : 'Suspend'}
                      </button>
                    )}

                    {isBreakglass && user.email !== 'myddpc@gmail.com' && (
                      <button
                        onClick={() => handleToggleAdmin(user.user_id, user.role !== 'admin')}
                        disabled={isPending}
                        className="text-blue-600 hover:text-blue-900 ml-4"
                      >
                        {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center pt-4">
        <button
          onClick={() => router.push(`/admin/users?page=${Math.max(1, page - 1)}`)}
          disabled={page === 1 || isPending}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm text-gray-700 dark:text-gray-300">Page {page}</span>
        <button
          onClick={() => router.push(`/admin/users?page=${page + 1}`)}
          disabled={!hasMore || isPending}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  )
}








