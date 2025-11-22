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

export default function ScrutineerPage() {
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
    <section className="relative py-12 min-h-screen bg-background">
      <div className="relative container px-4 md:px-6 pt-24 mx-auto">
        <div className="max-w-3xl mx-auto space-y-12">
          
          {/* Header & Definition */}
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-foreground">Scrutineer</h1>
            <div className="p-6 bg-card rounded-lg border border-border">
              <h2 className="text-xl font-semibold mb-2 text-card-foreground">Definition</h2>
              <p className="text-lg text-muted-foreground italic">
                "A scrutineer in motorsport is an official responsible for checking that race vehicles comply with the technical regulations of the event to ensure safety and fair play."
              </p>
            </div>
          </div>

          {/* Coming Soon */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Coming Soon</h2>
            <p className="text-muted-foreground">
              We are currently building a comprehensive AI-powered Scrutineer for your digital garage. 
              This feature will help you ensure your builds are compliant, safe, and optimized for your specific racing goals.
            </p>
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
                    I'm Interested +1
                </Button>
            </div>
          </div>

        </div>
      </div>

      {/* Email Modal */}
      <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Get Updates</ModalTitle>
            <ModalDescription>
              Be the first to know when Scrutineer goes live.
            </ModalDescription>
          </ModalHeader>
          
          <ModalBody>
            {submitted ? (
              <div className="text-center py-8 space-y-4">
                <div className="text-green-500 text-5xl">✓</div>
                <p className="text-lg font-medium">Thank you for your interest!</p>
                <p className="text-muted-foreground">We'll keep you posted.</p>
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
