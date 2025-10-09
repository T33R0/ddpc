'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from './logo';
import { AuthModal } from './auth-modal';
import { ChatDrawer } from './chat-drawer';
import { Button } from './button';
import { GridCard } from './grid-card';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
} from './navigation-menu';

interface HeaderProps {
  user?: any;
  onSignOut?: () => void;
  onGoogleSignIn?: () => void;
  onEmailSignUp?: (email: string, password: string) => Promise<{ error?: any }>;
  onEmailSignIn?: (email: string, password: string) => Promise<{ error?: any }>;
}

export function Header({ user, onSignOut, onGoogleSignIn, onEmailSignUp, onEmailSignIn }: HeaderProps) {
  const [authModalOpen, setAuthModalOpen] = React.useState(false);
  const [chatDrawerOpen, setChatDrawerOpen] = React.useState(false);

  return (
    <>
      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        onGoogleSignIn={onGoogleSignIn}
        onEmailSignUp={onEmailSignUp}
        onEmailSignIn={onEmailSignIn}
      />
      <ChatDrawer open={chatDrawerOpen} onOpenChange={setChatDrawerOpen} />
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-lg border-b border-neutral-800">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between text-white">
          <div className="flex items-center">
            <Link href="/">
              <Logo />
            </Link>
          </div>

          <div className="absolute left-1/2 -translate-x-1/2">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Link href="/discover" legacyBehavior passHref>
                    <NavigationMenuTrigger>Discover</NavigationMenuTrigger>
                  </Link>
                  <NavigationMenuContent>
                    <div className="grid grid-cols-2 gap-3 p-4 w-full">
                      <GridCard title="Explore Vehicles" href="/discover">
                        Browse a curated collection of unique and interesting vehicles.
                      </GridCard>
                      <GridCard title="Featured Builds" href="/discover">
                        Get inspired by top builds from the community.
                      </GridCard>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link href="/community" legacyBehavior passHref>
                    <NavigationMenuTrigger>Community</NavigationMenuTrigger>
                  </Link>
                  <NavigationMenuContent>
                    <div className="grid grid-cols-2 gap-3 p-4 w-full">
                      <GridCard title="Community Builds" href="/community">
                        See what others are building and share your own progress.
                      </GridCard>
                      <GridCard title="Member Garages" href="/community">
                        Check out the garages of other enthusiasts.
                      </GridCard>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link href="/pricing" legacyBehavior passHref>
                    <NavigationMenuLink className={'group inline-flex h-10 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-800 hover:text-white focus:bg-slate-800 focus:text-white focus:outline-none disabled:pointer-events-none disabled:opacity-50'}>
                      Pricing
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          <div className="flex items-center gap-4">
            <Button onClick={() => setChatDrawerOpen(!chatDrawerOpen)} variant="outline" size="sm">
              Scrutineer
            </Button>
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-300">
                  {user.email}
                </span>
                <Button
                  onClick={() => window.location.href = '/account'}
                  variant="outline"
                  size="sm"
                >
                  Account
                </Button>
                <Button
                  onClick={() => onSignOut?.()}
                  variant="outline"
                  size="sm"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button onClick={() => setAuthModalOpen(true)}>Sign In</Button>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
