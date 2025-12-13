import Link from 'next/link';

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Help Center</h1>
          <p className="text-xl text-muted-foreground mb-8">
            How can we help you today?
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-card text-card-foreground p-6 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer">
            <h2 className="text-xl font-semibold mb-2">Getting Started</h2>
            <p className="text-muted-foreground">
              Learn the basics of setting up your account and adding your first vehicle.
            </p>
          </div>

          <div className="bg-card text-card-foreground p-6 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer">
            <h2 className="text-xl font-semibold mb-2">Account Management</h2>
            <p className="text-muted-foreground">
              Update your profile, change password, and manage your subscription settings.
            </p>
          </div>

          <div className="bg-card text-card-foreground p-6 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer">
             <h2 className="text-xl font-semibold mb-2">Vehicle Logs</h2>
            <p className="text-muted-foreground">
              Guide on how to properly document maintenance, modifications, and fuel logs.
            </p>
          </div>

          <div className="bg-card text-card-foreground p-6 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer">
             <h2 className="text-xl font-semibold mb-2">Troubleshooting</h2>
            <p className="text-muted-foreground">
              Solutions to common issues and error messages.
            </p>
          </div>
        </div>

        <div className="bg-muted p-8 rounded-lg text-center mb-8">
          <h2 className="text-2xl font-bold mb-4">Still need help?</h2>
          <p className="text-muted-foreground mb-6">
            Our support team is available to assist you with any questions or issues.
          </p>
          <Link
            href="/contact"
            className="inline-block bg-primary text-primary-foreground font-semibold py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Contact Support
          </Link>
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="text-primary hover:underline"
          >
            &larr; Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
