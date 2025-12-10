import Link from 'next/link';

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Features</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Discover what makes DDPC the ultimate platform for vehicle management.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-card text-card-foreground p-6 rounded-lg border border-border">
            <h2 className="text-2xl font-semibold mb-4">Vehicle Tracking</h2>
            <p className="text-muted-foreground">
              Keep detailed records of your vehicle's history, modifications, and maintenance logs.
              Never lose track of what you've done to your car.
            </p>
          </div>

          <div className="bg-card text-card-foreground p-6 rounded-lg border border-border">
            <h2 className="text-2xl font-semibold mb-4">Maintenance Schedules</h2>
            <p className="text-muted-foreground">
              Set up custom maintenance schedules and get reminders when service is due.
              Stay on top of oil changes, tire rotations, and more.
            </p>
          </div>

          <div className="bg-card text-card-foreground p-6 rounded-lg border border-border">
            <h2 className="text-2xl font-semibold mb-4">Parts Inventory</h2>
            <p className="text-muted-foreground">
              Manage your spare parts, track part numbers, and organize your garage inventory efficiently.
            </p>
          </div>

          <div className="bg-card text-card-foreground p-6 rounded-lg border border-border">
            <h2 className="text-2xl font-semibold mb-4">Expense Tracking</h2>
            <p className="text-muted-foreground">
              Monitor your spending on builds, repairs, and running costs. Generate reports to see where your money goes.
            </p>
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
