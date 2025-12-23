import Link from 'next/link';
import { Button } from '@repo/ui/button';

export default function JoinPage() {
    return (
        <div className="min-h-screen text-foreground relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10 py-20">
                <div className="max-w-2xl mx-auto space-y-12">

                    {/* Header Section */}
                    <section className="space-y-6">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                            We Are Not Hiring. <br />
                            We Are Building.
                        </h1>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            Right now, ddpc is built and maintained by me, myself, and AI. There is no HR department. There is no dental plan. There is no ping-pong table.
                        </p>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            We are a bootstrap operation building the Operating System for the automotive enthusiast. We move fast, we break things, and we deploy often.
                        </p>
                    </section>

                    {/* The Mission */}
                    <section className="space-y-4">
                        <h2 className="text-2xl font-semibold">The Mission:</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We believe the future of car ownership is Phygital. We believe your VIN should unlock your vehicle&apos;s digital twin. We believe in racing what you own. And we believe the current tools for enthusiasts are stuck in 2005.
                        </p>
                    </section>

                    {/* The Call */}
                    <section className="space-y-4">
                        <p className="text-lg font-medium leading-relaxed">
                            Sound good? We&apos;re looking for Collaborators, Contributors, and Co-conspirators. If you are an obsessive builder who wants to help architect the bridge between the sim world and the real world, we want to talk.
                        </p>
                    </section>

                    {/* Needs */}
                    <section className="space-y-4">
                        <h2 className="text-2xl font-semibold">We need help with:</h2>
                        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                            <li>
                                <strong className="text-foreground">The Pipeline:</strong> Python scripters who dream in JSON and can manipulate Assetto Corsa .ini files in their sleep.
                            </li>
                            <li>
                                <strong className="text-foreground">The Engine:</strong> Unreal Engine 5 developers who understand chaos physics and vehicle dynamics.
                            </li>
                            <li>
                                <strong className="text-foreground">The Growth:</strong> Storytellers who can explain why a &quot;Soul File&quot; matters to a guy with a Honda Civic.
                            </li>
                        </ul>
                    </section>

                    {/* CTA */}
                    <section className="space-y-6">
                        <h2 className="text-2xl font-semibold">Wanna chat?</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Don&apos;t send a resume. I don&apos;t care where you went to school. Send me a link to something you built. Tell me what you drive. Tell me one thing ddpc is doing wrong right now.
                        </p>

                        <Button asChild size="lg" className="font-semibold">
                            <Link href="mailto:build@myddpc.com">
                                Open Comms
                            </Link>
                        </Button>
                    </section>

                </div>
            </div>
        </div>
    );
}
