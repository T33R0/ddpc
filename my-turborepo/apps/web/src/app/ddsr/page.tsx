'use client';

import { useState } from 'react';
import Image from 'next/image';
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
    setTimeout(() => {
      setSubmitted(true);
    }, 500);
  };

  return (
    <div className="flex flex-col min-h-screen w-full">
      {/* Hero Section */}
      <section className="flex flex-col md:flex-row h-[50vh] md:h-[70vh] w-full bg-black">
        <div className="relative w-full md:w-1/2 h-full">
          <Image
            src="/images/ddsr/ddsr_physical_half.jpg"
            alt="DDSR Physical"
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
        <div className="relative w-full md:w-1/2 h-full">
          <Image
            src="/images/ddsr/ddsr_digital_half.jpg"
            alt="DDSR Digital"
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      </section>

      {/* Definition Section */}
      <section className="container mx-auto px-4 py-16 text-center space-y-8">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground lowercase tracking-tight">ddsr</h1>
        <div className="max-w-2xl mx-auto p-8 bg-card rounded-xl border border-border shadow-sm">
          <h2 className="text-xl font-semibold mb-3 text-card-foreground">Definition</h2>
          <p className="text-xl text-muted-foreground italic lowercase font-medium">
            &quot;the next extension of ddpc&quot;
          </p>
        </div>
      </section>

      {/* CTA Section - The Grid Is Forming */}
      <section className="relative w-full py-32 md:py-48 flex flex-col items-center justify-center text-center text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/ddsr/ddsr_full_car.jpg"
            alt="DDSR Full Car"
            fill
            className="object-cover brightness-[0.4]"
            priority={false}
            sizes="100vw"
          />
        </div>

        <div className="relative z-10 space-y-10 px-4 max-w-4xl mx-auto">
          <h2 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-tight drop-shadow-xl">
            The Grid Is Forming
          </h2>

          <div className="flex flex-col items-center gap-6">
            <div className="text-center space-y-2">
              <p className="text-lg md:text-xl text-gray-200 font-medium drop-shadow-md">
                Join {count.toLocaleString()} other enthusiasts waiting for this.
              </p>
            </div>

            <Button
              size="lg"
              onClick={handleInterestClick}
              className="px-10 py-8 text-xl font-bold rounded-full transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl"
            >
              Keep me posted
            </Button>
          </div>
        </div>
      </section>

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
    </div>
  );
}
