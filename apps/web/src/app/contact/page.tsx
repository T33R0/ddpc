import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@repo/ui/card';
import { Button } from '@repo/ui/button';
import LandingLayout from '../landing-layout';

export default function ContactPage() {
  return (
    <LandingLayout>
      <div className="container mx-auto py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
            <p className="text-xl text-muted-foreground">
              Get in touch with the DDPC team. We&apos;re here to help with your vehicle management needs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card>
              <CardHeader>
                <CardTitle>Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-8">
                  We&apos;d love to hear from you! Whether you have a question about features,
                  pricing, need a demo, or anything else, our team is ready to answer all
                  your questions.
                </p>
                <p className="text-sm text-muted-foreground font-semibold">
                  Reach out at <a href="mailto:support@ddpc.com" className="text-primary hover:underline">support@ddpc.com</a>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Business Inquiries</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-8">
                  Interested in partnerships, API access, or enterprise solutions?
                </p>
                <p className="text-muted-foreground">
                  Email: <a href="mailto:business@ddpc.com" className="text-primary hover:text-primary/80 transition-colors">business@ddpc.com</a>
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-12">
            <CardHeader>
              <CardTitle>Community</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Join our community of automotive enthusiasts to share builds, get advice, and connect with fellow vehicle owners.
              </p>
              <div className="flex gap-4">
                <span
                  className="text-muted-foreground cursor-not-allowed text-sm font-medium"
                >
                  Community Forum (Coming Soon)
                </span>
              </div>
            </CardContent>
          </Card>

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
