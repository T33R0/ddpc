import { Button } from "@repo/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <section className="py-12 md:py-24 lg:py-32 xl:py-48">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none">
              DDPC Documentation
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              Welcome to the official documentation for the Daily Driven Project Car platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mt-8">
            <Link href="/database">
              <Button className="w-full h-16 text-lg" variant="outline">
                📊 Database Schema Reference
                <br />
                <span className="text-sm opacity-75">Complete table documentation</span>
              </Button>
            </Link>

            <Link href="/about">
              <Button className="w-full h-16 text-lg" variant="outline">
                ℹ️ About DDPC
                <br />
                <span className="text-sm opacity-75">Platform overview</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
