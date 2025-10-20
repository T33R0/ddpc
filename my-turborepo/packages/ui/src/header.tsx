'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from './logo';
import { AuthModal } from './auth-modal';
import { Button } from './button';
import { UserAccountDropdown } from './user-account-dropdown';

interface HeaderProps {
  user?: any;
  onSignOut?: () => void;
  onGoogleSignIn?: () => void;
  onEmailSignUp?: (email: string, password: string) => Promise<{ error?: any }>;
  onEmailSignIn?: (email: string, password: string) => Promise<{ error?: any }>;
}

export function Header({ user, onSignOut, onGoogleSignIn, onEmailSignUp, onEmailSignIn }: HeaderProps) {
  const [authModalOpen, setAuthModalOpen] = React.useState(false);


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
          <div className="flex items-center">
            <Link href="/dashboard">
              <Logo />
            </Link>
          </div>

          <nav className="flex items-center gap-8">
            <Link href="/discover" className="text-white hover:text-gray-300 transition-colors">
              Discover
            </Link>
            <Link href="/community" className="text-white hover:text-gray-300 transition-colors">
              Community
            </Link>
            {user ? (
              <Link href="/garage" className="text-white hover:text-gray-300 transition-colors">
                Garage
              </Link>
            ) : (
              <Link href="/pricing" className="text-white hover:text-gray-300 transition-colors">
                Pricing
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-4">
            
            {user ? (
              <UserAccountDropdown user={user} onSignOut={onSignOut} />
            ) : (
              <Button onClick={() => setAuthModalOpen(true)}>Sign In</Button>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
