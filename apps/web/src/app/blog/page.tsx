import Link from 'next/link';

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Blog</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Latest news, updates, and stories from the DDPC team and community.
          </p>
        </div>

        <div className="space-y-8 mb-12">
          <div className="bg-card text-card-foreground p-6 rounded-lg border border-border">
            <span className="text-sm text-muted-foreground mb-2 block">October 15, 2024</span>
            <h2 className="text-2xl font-semibold mb-4">Introducing DDPC 2.0</h2>
            <p className="text-muted-foreground mb-4">
              We&apos;re excited to announce the latest version of our platform, featuring improved performance,
              a new mobile-friendly design, and enhanced vehicle tracking capabilities.
            </p>
            <span className="text-primary cursor-pointer hover:underline">Read more &rarr;</span>
          </div>

          <div className="bg-card text-card-foreground p-6 rounded-lg border border-border">
            <span className="text-sm text-muted-foreground mb-2 block">September 28, 2024</span>
            <h2 className="text-2xl font-semibold mb-4">Community Spotlight: Project E30</h2>
            <p className="text-muted-foreground mb-4">
              This month we&apos;re highlighting an incredible BMW E30 restoration project managed entirely through DDPC.
              See how the owner kept track of over 500 individual parts.
            </p>
            <span className="text-primary cursor-pointer hover:underline">Read more &rarr;</span>
          </div>

          <div className="bg-card text-card-foreground p-6 rounded-lg border border-border">
            <span className="text-sm text-muted-foreground mb-2 block">September 10, 2024</span>
            <h2 className="text-2xl font-semibold mb-4">Maintenance Tips for Winter Storage</h2>
            <p className="text-muted-foreground mb-4">
              As the cold weather approaches, learn the essential steps to prepare your project car for winter hibernation.
            </p>
            <span className="text-primary cursor-pointer hover:underline">Read more &rarr;</span>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="inline-block bg-primary text-primary-foreground font-semibold py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
