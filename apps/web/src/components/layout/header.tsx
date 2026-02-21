'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from '@repo/ui/logo';
import { AuthModal } from '../auth/auth-modal';
import { Button } from '@repo/ui/button';
import { UserAccountDropdown } from '../auth/user-account-dropdown';

interface HeaderProps {
  user?: {
    id: string;
    email?: string;
    user_metadata?: {
      username?: string;
      preferred_username?: string;
      user_name?: string;
      full_name?: string;
      avatar_url?: string;
    };
  } | null;
  activeVehiclesCount?: number;
  onSignOut?: () => Promise<void> | void;
  onGoogleSignIn?: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onEmailSignUp?: (email: string, password: string) => Promise<{ error?: any }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onEmailSignIn?: (email: string, password: string) => Promise<{ error?: any }>;
  onReportProblem?: () => void;
  onGiveTestimonial?: () => void;
  userBasePath?: string;
  theme?: string;
  onThemeChange?: (theme: string) => void;
}

export function Header({
  user,
  onSignOut,
  onGoogleSignIn,
  onEmailSignUp,
  onEmailSignIn,
  onReportProblem,
  onGiveTestimonial,
  userBasePath,
  theme,
  onThemeChange,
}: HeaderProps) {
  const [authModalOpen, setAuthModalOpen] = React.useState(false);

  // Check for auth query parameter and open modal if present
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const authParam = params.get('auth');

      if (authParam === 'signup' || authParam === 'signin') {
        setAuthModalOpen(true);
        // Clean up the URL by removing the auth parameter
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('auth');
        window.history.replaceState({}, '', newUrl.toString());
      }
    }
  }, []);

  const buildHref = React.useCallback(
    (path: string) => {
      const normalized = path.startsWith('/') ? path : `/${path}`;

      if (!userBasePath) {
        return normalized;
      }

      if (normalized === '/') {
        return userBasePath;
      }

      return `${userBasePath}${normalized}`;
    },
    [userBasePath]
  );

  return (
    <>
      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        onGoogleSignIn={onGoogleSignIn}
        onEmailSignUp={onEmailSignUp}
        onEmailSignIn={onEmailSignIn}
      />

      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between text-foreground">
          <div className="flex items-center gap-4">
            <Link href={buildHref('/hub')}>
              <Logo />
            </Link>
          </div>

          <nav className="flex items-center gap-4 sm:gap-8 text-sm sm:text-base font-medium">
            <Link href={buildHref('/explore')} className="text-foreground/80 hover:text-foreground transition-colors">
              Explore
            </Link>
            {user ? (
              <>
                <Link href={buildHref('/garage')} className="text-foreground/80 hover:text-foreground transition-colors">
                  Garage
                </Link>
              </>
            ) : (
              <Link href="/pricing" className="text-foreground/80 hover:text-foreground transition-colors">
                Pricing
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <UserAccountDropdown
                user={user}
                onSignOut={onSignOut}
                userBasePath={userBasePath}
                theme={theme}
                onThemeChange={onThemeChange}
                onReportProblem={onReportProblem}
                onGiveTestimonial={onGiveTestimonial}
              />
            ) : (
              <Button onClick={() => setAuthModalOpen(true)}>Sign In</Button>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
