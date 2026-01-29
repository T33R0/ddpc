import Link from 'next/link';

export default function DocsPage() {
  // Redirect to the docs app
  // Note: In production, this would redirect to the actual docs app URL
  // For now, we'll show a placeholder page
  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">DDPC Documentation</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Comprehensive documentation for the DDPC platform, including API references, guides, and schema documentation.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-card p-6 rounded-lg border border-border">
            <h3 className="text-xl font-semibold mb-4">🚀 Getting Started</h3>
            <p className="text-muted-foreground mb-4">
              Learn how to set up your account and get started with DDPC.
            </p>
            <span className="text-primary">Coming Soon</span>
          </div>

          <div className="bg-card p-6 rounded-lg border border-border">
            <h3 className="text-xl font-semibold mb-4">📊 Database Schema</h3>
            <p className="text-muted-foreground mb-4">
              Complete reference for our database structure and relationships.
            </p>
            <span className="text-primary">Coming Soon</span>
          </div>

          <div className="bg-card p-6 rounded-lg border border-border">
            <h3 className="text-xl font-semibold mb-4">🔌 API Reference</h3>
            <p className="text-muted-foreground mb-4">
              Detailed API documentation for integrations and development.
            </p>
            <span className="text-primary">Coming Soon</span>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border mb-8">
          <h2 className="text-2xl font-semibold mb-4">Development Documentation</h2>
          <p className="text-muted-foreground mb-4">
            Access our comprehensive developer documentation including database schemas, API references,
            and integration guides.
          </p>
          <div className="flex gap-4">
            <span
              className="text-primary cursor-not-allowed"
            >
              View Full Documentation (Coming Soon)
            </span>
          </div>
        </div>

        <div className="text-center">
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
