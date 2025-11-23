'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from './logo';
import { AuthModal } from './auth-modal';
import { Button } from './button';
import { UserAccountDropdown } from './user-account-dropdown';

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
  onEmailSignUp?: (email: string, password: string) => Promise<{ error?: any }>;
  onEmailSignIn?: (email: string, password: string) => Promise<{ error?: any }>;
  onReportProblem?: () => void;
  userBasePath?: string;
  theme?: string;
  onThemeChange?: (theme: string) => void;
}

export function Header({
  user,
  activeVehiclesCount,
  onSignOut,
  onGoogleSignIn,
  onEmailSignUp,
  onEmailSignIn,
  onReportProblem,
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

      <header className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-lg border-b border-neutral-800">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            <Link href={buildHref('/dashboard')}>
              <Logo />
            </Link>
          </div>

          <nav className="flex items-center gap-8">
            <Link href={buildHref('/explore')} className="text-white hover:text-gray-300 transition-colors">
              Explore
            </Link>
            {user ? (
              <>
                <Link href={buildHref('/garage')} className="text-white hover:text-gray-300 transition-colors">
                  Garage
                </Link>
              </>
            ) : (
              <Link href="/pricing" className="text-white hover:text-gray-300 transition-colors">
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
