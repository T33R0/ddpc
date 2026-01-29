import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@repo/ui/card';
import { Button } from '@repo/ui/button';
import LandingLayout from '../landing-layout';

export default function FeaturesPage() {
  return (
    <LandingLayout>
      <div className="container mx-auto py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold mb-4">Features</h1>
            <p className="text-xl text-muted-foreground">
              Discover what makes DDPC the ultimate platform for vehicle management.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <Card>
              <CardHeader>
                <CardTitle>Vehicle Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Keep detailed records of your vehicle&apos;s history, modifications, and maintenance logs.
                  Never lose track of what you&apos;ve done to your car.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Maintenance Schedules</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Set up custom maintenance schedules and get reminders when service is due.
                  Stay on top of oil changes, tire rotations, and more.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Parts Inventory</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Manage your spare parts, track part numbers, and organize your garage inventory efficiently.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expense Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Monitor your spending on builds, repairs, and running costs. Generate reports to see where your money goes.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button asChild size="lg">
              <Link href="/">
                Return Home
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </LandingLayout>
  );
}
