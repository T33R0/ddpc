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
  onSignOut?: () => void;
  onGoogleSignIn?: () => void;
  onEmailSignUp?: (email: string, password: string) => Promise<{ error?: any }>;
  onEmailSignIn?: (email: string, password: string) => Promise<{ error?: any }>;
  reportProblem?: React.ReactNode;
  userBasePath?: string;
}

export function Header({
  user,
  activeVehiclesCount,
  onSignOut,
  onGoogleSignIn,
  onEmailSignUp,
  onEmailSignIn,
  reportProblem,
  userBasePath,
}: HeaderProps) {
  const [authModalOpen, setAuthModalOpen] = React.useState(false);

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
            {reportProblem}
          </div>

          <nav className="flex items-center gap-8">
            <Link href={buildHref('/explore')} className="text-white hover:text-gray-300 transition-colors">
              Explore
            </Link>
            <Link href={buildHref('/community')} className="text-white hover:text-gray-300 transition-colors">
              Community
            </Link>
            {user ? (
              <>
                <Link href={buildHref('/console')} className="text-white hover:text-gray-300 transition-colors">
                  Console
                </Link>
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
            {user && activeVehiclesCount !== undefined && (
              <div className="text-xs text-gray-300 flex items-center gap-1">
                <span>Active</span>
                <span className="font-medium">{activeVehiclesCount}/3</span>
              </div>
            )}

            {user ? (
              <UserAccountDropdown user={user} onSignOut={onSignOut} userBasePath={userBasePath} />
            ) : (
              <Button onClick={() => setAuthModalOpen(true)}>Sign In</Button>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
