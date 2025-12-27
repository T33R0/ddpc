'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
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

  // Ref to track if component is mounted to prevent state updates on unmount
  const mounted = useRef(false);
  // Track if we're handling initialSession to prevent duplicate fetchProfile calls
  const handlingInitialSession = useRef(false);
  const profileFetchedForInitialSession = useRef(false);

  const mapProfileRow = (row: UserProfileRow): UserProfile => {
    const plan: 'free' | 'pro' = (row.role === 'admin' || row.plan?.toLowerCase() === 'pro') ? 'pro' : 'free';
    const mapped: UserProfile = {
      id: row.user_id,
      username: row.username,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      role: row.role ?? null,
      plan,
    };
    return mapped;
  };

  const fetchProfile = React.useCallback(
    async (userId: string | undefined | null, skipAuthCheck = false) => {
      if (!userId) {
        if (mounted.current) setProfile(null);
        return;
      }

      try {
        // Execute query with timeout
        const queryPromise = supabase
          .from('user_profile')
          .select('user_id, username, display_name, avatar_url, role, plan')
          .eq('user_id', userId)
          .maybeSingle();
        
        const timeoutPromise = new Promise<{ data: null; error: { message: string; code: string } }>((resolve) => 
          setTimeout(() => resolve({ 
            data: null, 
            error: { message: 'Profile query timeout after 10 seconds', code: 'TIMEOUT' } 
          }), 10000)
        );
        
        let data, error;
        try {
          const result = await Promise.race([queryPromise, timeoutPromise]);
          data = result.data;
          error = result.error;
        } catch (catchError: any) {
          console.error('[AUTH] Query exception:', catchError);
          error = { message: catchError.message || 'Unknown error', code: catchError.code || 'EXCEPTION' };
          data = null;
        }

        if (!mounted.current) {
          console.log('[AUTH] Component unmounted, skipping profile update');
          return;
        }

        if (error) {
          console.error('[AUTH] Error loading user profile:', error);
          // If we fail to fetch profile, we treat it as no profile data but user is logged in
          // This might result in restricted access, which is safer than blocking indefinitely
          setProfile(null);
          return;
        }

        if (data) {
          const mappedProfile = mapProfileRow(data);
          setProfile(mappedProfile);
        } else {
          setProfile(null);
        }
      } catch (e) {
        console.error('[AUTH] Unexpected error fetching profile:', e);
        if (mounted.current) setProfile(null);
      }
    },
    []
  );

  const refreshProfile = React.useCallback(async () => {
    await fetchProfile(user?.id ?? null);
  }, [fetchProfile, user?.id]);

  // Handle initialization and auth state changes
  useEffect(() => {
    mounted.current = true;

    const initializeAuth = async () => {
      // If we have an initial session (SSR), we just need to fetch the profile
      if (initialSession) {
        handlingInitialSession.current = true;
        
        // The browser client should read cookies automatically, but we set the session
        // and wait for it to be ready before querying to ensure RLS policies work
        try {
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: initialSession.access_token,
            refresh_token: initialSession.refresh_token || '',
          });
          
          if (setSessionError) {
            console.error('[AUTH] Error setting session:', setSessionError);
          } else {
            // Wait for session to be available - poll until it's ready (max 1.5 seconds)
            // This ensures the session is ready before we try to query
            let sessionReady = false;
            const maxWait = 1500; // 1.5 seconds max
            const pollInterval = 100; // Check every 100ms
            const maxAttempts = maxWait / pollInterval;
            
            for (let i = 0; i < maxAttempts; i++) {
              const { data: { session } } = await supabase.auth.getSession();
              if (session?.access_token) {
                sessionReady = true;
                break;
              }
              if (i < maxAttempts - 1) {
                await new Promise(resolve => setTimeout(resolve, pollInterval));
              }
            }
            
            if (!sessionReady) {
              console.warn('[AUTH] Session not ready after', maxWait, 'ms, proceeding anyway');
            }
          }
        } catch (setSessionErr: any) {
          console.error('[AUTH] Exception setting session:', setSessionErr);
        }
        
        if (initialSession.user?.id) {
          // Skip auth check since we have the user ID from SSR and session should be ready
          await fetchProfile(initialSession.user.id, true);
          profileFetchedForInitialSession.current = true;
        }
        
        handlingInitialSession.current = false;
        
        if (mounted.current) {
          setLoading(false);
        }
        return;
      }

      // No initial session, verify client-side
      try {
        // Use getUser() as recommended by Supabase/Vercel for security
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();

        if (userError || !authUser) {
          // No valid user found
          if (mounted.current) {
            setSession(null);
            setUser(null);
            setProfile(null);
          }
        } else {
          // User is valid, get the session
          const { data: { session: authSession } } = await supabase.auth.getSession();

          if (mounted.current) {
            setSession(authSession);
            setUser(authUser);
            await fetchProfile(authUser.id);
          }
        }
      } catch (error) {
        console.error('[AUTH] Auth initialization error:', error);
        if (mounted.current) {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (mounted.current) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        // Ignore INITIAL_SESSION if we already have an initialSession prop
        if (event === 'INITIAL_SESSION' && initialSession) {
          return;
        }

        // If we have initialSession and this is SIGNED_IN, we've already handled it or are handling it
        // Don't fetch profile again to avoid duplicate calls
        if (event === 'SIGNED_IN' && initialSession && newSession?.user?.id === initialSession.user?.id) {
          if (handlingInitialSession.current || profileFetchedForInitialSession.current) {
            // Still update state but don't fetch profile again
            if (mounted.current) {
              setSession(newSession);
              setUser(newSession?.user ?? null);
            }
            return;
          }
        }

        // If component unmounted, stop
        if (!mounted.current) {
          return;
        }

        // For other events (SIGNED_OUT, TOKEN_REFRESHED, or SIGNED_IN for different user), update state
        // We set loading to true to prevent UI flicker while fetching profile
        setLoading(true);

        try {
          setSession(newSession);
          setUser(newSession?.user ?? null);

          if (newSession?.user?.id) {
            await fetchProfile(newSession.user.id);
          } else {
            setProfile(null);
          }
        } catch (error) {
          console.error('[AUTH] Error handling auth change:', error);
        } finally {
          if (mounted.current) {
            setLoading(false);
          }
        }
      }
    );

    return () => {
      mounted.current = false;
      subscription.unsubscribe();
    };
  }, [initialSession, fetchProfile]);

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

    // Create user profile logic handled by server-side callback/route or here if needed
    // The previous server-side fix handles duplicate insertion protection
    // We can optimistically create here if needed, but redundant with callback

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
    if (mounted.current) {
      setSession(null);
      setUser(null);
      setProfile(null);
      setShowLogoutModal(true);
    }

    // 2. Call Server Action to clear cookies and redirect
    try {
      await signOutAction();
    } catch (e) {
      console.error('Sign out action failed:', e);
    }

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
