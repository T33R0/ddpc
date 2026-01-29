import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@repo/ui/card';
import { Button } from '@repo/ui/button';
import LandingLayout from '../landing-layout';

export default function AboutPage() {
  return (
    <LandingLayout>
      <div className="container mx-auto py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold mb-4">About DDPC</h1>
            <p className="text-xl text-muted-foreground">
              Daily Driven Project Car - The complete vehicle management platform for enthusiasts and professionals.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <Card>
              <CardHeader>
                <CardTitle>Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  To empower automotive enthusiasts with the tools they need to properly maintain,
                  track, and showcase their vehicles. We believe every project deserves proper documentation
                  and every enthusiast deserves peace of mind.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>What We Do</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  DDPC provides comprehensive vehicle tracking, maintenance logging, parts management,
                  and community features for automotive enthusiasts. From daily drivers to weekend warriors,
                  we help you keep your vehicles in top condition.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Coming Soon</h2>
            <p className="text-xl text-muted-foreground mb-8">
              We&apos;re working hard to bring you the full DDPC experience. Check back soon for updates!
            </p>
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
