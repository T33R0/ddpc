'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@repo/ui/card';
import { Badge } from '@repo/ui/badge';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalBody,
} from '@repo/ui/modal';
import { Dna, Flag, Lock, ShoppingCart, ArrowRight, Check, Monitor, Gamepad2, Banknote } from 'lucide-react';

export default function DDSRPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleJoinClick = () => {
    setIsModalOpen(true);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call
    setTimeout(() => {
      setSubmitted(true);
    }, 500);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-orbital text-white">

      {/* 1. HERO SECTION */}
      <section className="relative w-full h-[90vh] flex flex-col md:flex-row overflow-hidden border-b border-white/10">
        {/* Left: Real World */}
        <div className="relative w-full md:w-1/2 h-1/2 md:h-full group">
          <Image
            src="/images/ddsr/ddsr_physical_car.jpg"
            alt="Real world vehicle in a parking lot"
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            priority
          />
        </div>

        {/* Right: Digital Twin */}
        <div className="relative w-full md:w-1/2 h-1/2 md:h-full group border-t md:border-t-0 md:border-l border-white/10">
          <Image
            src="/images/ddsr/ddsr_wireframe_car.jpg"
            alt="Digital twin wireframe simulation"
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            priority
          />
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
                Until today, you had to buy the parts to find out. <br />
                <span className="font-bold">That ends now.</span>
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 3. THE SOLUTION (Value Prop) */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-4xl text-center space-y-12">

          <div className="space-y-6">
            <h2 className="text-sm font-bold tracking-widest text-indigo-400 uppercase">The Solution</h2>
            <h3 className="text-4xl md:text-5xl font-black text-white">
              Introducing <span className="lowercase">ddsr</span>. <br />
              The Operating System for the Phygital Era.
            </h3>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              We don’t just give you a generic car in a game. We inject your car&apos;s DNA—your dyno curves,
              your weight, your alignment specs—into a high-fidelity simulation engine.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8">
            <div className="p-6 rounded-xl bg-black/40 border border-white/10 shadow-lg backdrop-blur-sm">
              <div className="mb-4 text-indigo-400 flex justify-center">
                <Monitor className="w-10 h-10" />
              </div>
              <h4 className="font-bold text-xl mb-2 text-white">Install it Digitally.</h4>
              <p className="text-sm text-gray-400">Upload the specs of that new turbo kit to your Digital Twin.</p>
            </div>
            <div className="p-6 rounded-xl bg-black/40 border border-white/10 shadow-lg backdrop-blur-sm">
              <div className="mb-4 text-indigo-400 flex justify-center">
                <Gamepad2 className="w-10 h-10" />
              </div>
              <h4 className="font-bold text-xl mb-2 text-white">Thrash it Virtually.</h4>
              <p className="text-sm text-gray-400">Take it to the Nürburgring. Push it to the absolute limit.</p>
            </div>
            <div className="p-6 rounded-xl bg-black/40 border border-white/10 shadow-lg backdrop-blur-sm">
              <div className="mb-4 text-indigo-400 flex justify-center">
                <Banknote className="w-10 h-10" />
              </div>
              <h4 className="font-bold text-xl mb-2 text-white">Buy it Physically.</h4>
              <p className="text-sm text-gray-400">If it feels right, buy the parts. If not, you just saved $4k.</p>
            </div>
          </div>

        </div>
      </section>

      {/* 4. THE FEATURES (Salivate List) */}
      <section className="py-24 px-6 bg-black/20 border-y border-white/10 backdrop-blur-sm">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">

            {/* Feature 1 */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 mb-2">
                <Dna className="w-8 h-8" />
              </div>
              <h4 className="text-2xl font-bold text-white">The Soul File Protocol</h4>
              <p className="text-gray-400 leading-relaxed">
                Your car is more than a 3D model. It’s a data set. Our proprietary engine reads your real-world
                maintenance, wear-and-tear, and modifications to create a simulation that evolves with your odometer.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 mb-2">
                <Flag className="w-8 h-8" />
              </div>
              <h4 className="text-2xl font-bold text-white">Asynchronous Competition</h4>
              <p className="text-gray-400 leading-relaxed">
                Race your friends, but on your time. Upload your best lap. Your friend downloads your &quot;Ghost&quot;—driven
                by your exact physics—and battles it on Sunday morning.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 mb-2">
                <Lock className="w-8 h-8" />
              </div>
              <h4 className="text-2xl font-bold text-white">Verified Ownership Racing</h4>
              <p className="text-gray-400 leading-relaxed">
                No &quot;Pay-to-Win&quot; BS. No generic supercars. In our leagues, you race what you own.
                If you don&apos;t have the keys in real life, you don&apos;t get the grid slot in the sim.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 5. CALL TO ACTION (The Velvet Rope) */}
      <section className="py-32 px-6 relative overflow-hidden border-t border-white/10">
        {/* Background Image with Blur and Tint */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/ddsr/ddsr_full_car.jpg"
            alt="DDSR Fleet"
            fill
            className="object-cover blur-sm"
          />
          <div className="absolute inset-0 bg-black/70" /> {/* Dark tint overlay */}
        </div>

        <div className="container mx-auto max-w-2xl text-center space-y-8 relative z-10">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white">
            The Grid is Forming.
          </h2>
          <p className="text-xl text-gray-200">
            We are currently mapping the initial fleet of Digital Twins.
            Access will be granted in waves based on Garage Depth and Data Quality.
          </p>

          <div className="pt-4">
            <Button size="lg" className="text-lg px-8 py-6 h-auto shadow-lg shadow-indigo-500/20 bg-white text-black hover:bg-gray-200" onClick={handleJoinClick}>
              Reserve My Digital VIN <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <p className="text-xs text-gray-400 mt-4 font-medium uppercase tracking-wider">
              Early adopters lock in &quot;Founder&quot; pricing for life.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 bg-black/60 border-t border-white/10 text-center backdrop-blur-md">
        <p className="text-sm text-gray-400 font-mono">
          Powered by ddpc. Built for the Drivers, not the Gamers.
        </p>
      </footer>

      {/* JOIN WAITLIST MODAL */}
      <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Join the Waitlist</ModalTitle>
            <ModalDescription>
              Secure your spot on the grid. We&apos;ll notify you when your wave opens.
            </ModalDescription>
          </ModalHeader>

          <ModalBody>
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                  <Check className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold">You&apos;re on the list.</p>
                  <p className="text-muted-foreground">Keep wrenching. We&apos;ll be in touch.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleEmailSubmit} className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="racer@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 text-lg"
                  />
                </div>
                <Button type="submit" className="w-full h-12 text-lg">
                  Join Waitlist
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

    </div>
  );
}
