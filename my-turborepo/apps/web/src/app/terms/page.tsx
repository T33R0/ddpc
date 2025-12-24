import Link from 'next/link';
import { Button } from '@repo/ui/button';
import LandingLayout from '../landing-layout';

export default function TermsPage() {
  return (
    <LandingLayout>
      <div className="container mx-auto py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: October 2024</p>
          </div>

          <div className="prose dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using DDPC, you accept and agree to be bound by the terms
                and provision of this agreement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Use License</h2>
              <p className="text-muted-foreground leading-relaxed">
                Permission is granted to temporarily use DDPC for personal, non-commercial
                transitory viewing only. This is the grant of a license, not a transfer of title.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">User Responsibilities</h2>
              <p className="text-muted-foreground leading-relaxed">
                You are responsible for maintaining the confidentiality of your account and
                password. You agree to accept responsibility for all activities that occur
                under your account or password.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Content</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our Service allows you to post, link, store, share and otherwise make available
                certain information, text, graphics, or other material. You are responsible for
                content that you post to the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about these Terms of Service, please contact us at
                legal@ddpc.com.
              </p>
            </section>
          </div>

          <div className="text-center mt-12">
            <Button asChild variant="outline">
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
