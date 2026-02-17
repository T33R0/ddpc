'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pricing } from '@/components/landing';
import LandingLayout from '../landing-layout';
import { AuthModal } from '@/components/auth/auth-modal';
import { useAuth } from '../../lib/auth';

export default function PricingPage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [hasRedirectedAfterFirstLogin, setHasRedirectedAfterFirstLogin] = useState(false);
  const [redirectPath, setRedirectPath] = useState('/garage');

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

    if (hasRedirectedAfterFirstLogin) {
      return;
    }

    // Redirect logic:
    // If we have a specific pending redirect path (from a button click), go there.
    // Otherwise, default behavior for first login is /garage.
    // If not first login, we might already be on the page we want, or we can just stay here.
    // BUT the simplified logic for now is: if user just logged in via this flow, go to target.

    // Check if we are freshly authenticated (simplify: just check user existence + !redirected)
    // For now, we rely on the specific flow trigger.
    if (user) {
      // Check for persisted redirect from session storage (handles oauth redirects)
      const persistedRedirect = sessionStorage.getItem('pricing_redirect');
      if (persistedRedirect) {
        sessionStorage.removeItem('pricing_redirect');
        router.push(persistedRedirect);
        setHasRedirectedAfterFirstLogin(true);
      } else if (redirectPath !== '/garage') {
        // Fallback to local state if we didn't leave the page (e.g. modal auth)
        router.push(redirectPath);
        setHasRedirectedAfterFirstLogin(true);
      }
    }

  }, [user, loading, router, hasRedirectedAfterFirstLogin, redirectPath]);

  const handlePlanCtaClick = useCallback(
    (planId: string, isAnnual: boolean) => {
      let targetPath = '/garage';

      if (planId === 'pro') {
        const period = isAnnual ? 'annual' : 'monthly';
        targetPath = `/account?tab=billing&upgrade=pro&period=${period}`;
      } else if (planId === 'vanguard') {
        targetPath = '/account?tab=billing&upgrade=vanguard';
      }

      setRedirectPath(targetPath);

      // Persist to session storage for oauth flows
      sessionStorage.setItem('pricing_redirect', targetPath);

      if (!user) {
        setAuthModalMode('signup');
        setIsAuthModalOpen(true);
        return true;
      }

      // If user is already logged in, redirect immediately
      router.push(targetPath);
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
