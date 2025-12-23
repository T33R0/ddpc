'use client';

import { useState } from 'react';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui/label';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalBody,
} from '@repo/ui/modal';

export default function DDSRPage() {
  const [count, setCount] = useState(1024); // Starting with a "fake" number to look popular
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleInterestClick = () => {
    setCount(prev => prev + 1);
    setIsModalOpen(true);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, we would send this to an API
    // For now, just simulate success
    // Force rebuild
    setTimeout(() => {
      setSubmitted(true);
    }, 500);
  };

  return (
    <section className="relative py-12 min-h-screen">
      <div className="relative container px-4 md:px-6 pt-24 mx-auto">
        <div className="max-w-3xl mx-auto space-y-12">

      {/* 1. HERO SECTION */}
      <section className="relative w-full h-[90vh] flex flex-col md:flex-row overflow-hidden border-b border-white/10">
        {/* Left: Real World */}
        <div className="relative w-full md:w-1/2 h-1/2 md:h-full group">
          <Image
            src="/images/hub/garage.jpg"
            alt="Real world vehicle on a lift"
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            priority
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tighter uppercase opacity-80 select-none">
              Physical
            </h2>
          </div>
        </div>

        {/* Right: Digital Twin */}
        <div className="relative w-full md:w-1/2 h-1/2 md:h-full group border-t md:border-t-0 md:border-l border-white/10">
          <Image
            src="/images/hub/ddsr.png"
            alt="Digital twin wireframe simulation"
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            priority
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
             <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tighter uppercase opacity-80 select-none">
              Digital
            </h2>
          </div>
        </div>

        {/* Center Text Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none px-4 text-center">
          <div className="bg-black/60 backdrop-blur-md p-8 rounded-2xl border border-white/10 shadow-2xl max-w-4xl">
            <h1 className="text-4xl md:text-7xl font-bold tracking-tight mb-4 text-white">
              Stop Guessing. <br className="hidden md:block" />
              <span className="text-indigo-400">Start Simulating.</span>
            </h1>
            <p className="text-lg md:text-2xl text-gray-200 font-light">
              The first platform where your <span className="font-medium text-white">physical VIN</span> controls your <span className="font-medium text-white">digital physics</span>.
            </p>
          </div>
        </div>
      </section>

      {/* 2. THE HOOK (The "What If") */}
      <section className="py-24 px-6 md:px-12 bg-black/40 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-16 items-center">

          {/* Visual: Shopping Cart */}
          <div className="relative">
            <Card className="w-full max-w-md mx-auto shadow-xl border-white/10 bg-black/60 text-white relative z-10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-white/10">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" /> Cart (2)
                </CardTitle>
                <Badge variant="outline" className="border-white/20 text-white">Guest</Badge>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-white">Garrett G25-550 Turbo Kit</p>
                    <p className="text-sm text-gray-400">In Stock</p>
                  </div>
                  <p className="font-mono font-medium">$2,495.99</p>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-white">KW V3 Coilover Kit</p>
                    <p className="text-sm text-gray-400">Est. Delivery: 2 weeks</p>
                  </div>
                  <p className="font-mono font-medium">$1,789.50</p>
                </div>

                <div className="border-t border-white/10 pt-4 flex justify-between items-center font-bold text-lg">
                  <span>Total</span>
                  <span>$4,285.49</span>
                </div>
              </CardContent>
              <CardFooter>
                 {/* Visual only button */}
                <Button className="w-full relative overflow-hidden group bg-white text-black hover:bg-gray-200">
                   Proceed to Checkout
                   <span className="absolute inset-0 bg-red-600/90 text-white flex items-center justify-center font-bold translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                     WAIT!
                   </span>
                </Button>
              </CardFooter>
            </Card>

            {/* Decorative background blob */}
            <div className="absolute -top-12 -left-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl z-0" />
            <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl z-0" />
          </div>

          {/* Copy */}
          <div className="space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold leading-tight text-white">
              You’re about to drop <span className="text-indigo-400">$4k</span> on a new suspension and turbo setup.
            </h2>
            <div className="space-y-4 text-lg text-gray-300">
              <p>
                Will it ruin your daily drivability? Will it actually cut your lap time?
                Or will you just destroy your ride quality for 15 horsepower?
              </p>
              <p className="font-medium text-white border-l-4 border-indigo-500 pl-4 py-2 bg-indigo-500/10 rounded-r">
                Until today, you had to buy the parts to find out. <br/>
                <span className="font-bold">That ends now.</span>
              </p>
            </div>
          </div>

          {/* Coming Soon */}
          <div className="space-y-4">
            <h2 className="text-5xl font-bold text-foreground lowercase">ddsr coming soon</h2>
          </div>

          {/* Interest Check & CTA */}
          <div className="flex flex-col items-center justify-center space-y-6 pt-8 pb-16">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-medium text-foreground">Are you interested in this feature?</h3>
              <p className="text-sm text-muted-foreground">Join {count} other enthusiasts waiting for this.</p>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="text-2xl font-bold text-primary animate-in fade-in slide-in-from-bottom-2">
                {count}
              </div>
              <Button
                size="lg"
                onClick={handleInterestClick}
                className="px-8 py-6 text-lg"
              >
                Keep me posted
              </Button>
            </div>
          </div>

      {/* 5. CALL TO ACTION (The Velvet Rope) */}
      <section className="py-32 px-6 relative overflow-hidden border-t border-white/10">
        {/* Background Image with Blur and Tint */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hub/explore.png"
            alt="DDSR Fleet"
            fill
            className="object-cover blur-sm"
          />
          <div className="absolute inset-0 bg-black/70" /> {/* Dark tint overlay */}
        </div>
      </div>

      {/* Email Modal */}
      <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Get Updates</ModalTitle>
            <ModalDescription>
              Be the first to know when ddsr goes live.
            </ModalDescription>
          </ModalHeader>

          <ModalBody>
            {submitted ? (
              <div className="text-center py-8 space-y-4">
                <div className="text-green-500 text-5xl">✓</div>
                <p className="text-lg font-medium">Thank you for your interest!</p>
                <p className="text-muted-foreground">We&apos;ll keep you posted.</p>
              </div>
            ) : (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Notify Me
                </Button>
              </form>
            )}
          </ModalBody>

          {submitted && (
            <ModalFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Close</Button>
            </ModalFooter>
          )}
        </ModalContent>
      </Modal>
    </section>
  );
}
