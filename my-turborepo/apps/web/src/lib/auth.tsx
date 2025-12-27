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
  console.log('[AUTH] AuthProvider rendering, initialSession:', {
    hasInitialSession: !!initialSession,
    hasUser: !!initialSession?.user,
    userId: initialSession?.user?.id
  });

  const [user, setUser] = useState<User | null>(initialSession?.user ?? null);
  const [session, setSession] = useState<Session | null>(initialSession);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(!initialSession);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  console.log('[AUTH] AuthProvider initial state:', {
    hasUser: !!user,
    userId: user?.id,
    hasSession: !!session,
    hasProfile: !!profile,
    profilePlan: profile?.plan,
    loading
  });

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
    console.log('[AUTH] mapProfileRow input:', { 
      user_id: row.user_id, 
      role: row.role, 
      plan: row.plan 
    });
    console.log('[AUTH] mapProfileRow output:', { 
      id: mapped.id, 
      role: mapped.role, 
      plan: mapped.plan 
    });
    return mapped;
  };

  const fetchProfile = React.useCallback(
    async (userId: string | undefined | null, skipAuthCheck = false) => {
      console.log('[AUTH] fetchProfile called with userId:', userId, 'skipAuthCheck:', skipAuthCheck);
      
      if (!userId) {
        console.log('[AUTH] No userId provided, setting profile to null');
        if (mounted.current) setProfile(null);
        return;
      }

      try {
        console.log('[AUTH] Fetching profile from user_profile table for userId:', userId);
        
        // Skip auth checks if we're using initialSession (session might not be set yet on client)
        if (!skipAuthCheck) {
          console.log('[AUTH] About to check auth state...');
          
          // Check auth state before query - with timeout
          let authUser, authError;
          try {
            const authCheckPromise = supabase.auth.getUser();
            const authTimeoutPromise = new Promise<{ data: { user: null }; error: { message: string; code: string } }>((resolve) => 
              setTimeout(() => resolve({ 
                data: { user: null }, 
                error: { message: 'Auth check timeout after 5 seconds', code: 'AUTH_TIMEOUT' } 
              }), 5000)
            );
            
            const authResult = await Promise.race([authCheckPromise, authTimeoutPromise]);
            authUser = authResult.data?.user;
            authError = authResult.error;
          } catch (authCatchError: any) {
            console.error('[AUTH] Auth check exception:', authCatchError);
            authError = { message: authCatchError.message || 'Auth check failed', code: 'AUTH_EXCEPTION' };
            authUser = null;
          }
          
          console.log('[AUTH] Current auth state:', {
            hasUser: !!authUser,
            userId: authUser?.id,
            matchesRequested: authUser?.id === userId,
            authError: authError ? { message: authError.message, code: authError.code } : null
          });
        } else {
          console.log('[AUTH] Skipping auth check (using initialSession)');
        }
        
        const queryStart = Date.now();
        console.log('[AUTH] Starting Supabase query at:', queryStart);
        console.log('[AUTH] Query details:', {
          table: 'user_profile',
          select: 'user_id, username, display_name, avatar_url, role, plan',
          filter: `user_id = ${userId}`
        });
        
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
          console.log('[AUTH] Executing Promise.race for query...');
          const result = await Promise.race([queryPromise, timeoutPromise]);
          console.log('[AUTH] Promise.race completed, result:', { hasData: !!result.data, hasError: !!result.error });
          data = result.data;
          error = result.error;
        } catch (catchError: any) {
          console.error('[AUTH] Query exception:', catchError);
          error = { message: catchError.message || 'Unknown error', code: catchError.code || 'EXCEPTION' };
          data = null;
        }

        const queryDuration = Date.now() - queryStart;
        console.log('[AUTH] Supabase query completed in', queryDuration, 'ms');
        console.log('[AUTH] Profile fetch response:', { 
          hasData: !!data, 
          data: data ? { 
            user_id: data.user_id, 
            username: data.username, 
            role: data.role, 
            plan: data.plan 
          } : null,
          error: error ? { 
            message: error.message, 
            code: error.code, 
            details: (error as any).details,
            hint: (error as any).hint
          } : null
        });

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
          console.log('[AUTH] Mapped profile:', { 
            id: mappedProfile.id, 
            username: mappedProfile.username, 
            role: mappedProfile.role, 
            plan: mappedProfile.plan 
          });
          setProfile(mappedProfile);
        } else {
          console.log('[AUTH] No profile data found, setting profile to null');
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
      console.log('[AUTH] initializeAuth called, initialSession:', !!initialSession);
      
      // If we have an initial session (SSR), we just need to fetch the profile
      if (initialSession) {
        handlingInitialSession.current = true;
        console.log('[AUTH] Using initialSession from SSR, user ID:', initialSession.user?.id);
        
        // The browser client should read cookies automatically, but let's set the session
        // and wait for it to be ready before querying
        try {
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: initialSession.access_token,
            refresh_token: initialSession.refresh_token || '',
          });
          
          if (setSessionError) {
            console.error('[AUTH] Error setting session:', setSessionError);
          } else {
            console.log('[AUTH] Session set, waiting for it to be ready...');
            
            // Wait for session to be available - poll until it's ready (max 1.5 seconds)
            // This ensures the session is ready before we try to query
            let sessionReady = false;
            const maxWait = 1500; // 1.5 seconds max
            const pollInterval = 100; // Check every 100ms
            const maxAttempts = maxWait / pollInterval;
            
            for (let i = 0; i < maxAttempts; i++) {
              const { data: { session } } = await supabase.auth.getSession();
              if (session?.access_token) {
                console.log('[AUTH] Session ready after', (i + 1) * pollInterval, 'ms');
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
          console.log('[AUTH] Calling fetchProfile with initialSession user ID (skipping auth check)');
          // Skip auth check since we have the user ID from SSR and session should be ready
          await fetchProfile(initialSession.user.id, true);
          profileFetchedForInitialSession.current = true;
        } else {
          console.warn('[AUTH] initialSession has no user.id');
        }
        
        handlingInitialSession.current = false;
        
        if (mounted.current) {
          console.log('[AUTH] Setting loading to false (initialSession path)');
          setLoading(false);
        }
        return;
      }

      // No initial session, verify client-side
      console.log('[AUTH] No initialSession, verifying client-side');
      try {
        // Use getUser() as recommended by Supabase/Vercel for security
        console.log('[AUTH] Calling supabase.auth.getUser()');
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();

        console.log('[AUTH] getUser() response:', { 
          hasUser: !!authUser, 
          userId: authUser?.id, 
          error: userError ? { message: userError.message, code: userError.code } : null 
        });

        if (userError || !authUser) {
          console.log('[AUTH] No valid user found, clearing auth state');
          // No valid user found
          if (mounted.current) {
            setSession(null);
            setUser(null);
            setProfile(null);
          }
        } else {
          console.log('[AUTH] User found, getting session and fetching profile');
          // User is valid, get the session
          const { data: { session: authSession } } = await supabase.auth.getSession();

          console.log('[AUTH] getSession() response:', { hasSession: !!authSession });

          if (mounted.current) {
            setSession(authSession);
            setUser(authUser);
            console.log('[AUTH] Calling fetchProfile with authUser.id:', authUser.id);
            await fetchProfile(authUser.id);
          } else {
            console.log('[AUTH] Component unmounted before setting state');
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
          console.log('[AUTH] Setting loading to false (client-side path)');
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('[AUTH] onAuthStateChange event:', event, 'hasSession:', !!newSession, 'userId:', newSession?.user?.id);
        
        // Ignore INITIAL_SESSION if we already have an initialSession prop
        // or if we are handling it in initializeAuth
        if (event === 'INITIAL_SESSION' && initialSession) {
          console.log('[AUTH] Ignoring INITIAL_SESSION because initialSession prop exists');
          return;
        }

        // If we have initialSession and this is SIGNED_IN, we've already handled it or are handling it
        // Don't fetch profile again to avoid duplicate calls
        if (event === 'SIGNED_IN' && initialSession && newSession?.user?.id === initialSession.user?.id) {
          if (handlingInitialSession.current || profileFetchedForInitialSession.current) {
            console.log('[AUTH] Ignoring SIGNED_IN event - already handled via initialSession');
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
          console.log('[AUTH] Component unmounted, ignoring auth state change');
          return;
        }

        // For other events (SIGNED_OUT, TOKEN_REFRESHED, or SIGNED_IN for different user), update state
        // We set loading to true to prevent UI flicker while fetching profile
        console.log('[AUTH] Processing auth state change, setting loading to true');
        setLoading(true);

        try {
          setSession(newSession);
          setUser(newSession?.user ?? null);

          if (newSession?.user?.id) {
            console.log('[AUTH] Calling fetchProfile from auth state change, userId:', newSession.user.id);
            await fetchProfile(newSession.user.id);
          } else {
            console.log('[AUTH] No user in newSession, setting profile to null');
            setProfile(null);
          }
        } catch (error) {
          console.error('[AUTH] Error handling auth change:', error);
        } finally {
          if (mounted.current) {
            console.log('[AUTH] Auth state change complete, setting loading to false');
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

  // Log whenever profile changes
  useEffect(() => {
    console.log('[AUTH] Profile state updated:', {
      hasProfile: !!profile,
      profilePlan: profile?.plan,
      profileRole: profile?.role,
      profileId: profile?.id,
      hasUser: !!user,
      userId: user?.id,
      loading
    });
  }, [profile, user, loading]);

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
