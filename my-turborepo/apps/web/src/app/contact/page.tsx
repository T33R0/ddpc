import Link from 'next/link';
export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Get in touch with the DDPC team. We&apos;re here to help with your vehicle management needs.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-card p-6 rounded-lg border border-border">
            <h2 className="text-2xl font-semibold mb-4">Support</h2>
            <p className="text-muted-foreground mb-4">
              We&apos;d love to hear from you! Whether you have a question about features,
              pricing, need a demo, or anything else, our team is ready to answer all
              your questions.
            </p>

            <div className="mt-8">
              <Link href="/" className="text-primary hover:underline">
                &larr; Back to Home
              </Link>
            </div>
          </div>

          <div className="bg-card p-6 rounded-lg border border-border">
            <h2 className="text-2xl font-semibold mb-4">Business Inquiries</h2>
            <p className="text-muted-foreground mb-4">
              Interested in partnerships, API access, or enterprise solutions?
            </p>
            <p className="text-muted-foreground">
              Email: <a href="mailto:business@ddpc.com" className="text-primary hover:text-primary/80 transition-colors">business@ddpc.com</a>
            </p>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border mb-8">
          <h2 className="text-2xl font-semibold mb-4">Community</h2>
          <p className="text-muted-foreground mb-4">
            Join our community of automotive enthusiasts to share builds, get advice, and connect with fellow vehicle owners.
          </p>
          <div className="flex gap-4">
            <span
              className="text-muted-foreground cursor-not-allowed"
            >
              Community Forum (Coming Soon)
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
