import Link from 'next/link';

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Careers at DDPC</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Join us in building the future of automotive enthusiast tools.
          </p>
        </div>

        <div className="bg-card text-card-foreground p-8 rounded-lg border border-border mb-12">
          <h2 className="text-2xl font-semibold mb-4">Why Work With Us?</h2>
          <p className="text-muted-foreground mb-6">
            We are a team of passionate developers and car enthusiasts. We believe in writing clean code,
            building robust products, and actually using the tools we create. If you love cars and code,
            this is the place for you.
          </p>
        </div>

        <h2 className="text-2xl font-semibold mb-6">Open Positions</h2>

        <div className="space-y-4 mb-12">
          <div className="bg-card text-card-foreground p-6 rounded-lg border border-border flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h3 className="text-xl font-semibold">Senior Full Stack Engineer</h3>
              <p className="text-muted-foreground">Remote • Engineering</p>
            </div>
            <button className="mt-4 md:mt-0 bg-secondary text-secondary-foreground px-4 py-2 rounded hover:bg-secondary/80 transition-colors">
              Apply Now
            </button>
          </div>

          <div className="bg-card text-card-foreground p-6 rounded-lg border border-border flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h3 className="text-xl font-semibold">Product Designer</h3>
              <p className="text-muted-foreground">Remote • Design</p>
            </div>
            <button className="mt-4 md:mt-0 bg-secondary text-secondary-foreground px-4 py-2 rounded hover:bg-secondary/80 transition-colors">
              Apply Now
            </button>
          </div>

           <div className="bg-card text-card-foreground p-6 rounded-lg border border-border flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h3 className="text-xl font-semibold">Community Manager</h3>
              <p className="text-muted-foreground">Remote • Marketing</p>
            </div>
            <button className="mt-4 md:mt-0 bg-secondary text-secondary-foreground px-4 py-2 rounded hover:bg-secondary/80 transition-colors">
              Apply Now
            </button>
          </div>
        </div>

        <div className="text-center">
          <p className="text-muted-foreground mb-6">
            Don&apos;t see a role that fits? We&apos;re always looking for talent.
            <br />
            Email us at <a href="mailto:careers@ddpc.com" className="text-primary hover:underline">careers@ddpc.com</a>
          </p>
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
