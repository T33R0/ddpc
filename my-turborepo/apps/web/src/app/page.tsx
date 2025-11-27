'use client';

import React, { useState, useEffect } from 'react';
import LandingLayout from './landing-layout';
import { Button } from '@repo/ui/button';
import Link from 'next/link';
import { AuthModal } from '@repo/ui/auth-modal';
import { useAuth } from '../lib/auth';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user, loading, signUp, signIn, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleGoogleSignIn = () => {
    signInWithGoogle();
  };

  const handleEmailSignUp = async (email: string, password: string) => {
    return await signUp(email, password);
  };

  const handleEmailSignIn = async (email: string, password: string) => {
    return await signIn(email, password);
  };

  // If checking auth status or user is logged in (will redirect), don't show landing content
  // If checking auth status or user is logged in (will redirect), show loading
  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <LandingLayout>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] gap-8 p-4 text-center lowercase">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
          welcome to ddpc
        </h1>
        <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
          the digital platform for auto enthusiasts
        </p>
        <div className="flex flex-col gap-4 min-[400px]:flex-row">
          <Button
            size="lg"
            onClick={() => setIsAuthModalOpen(true)}
            className="px-8 lowercase"
          >
            enter
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="px-8 lowercase"
          >
            <Link href="/more">
              learn more
            </Link>
          </Button>
        </div>
      </div>

      <AuthModal
        open={isAuthModalOpen}
        onOpenChange={setIsAuthModalOpen}
        onGoogleSignIn={handleGoogleSignIn}
        onEmailSignUp={handleEmailSignUp}
        onEmailSignIn={handleEmailSignIn}
      />
    </LandingLayout>
  );
}
