'use client'

import { useState, useTransition } from 'react'
import { toggleUserSuspension, toggleAdminRole, grantProAccess } from '@/actions/admin'
import { useRouter, useSearchParams } from 'next/navigation'
import { Switch } from '@repo/ui/switch'
import { Label } from '@repo/ui/label'
import { ArrowUpDown, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/dropdown-menu'

interface User {
  user_id: string
  username: string
  join_date: string
  last_sign_in_at: string | null
  // vehicle_count: number // Hidden
  status_counts: Record<string, number>
  email: string
  provider: string
  role: string
  banned: boolean
  plan?: string
}

export function AdminUserTable({
  users,
  currentEmail,
  page,
  totalCount,
  pageSize,
  sortBy,
  sortDir
}: {
  users: User[]
  currentEmail?: string
  page: number
  totalCount: number
  pageSize: number
  sortBy: string
  sortDir: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirmSuspend, setConfirmSuspend] = useState<string | null>(null)

  const breakglassEmail = process.env.NEXT_PUBLIC_BREAKGLASS_EMAIL ?? 'myddpc@gmail.com'
  const isBreakglass = currentEmail === breakglassEmail

  const setSort = (column: string, direction: 'asc' | 'desc') => {
    const newParams = new URLSearchParams(window.location.search)
    newParams.set('sort', column)
    newParams.set('dir', direction)
    newParams.set('page', '1') // Reset to page 1 on sort change
    router.push(`/admin/users?${newParams.toString()}`)
  }

  const goToPage = (p: number) => {
    const newParams = new URLSearchParams(window.location.search)
    newParams.set('page', p.toString())
    router.push(`/admin/users?${newParams.toString()}`)
  }

  const SortHeader = ({ column, label, options }: { 
    column: string, 
    label: string,
    options?: { label: string, value: 'asc' | 'desc' }[]
  }) => {
    const isActive = sortBy === column

    return (
      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none focus:outline-none group flex items-center space-x-1 hover:text-foreground transition-colors cursor-pointer">
            <span>{label}</span>
            {isActive ? (
               sortDir === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-primary" /> : <ArrowDown className="h-3.5 w-3.5 text-primary" />
            ) : (
              <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground opacity-50 group-hover:opacity-100" />
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {options ? (
               options.map((opt) => (
                 <DropdownMenuItem 
                   key={opt.label}
                   onClick={() => setSort(column, opt.value)}
                   className={isActive && sortDir === opt.value ? 'bg-primary/10 text-primary' : ''}
                 >
                   {opt.label}
                 </DropdownMenuItem>
               ))
            ) : (
              <>
                <DropdownMenuItem onClick={() => setSort(column, 'asc')}>
                  Ascending
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSort(column, 'desc')}>
                  Descending
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </th>
    )
  }

  const totalPages = Math.ceil(totalCount / pageSize)
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)

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

  const [optimisticUsers, setOptimisticUsers] = useState<User[]>(users)

  // Sync with server state when it updates
  if (users !== optimisticUsers && !isPending) {
     setOptimisticUsers(users)
  }

  const handleGrantPro = async (userId: string, isPro: boolean) => {
    // Optimistic Update
    setOptimisticUsers(prev => prev.map(u =>
        u.user_id === userId ? { ...u, plan: isPro ? 'pro' : 'free' } : u
    ))

    startTransition(async () => {
      try {
        await grantProAccess(userId, isPro)
        router.refresh()
      } catch (e) {
        console.error(e)
        alert('Failed to update plan')
        // Revert on failure
        setOptimisticUsers(prev => prev.map(u =>
            u.user_id === userId ? { ...u, plan: !isPro ? 'pro' : 'free' } : u
        ))
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-border shadow">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted">
            <tr>
              <SortHeader 
                column="user" 
                label="User" 
                options={[
                  { label: 'A-Z', value: 'asc' },
                  { label: 'Z-A', value: 'desc' }
                ]}
              />
              <SortHeader 
                column="joined" 
                label="Joined" 
                options={[
                  { label: 'Newest First', value: 'desc' },
                  { label: 'Oldest First', value: 'asc' }
                ]}
              />
              <SortHeader 
                column="login" 
                label="Last Login" 
                options={[
                  { label: 'Newest First', value: 'desc' },
                  { label: 'Oldest First', value: 'asc' }
                ]}
              />
              <SortHeader 
                column="active" 
                label="Status Breakdown" 
                options={[
                  { label: 'Most Active', value: 'desc' },
                  { label: 'Least Active', value: 'asc' },
                  // { label: 'Most Total', value: 'desc' } // Could add 'total' sort_by option here if needed
                ]}
              />
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Account</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {optimisticUsers.map((user) => (
              <tr key={user.user_id} className={user.banned ? 'bg-destructive/10' : ''}>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{user.username}</span>
                    <span className="text-sm text-muted-foreground">{user.email}</span>
                    {user.role === 'admin' && (
                      <span className="inline-flex items-center rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                        Admin
                      </span>
                    )}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                  {new Date(user.join_date).toLocaleDateString()}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                  {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {Object.entries(user.status_counts).map(([status, count]) => (
                    <div key={status} className="flex justify-between space-x-2">
                      <span className="capitalize">{status.replace('_', ' ')}:</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                  {Object.keys(user.status_counts).length === 0 && '-'}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                  <div className="flex flex-col">
                    <span className="capitalize">{user.provider || 'Email'}</span>
                    <div className="mt-1">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        user.plan === 'pro'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {user.plan === 'pro' ? 'Pro' : 'Free'}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                  <div className="flex flex-col space-y-2">
                   <div className="flex space-x-2">
                    {confirmSuspend === user.user_id ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-destructive text-xs">Are you sure?</span>
                        <button
                          onClick={() => handleSuspend(user.user_id, !user.banned)}
                          disabled={isPending}
                          className="text-destructive hover:text-destructive/90 font-bold"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmSuspend(null)}
                          className="text-foreground/60 hover:text-foreground"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmSuspend(user.user_id)}
                        disabled={isPending}
                        className={`${user.banned ? 'text-success hover:text-success/90' : 'text-destructive hover:text-destructive/90'
                          }`}
                      >
                        {user.banned ? 'Unsuspend' : 'Suspend'}
                      </button>
                    )}

                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`pro-toggle-${user.user_id}`}
                        checked={user.plan === 'pro'}
                        onCheckedChange={(checked) => handleGrantPro(user.user_id, checked)}
                        disabled={isPending}
                      />
                      <Label htmlFor={`pro-toggle-${user.user_id}`} className="text-sm font-normal text-muted-foreground">
                        {user.plan === 'pro' ? 'Pro' : 'Free'}
                      </Label>
                    </div>
                   </div>

                   {isBreakglass && user.email !== breakglassEmail && (
                      <button
                        onClick={() => handleToggleAdmin(user.user_id, user.role !== 'admin')}
                        disabled={isPending}
                        className="text-info hover:text-info/90 text-left"
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
        <div className="flex items-center space-x-2">
          <button
            onClick={() => goToPage(Math.max(1, page - 1))}
            disabled={page === 1 || isPending}
            className="p-2 border border-border rounded-md shadow-sm text-sm font-medium text-foreground bg-card hover:bg-muted disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <div className="flex items-center space-x-1">
            {pageNumbers.map((p) => (
              <button
                key={p}
                onClick={() => goToPage(p)}
                disabled={isPending}
                className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
                  page === p
                    ? 'bg-accent text-accent-foreground'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={() => goToPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages || isPending}
            className="p-2 border border-border rounded-md shadow-sm text-sm font-medium text-foreground bg-card hover:bg-muted disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        
        <div className="text-sm text-muted-foreground">
          Showing {Math.min(totalCount, (page - 1) * pageSize + 1)} to {Math.min(totalCount, page * pageSize)} of {totalCount} users
        </div>
      </div>
    </div>
  )
}












