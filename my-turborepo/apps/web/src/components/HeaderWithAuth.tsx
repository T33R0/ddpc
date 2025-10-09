'use client';

import { Header } from '@repo/ui/header';
import { useAuth } from '../lib/auth';

export function HeaderWithAuth() {
  const { user, signOut, signUp, signIn, signInWithGoogle } = useAuth();

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
      onSignOut={signOut}
      onGoogleSignIn={handleGoogleSignIn}
      onEmailSignUp={handleEmailSignUp}
      onEmailSignIn={handleEmailSignIn}
    />
  );
}
