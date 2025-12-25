'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { signOut as signOutAction } from '../actions/auth';

interface UserProfile {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: string | null;
  plan: 'free' | 'pro' | null;
}

interface UserProfileRow {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string | null;
  plan: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  showLogoutModal: boolean;
  setShowLogoutModal: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
  initialSession = null
}: {
  children: React.ReactNode;
  initialSession?: Session | null;
}) {
  const [user, setUser] = useState<User | null>(initialSession?.user ?? null);
  const [session, setSession] = useState<Session | null>(initialSession);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(!initialSession);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const mapProfileRow = (row: UserProfileRow): UserProfile => ({
    id: row.user_id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    role: row.role ?? null,
    plan: (row.plan?.toLowerCase() === 'pro') ? 'pro' : 'free',
  });

  const fetchProfile = React.useCallback(
    async (userId: string | undefined | null) => {
      if (!userId) {
        setProfile(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_profile')
          .select('user_id, username, display_name, avatar_url, role, plan')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) {
          console.error('Error loading user profile:', error);
          // Don't set profile to null here on error if we want to retry or handle gracefully
          // But for now, if it fails, we have no profile.
          // Note: RLS errors or network errors could land here.
          return;
        }

        if (data) {
          setProfile(mapProfileRow(data));
        } else {
          setProfile(null);
        }
      } catch (e) {
        console.error('Unexpected error fetching profile:', e);
      }
    },
    []
  );

  const refreshProfile = React.useCallback(async () => {
    await fetchProfile(user?.id ?? null);
  }, [fetchProfile, user?.id]);

  // Initial profile fetch if we have a session
  useEffect(() => {
    if (initialSession) {
      // Sync server session to client to ensure they match
      supabase.auth.setSession(initialSession);

      if (initialSession.user?.id) {
        fetchProfile(initialSession.user.id);
      }
    }
  }, [initialSession, fetchProfile]);

  useEffect(() => {
    // Get initial session if not provided
    const getInitialSession = async () => {
      if (!initialSession) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user?.id) {
            await fetchProfile(session.user.id);
          } else {
            setProfile(null);
          }
        } catch (error) {
          console.error('Error getting initial session:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // If we have an initial session and this is the INITIAL_SESSION event,
        // we can ignore it to prevent overwriting with potentially stale local state
        if (event === 'INITIAL_SESSION' && initialSession) {
          return;
        }

        setLoading(true); // Start loading on auth change
        try {
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user?.id) {
            await fetchProfile(session.user.id);
          } else {
            setProfile(null);
          }
        } catch (error) {
          console.error('Error handling auth change:', error);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile, initialSession]);

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
        redirectTo: `${window.location.origin}/api/auth/callback?next=/hub`,
      },
    });
    return { error };
  };

  const signOut = async () => {
    // 1. Clear local state IMMEDIATELY for instant UI feedback
    setSession(null);
    setUser(null);
    setProfile(null);
    setShowLogoutModal(true);

    // 2. Call Server Action to clear cookies and redirect
    await signOutAction();
    // 3. Force hard navigation as a fallback/guarantee
    window.location.href = '/';
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    refreshProfile,
    showLogoutModal,
    setShowLogoutModal,
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
        profile: null,
        loading: true,
        signUp: async () => ({ error: null }),
        signIn: async () => ({ error: null }),
        signInWithGoogle: async () => ({ error: null }),
        signOut: async () => { },
        refreshProfile: async () => { },
        showLogoutModal: false,
        setShowLogoutModal: () => { },
      };
    }
    // Client-side but no provider - this is an error
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
