'use client';

import { Header } from '@repo/ui/header';
import { usePathname } from 'next/navigation';

import { useAuth } from '../lib/auth';
import { useTheme, Theme } from '../lib/theme-context';
import { useVehicles } from '../lib/hooks/useVehicles';
import { stripUsernamePrefixFromPathname, toUsernameSlug } from '../lib/user-routing';
import { useReportModal } from '../lib/report-modal-context';
import { useState } from 'react';
import { TestimonialModal } from './TestimonialModal';

export function HeaderWithAuth() {
  const pathname = usePathname() || '/';
  const { user, profile, signOut, signUp, signIn, signInWithGoogle } = useAuth();
  const { theme, setTheme } = useTheme();
  const { open: openReportModal } = useReportModal();
  const [testimonialModalOpen, setTestimonialModalOpen] = useState(false);

  const normalizedPathname = stripUsernamePrefixFromPathname(pathname).pathname || '/';
  const isHeaderHidden = normalizedPathname === '/';
  const { data: vehiclesData } = useVehicles({ enabled: !isHeaderHidden });

  if (isHeaderHidden) {
    return null;
  }

  const allVehicles = vehiclesData?.vehicles || [];
  const activeVehiclesCount = allVehicles.filter(vehicle => vehicle.current_status === 'daily_driver').length;

  const rawUsername =
    profile?.username ??
    (user?.user_metadata?.username as string | undefined) ??
    (user?.user_metadata?.preferred_username as string | undefined) ??
    (user?.user_metadata?.user_name as string | undefined) ??
    (user?.email ? user.email.split('@')[0] : undefined);

  const usernameSlug = rawUsername ? toUsernameSlug(rawUsername) : null;
  const userBasePath = usernameSlug ? `/${usernameSlug}` : undefined;

  const handleGoogleSignIn = () => {
    signInWithGoogle();
  };

  const handleEmailSignUp = async (email: string, password: string) => {
    return await signUp(email, password);
  };

  const handleEmailSignIn = async (email: string, password: string) => {
    return await signIn(email, password);
  };

  return (
    <>
      <Header
        user={user}
        activeVehiclesCount={activeVehiclesCount}
        onSignOut={signOut}
        onGoogleSignIn={handleGoogleSignIn}
        onEmailSignUp={handleEmailSignUp}
        onEmailSignIn={handleEmailSignIn}
        onReportProblem={openReportModal}
        onGiveTestimonial={() => setTestimonialModalOpen(true)}
        userBasePath={userBasePath}
        theme={theme}
        onThemeChange={(newTheme) => setTheme(newTheme as Theme)}
      />

      {user && (
        <TestimonialModal
          isOpen={testimonialModalOpen}
          onOpenChange={setTestimonialModalOpen}
          user={{
            displayName: rawUsername || 'User',
            avatarUrl: user.user_metadata?.avatar_url
          }}
        />
      )}
    </>
  );
}
