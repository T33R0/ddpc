import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">About DDPC</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Daily Driven Project Car - The complete vehicle management platform for enthusiasts and professionals.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-card p-6 rounded-lg border border-border">
            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
            <p className="text-muted-foreground">
              To empower automotive enthusiasts with the tools they need to properly maintain,
              track, and showcase their vehicles. We believe every project deserves proper documentation
              and every enthusiast deserves peace of mind.
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg border border-border">
            <h2 className="text-2xl font-semibold mb-4">What We Do</h2>
            <p className="text-muted-foreground">
              DDPC provides comprehensive vehicle tracking, maintenance logging, parts management,
              and community features for automotive enthusiasts. From daily drivers to weekend warriors,
              we help you keep your vehicles in top condition.
            </p>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Coming Soon</h2>
          <p className="text-xl text-muted-foreground mb-8">
            We&apos;re working hard to bring you the full DDPC experience. Check back soon for updates!
          </p>
          <Link
            href="/"
            className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
