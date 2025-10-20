import { Card, CardHeader, CardTitle, CardContent } from "@repo/ui/card";
import { Badge } from "@repo/ui/badge";
import LandingLayout from "../landing-layout";

export default function Community() {
  return (
    <LandingLayout>
      <section className="py-12 pt-32">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <Badge variant="secondary" className="mb-4">
                Coming Soon
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-6">
                Community Hub
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Where automotive enthusiasts connect, share, and inspire
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
              <Card className="text-center">
                <CardHeader>
                  <CardTitle className="text-2xl">👥</CardTitle>
                  <CardTitle>Member Profiles</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Showcase your vehicles, share your automotive journey, and connect with fellow enthusiasts who share your passion.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <CardTitle className="text-2xl">🚗</CardTitle>
                  <CardTitle>Vehicle Spotlights</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Discover unique builds, from daily drivers to track monsters. Get inspiration for your next modification or restoration project.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <CardTitle className="text-2xl">💬</CardTitle>
                  <CardTitle>Discussions & Advice</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Share knowledge, troubleshoot issues, and engage in meaningful conversations about all things automotive.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <CardTitle className="text-2xl">🏆</CardTitle>
                  <CardTitle>Community Challenges</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Participate in build challenges, photo contests, and friendly competitions that celebrate automotive culture.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <CardTitle className="text-2xl">🛠️</CardTitle>
                  <CardTitle>Technical Resources</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Access DIY guides, maintenance tips, and expert advice to help you maintain and improve your vehicles.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <CardTitle className="text-2xl">📅</CardTitle>
                  <CardTitle>Local Meetups</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Find and organize local car meets, track days, and automotive events in your area.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="bg-muted/50 rounded-lg p-8">
              <h2 className="text-2xl font-semibold mb-4">
                Why Join Our Community?
              </h2>
              <p className="text-lg text-muted-foreground">
                Whether you're restoring a classic, modifying a daily driver, or just love talking cars,
                our community will be the ultimate destination for automotive enthusiasts. Connect with
                like-minded individuals, share your passion, and discover endless inspiration for your
                automotive journey.
              </p>
            </div>
          </div>
        </div>
      </section>
    </LandingLayout>
  );
}
