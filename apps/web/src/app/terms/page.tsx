import Link from 'next/link';
import { Button } from '@repo/ui/button';

export default function TermsPage() {
  return (
    <div className="min-h-screen text-foreground relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
            <p className="text-muted-foreground mb-8">Last updated: October 2024</p>
          </div>

          <div className="prose dark:prose-invert max-w-none space-y-6 text-foreground">
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-foreground">Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing and using DDPC, you accept and agree to be bound by the terms
                and provision of this agreement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-foreground">Use License</h2>
              <p className="text-muted-foreground">
                Permission is granted to temporarily use DDPC for personal, non-commercial
                transitory viewing only. This is the grant of a license, not a transfer of title.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-foreground">User Responsibilities</h2>
              <p className="text-muted-foreground">
                You are responsible for maintaining the confidentiality of your account and
                password. You agree to accept responsibility for all activities that occur
                under your account or password.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-foreground">Content</h2>
              <p className="text-muted-foreground">
                Our Service allows you to post, link, store, share and otherwise make available
                certain information, text, graphics, or other material. You are responsible for
                content that you post to the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-foreground">Contact Information</h2>
              <p className="text-muted-foreground">
                If you have any questions about these Terms of Service, please contact us at
                legal@ddpc.com.
              </p>
            </section>
          </div>

          <div className="text-center mt-12">
            <Button asChild size="lg">
              <Link href="/">
                Return Home
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
