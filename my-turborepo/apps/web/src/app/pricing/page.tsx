'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pricing } from '@repo/ui/landing';
import LandingLayout from '../landing-layout';
import { AuthModal } from '@repo/ui/auth-modal';
import { useAuth } from '../../lib/auth';

export default function PricingPage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [hasRedirectedAfterFirstLogin, setHasRedirectedAfterFirstLogin] = useState(false);

  const { user, loading, signUp, signIn, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      setHasRedirectedAfterFirstLogin(false);
      return;
    }

    const isFirstLogin =
      Boolean(user.created_at) &&
      Boolean(user.last_sign_in_at) &&
      user.created_at === user.last_sign_in_at;

    if (isFirstLogin && !hasRedirectedAfterFirstLogin) {
      router.push('/garage');
      setHasRedirectedAfterFirstLogin(true);
    }
  }, [user, loading, router, hasRedirectedAfterFirstLogin]);

  const handlePlanCtaClick = useCallback(
    (planId: string) => {
      if (planId !== 'driver') {
        return false;
      }

      if (!user) {
        setAuthModalMode('signup');
        setIsAuthModalOpen(true);
        return true;
      }

      router.push('/garage');
      return true;
    },
    [router, user]
  );

  const handleGoogleSignIn = useCallback(() => {
    return signInWithGoogle();
  }, [signInWithGoogle]);

  const handleEmailSignUp = useCallback(
    async (email: string, password: string) => {
      return signUp(email, password);
    },
    [signUp]
  );

  const handleEmailSignIn = useCallback(
    async (email: string, password: string) => {
      return signIn(email, password);
    },
    [signIn]
  );

  return (
    <LandingLayout>
      <Pricing onPlanCtaClick={handlePlanCtaClick} />

      <AuthModal
        open={isAuthModalOpen}
        onOpenChange={setIsAuthModalOpen}
        onGoogleSignIn={handleGoogleSignIn}
        onEmailSignUp={handleEmailSignUp}
        onEmailSignIn={handleEmailSignIn}
        initialMode={authModalMode}
      />
    </LandingLayout>
  );
}
