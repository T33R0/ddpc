'use client';

import { Header } from '@repo/ui/header';
import { useAuth } from '../lib/auth';
import { useVehicles } from '../lib/hooks/useVehicles';
import { usePathname } from 'next/navigation';

export function HeaderWithAuth() {
  const pathname = usePathname();
  const { user, signOut, signUp, signIn, signInWithGoogle } = useAuth();
  const { data: vehiclesData } = useVehicles();

  if (pathname === '/') {
    return null;
  }

  const allVehicles = vehiclesData?.vehicles || [];
  const activeVehiclesCount = allVehicles.filter(vehicle => vehicle.current_status === 'daily_driver').length;

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
    />
  );
}
