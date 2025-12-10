import Link from 'next/link';

export default function StatusPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">System Status</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Current status of DDPC services and systems.
          </p>
        </div>

        <div className="bg-green-500/10 text-green-700 dark:text-green-400 p-4 rounded-lg border border-green-500/20 mb-8 flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
          <span className="font-semibold">All Systems Operational</span>
        </div>

        <div className="space-y-4 mb-12">
          <div className="bg-card text-card-foreground p-4 rounded-lg border border-border flex justify-between items-center">
            <span className="font-medium">Web Application</span>
            <span className="text-green-600 dark:text-green-400 text-sm font-medium">Operational</span>
          </div>

          <div className="bg-card text-card-foreground p-4 rounded-lg border border-border flex justify-between items-center">
            <span className="font-medium">API</span>
            <span className="text-green-600 dark:text-green-400 text-sm font-medium">Operational</span>
          </div>

          <div className="bg-card text-card-foreground p-4 rounded-lg border border-border flex justify-between items-center">
            <span className="font-medium">Database</span>
            <span className="text-green-600 dark:text-green-400 text-sm font-medium">Operational</span>
          </div>

          <div className="bg-card text-card-foreground p-4 rounded-lg border border-border flex justify-between items-center">
            <span className="font-medium">Image Processing</span>
            <span className="text-green-600 dark:text-green-400 text-sm font-medium">Operational</span>
          </div>
        </div>

        <div className="bg-card text-card-foreground p-6 rounded-lg border border-border mb-8">
          <h2 className="text-xl font-semibold mb-4">Past Incidents</h2>
          <div className="space-y-4">
             <div className="border-l-2 border-muted pl-4">
                <p className="text-sm text-muted-foreground mb-1">October 1, 2024</p>
                <p className="font-medium">Scheduled Maintenance</p>
                <p className="text-sm text-muted-foreground">
                  Completed database upgrades with minimal downtime.
                </p>
             </div>
             <div className="border-l-2 border-muted pl-4">
                <p className="text-sm text-muted-foreground mb-1">September 15, 2024</p>
                <p className="font-medium">Image Upload Latency</p>
                <p className="text-sm text-muted-foreground">
                  Users experienced slow image uploads for approximately 30 minutes. Issue resolved.
                </p>
             </div>
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
