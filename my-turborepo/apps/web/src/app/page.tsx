'use client';

import React, { useState } from 'react';
import LandingLayout from './landing-layout';
import { Button } from '@repo/ui/button';
import Link from 'next/link';
import { AuthModal } from '../features/auth/AuthModal';

export default function Home() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <LandingLayout>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] gap-8 p-4 text-center">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
          Welcome to DDPC
        </h1>
        <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
          Your digital platform for car enthusiasts.
        </p>
        <div className="flex flex-col gap-4 min-[400px]:flex-row">
          <Button 
            size="lg" 
            onClick={() => setIsAuthModalOpen(true)}
            className="px-8"
          >
            Enter
          </Button>
          <Button 
            asChild 
            variant="outline" 
            size="lg"
            className="px-8"
          >
            <Link href="/more">
              Learn More
            </Link>
          </Button>
        </div>
      </div>

      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </LandingLayout>
  );
}
