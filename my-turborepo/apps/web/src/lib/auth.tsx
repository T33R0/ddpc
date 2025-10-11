'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: email.split('@')[0],
          display_name: email.split('@')[0],
        }
      }
    });

    // Create user profile if signup was successful
    if (!error && data.user) {
      const { error: profileError } = await supabase
        .from('user_profile')
        .upsert({
          user_id: data.user.id,
          username: email.split('@')[0],
          display_name: email.split('@')[0],
          email: email,
          is_public: true,
          role: 'user',
          plan: 'free',
          banned: false,
        }, {
          onConflict: 'user_id'
        });

      if (profileError) {
        console.error('Error creating user profile:', profileError);
      } else {
        // After creating the profile, create a garage for the user
        const { error: garageError } = await supabase
          .from('garage')
          .insert({
            owner_id: data.user.id,
            name: `${data.user.email?.split('@')[0] ?? 'My'}'s Garage`,
          });

        if (garageError) {
          console.error('Error creating user garage:', garageError);
        }
      }
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  // During build time or SSR, provide a default loading state
  if (context === undefined) {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      // SSR/build time - return loading state
      return {
        user: null,
        session: null,
        loading: true,
        signUp: async () => ({ error: null }),
        signIn: async () => ({ error: null }),
        signInWithGoogle: async () => ({ error: null }),
        signOut: async () => {},
      };
    }
    // Client-side but no provider - this is an error
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
