import Link from 'next/link'

export default function AdminDashboard() {
  return (
    <div className="px-4 sm:px-0">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Admin Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/users"
          className="block max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
        >
          <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Manage Users
          </h5>
          <p className="font-normal text-gray-700 dark:text-gray-400">
            View user statistics, manage access, suspend users, and manage administrator roles.
          </p>
        </Link>

        <Link
          href="/admin/issues"
          className="block max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
        >
          <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Reported Problems
          </h5>
          <p className="font-normal text-gray-700 dark:text-gray-400">
            Review and resolve issues reported by users.
          </p>
        </Link>

        <Link
          href="/admin/structure"
          className="block max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
        >
          <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            App Structure
          </h5>
          <p className="font-normal text-gray-700 dark:text-gray-400">
            Overview of application routes, pages, and their usage.
          </p>
        </Link>

        <Link
          href="/admin/testimonials"
          className="block max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
        >
          <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Testimonials
          </h5>
          <p className="font-normal text-gray-700 dark:text-gray-400">
            Review and approve user submitted testimonials.
          </p>
        </Link>

        <Link
          href="/admin/ogma"
          className="block max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
        >
          <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Ogma AI
          </h5>
          <p className="font-normal text-gray-700 dark:text-gray-400">
            Access the Trinity Synergistic Intelligence interface.
          </p>
        </Link>
      </div>
    </div>
  )
}
