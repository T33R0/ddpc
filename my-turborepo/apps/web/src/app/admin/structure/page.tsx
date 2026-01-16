
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Badge } from '@repo/ui/badge'
import { RefreshStructureButton } from '@/features/admin/components/StructureRefreshButton'

export default async function AdminStructurePage() {
  const supabase = await createClient()

  // Fetch from DB
  const { data: items, error } = await supabase
    .from('app_structure')
    .select('*')
    .order('type', { ascending: false }) // Pages first, then components
    .order('name', { ascending: true })

  if (error) {
    return <div className="p-4 text-red-500">Error loading structure: {error.message}</div>
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">App Structure</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            A comprehensive map of all application routes and their access levels.
          </p>
        </div>
        <RefreshStructureButton />
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 shadow dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Path / Import</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Last Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
            {(items || []).map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="whitespace-nowrap px-6 py-4">
                  <Link
                    href={`/admin/structure/${item.id}`}
                    className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {item.name}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <Badge variant={item.type === 'page' ? 'default' : 'secondary'}>
                    {item.type}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-mono text-xs truncate max-w-[300px]">
                  {item.path}
                </td>
                <td className="px-6 py-4 text-sm">
                  {item.status === 'archived' ? (
                    <Badge variant="destructive">Archived</Badge>
                  ) : (
                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Active</Badge>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {new Date(item.last_updated).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!items || items.length === 0) && (
          <div className="p-12 text-center text-muted-foreground">
            No structure data found. Run the scanner script to populate.
          </div>
        )}
      </div>
    </div>
  )
}


