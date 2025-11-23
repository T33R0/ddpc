'use client';

import { Header } from '@repo/ui/header';
import { usePathname } from 'next/navigation';

import { useAuth } from '../lib/auth';
import { useVehicles } from '../lib/hooks/useVehicles';
import { stripUsernamePrefixFromPathname, toUsernameSlug } from '../lib/user-routing';
import { ReportProblem } from './ReportProblem';

export function HeaderWithAuth() {
  const pathname = usePathname() || '/';
  const { user, signOut, signUp, signIn, signInWithGoogle } = useAuth();

  const normalizedPathname = stripUsernamePrefixFromPathname(pathname).pathname || '/';
  const isHeaderHidden = normalizedPathname === '/' || normalizedPathname === '/dashboard';
  const { data: vehiclesData } = useVehicles({ enabled: !isHeaderHidden });

  if (isHeaderHidden) {
    return null;
  }

  const allVehicles = vehiclesData?.vehicles || [];
  const activeVehiclesCount = allVehicles.filter(vehicle => vehicle.current_status === 'daily_driver').length;

  const rawUsername =
    (user?.user_metadata?.username as string | undefined) ??
    (user?.user_metadata?.preferred_username as string | undefined) ??
    (user?.user_metadata?.user_name as string | undefined) ??
    (user?.email ? user.email.split('@')[0] : undefined);

  const usernameSlug = toUsernameSlug(rawUsername);
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
    <Header
      user={user}
      activeVehiclesCount={activeVehiclesCount}
      onSignOut={signOut}
      onGoogleSignIn={handleGoogleSignIn}
      onEmailSignUp={handleEmailSignUp}
      onEmailSignIn={handleEmailSignIn}
      reportProblem={<ReportProblem />}
      userBasePath={userBasePath}
    />
  );
}
