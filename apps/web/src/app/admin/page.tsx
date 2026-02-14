import Link from 'next/link'

const adminCards = [
  { href: '/admin/users', title: 'Manage Users', description: 'View user statistics, manage access, suspend users, and manage administrator roles.' },
  { href: '/admin/issues', title: 'Reported Problems', description: 'Review and resolve issues reported by users.' },
  { href: '/admin/structure', title: 'App Structure', description: 'Overview of application routes, pages, and their usage.' },
  { href: '/admin/testimonials', title: 'Testimonials', description: 'Review and approve user submitted testimonials.' },
  { href: '/admin/ogma', title: 'Ogma AI', description: 'Access the Trinity Synergistic Intelligence interface.' },
  { href: '/admin/email', title: 'Email Operations', description: 'Compose and send Weekly Build Logs and newsletters.' },
]

export default function AdminDashboard() {
  return (
    <div className="px-4 sm:px-0">
      <h1 className="text-2xl font-semibold text-foreground mb-6">Admin Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {adminCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="block max-w-sm p-6 bg-card border border-border rounded-lg shadow hover:bg-accent/50 transition-colors"
          >
            <h5 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
              {card.title}
            </h5>
            <p className="font-normal text-muted-foreground">
              {card.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
