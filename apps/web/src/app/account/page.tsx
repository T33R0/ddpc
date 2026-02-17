'use client';

import { useAuth } from '../../lib/auth';
import { useTheme } from '../../lib/theme-context';
import { Button } from '@repo/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card';
import { Pricing, PRICING_PLANS } from '@/components/landing';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui/label';
import { Textarea } from '@repo/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@repo/ui/toggle-group';
import { Switch } from '@repo/ui/switch';
import { AuthModal } from '@/components/auth/auth-modal';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  User,
  Mail,
  Calendar,
  Shield,
  ArrowLeft,
  CreditCard,
  Image as ImageIcon,
  Settings,
  Crown,
  Eye,
  EyeOff,
  Palette,
  Check,
  Wrench,
  Plus,
  Loader2,
  Sparkles,
  X
} from 'lucide-react';
import { User as UserType, SkillLevel, UserTool } from '@repo/types';
import { createClient } from '@/lib/supabase/client';
import { stripUsernamePrefixFromPathname, toUsernameSlug } from '../../lib/user-routing';

type TabType = 'profile' | 'security' | 'billing' | 'account' | 'theme' | 'workshop';

export default function AccountPage() {
  const { user: authUser, signOut, loading, session, signUp, signIn, signInWithGoogle, refreshProfile } = useAuth();
  const { theme, setTheme, saveTheme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [isUpdated, setIsUpdated] = useState(false);

  // Polling state
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // Profile form state
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [notifyOnNewUser, setNotifyOnNewUser] = useState(false);
  const [notifyOnIssueReport, setNotifyOnIssueReport] = useState(false);

  // Email Preferences State
  const [emailChannels, setEmailChannels] = useState<any[]>([]);
  const [userPreferences, setUserPreferences] = useState<Record<string, boolean>>({});

  // Security form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Workshop Preferences State
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('beginner');
  const [toolInventory, setToolInventory] = useState<UserTool[]>([]);
  const [newToolName, setNewToolName] = useState('');
  const [isLoadingWorkshop, setIsLoadingWorkshop] = useState(false);
  const [isSuggestingTools, setIsSuggestingTools] = useState(false);

  const fetchEmailPreferences = useCallback(async () => {
    if (!session?.access_token) return;

    try {
      const supabase = createClient();
      // Fetch active channels
      const { data: channels, error: channelsError } = await supabase
        .from('email_channels')
        .select('*')
        .eq('is_active', true);

      if (channelsError) throw channelsError;
      setEmailChannels(channels || []);

      // Fetch user preferences
      const { data: preferences, error: prefError } = await supabase
        .from('user_email_preferences')
        .select('*')
        .eq('user_id', authUser?.id);

      if (prefError) throw prefError;

      // Map preferences for easy lookup
      const prefMap: Record<string, boolean> = {};
      preferences?.forEach((p: any) => {
        prefMap[p.channel_id] = p.is_subscribed;
      });
      setUserPreferences(prefMap);

    } catch (error) {
      console.error('Error fetching email preferences:', error);
      // Don't block the UI, just log error
    }
  }, [session?.access_token, authUser?.id]);

  const fetchUserProfile = useCallback(async (retry = true) => {
    if (!session?.access_token) return;

    try {
      const response = await fetch('/api/account/profile', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        // Populate form fields
        setUsername(data.user.username || '');
        setDisplayName(data.user.displayName || '');
        setLocation(data.user.location || '');
        setWebsite(data.user.website || '');
        setBio(data.user.bio || '');
        setAvatarUrl(data.user.avatarUrl || '');
        setIsPublic(data.user.isPublic);
        setNotifyOnNewUser(data.user.notifyOnNewUser || false);
        setNotifyOnIssueReport(data.user.notifyOnIssueReport || false);

        // Fetch specific email preferences
        fetchEmailPreferences();

        return data.user;
      } else if (response.status === 401 && retry) {
        // Attempt to refresh session and retry once
        const supabase = createClient();
        const { data: { session: newSession }, error } = await supabase.auth.refreshSession();
        if (error || !newSession?.access_token) {
          console.error('Session refresh failed:', error);
          toast.error('Session expired, please sign in again');
          signOut();
          return null;
        }

        // Retry the fetch with new token
        const retryResponse = await fetch('/api/account/profile', {
          headers: {
            'Authorization': `Bearer ${newSession.access_token}`,
          },
        });

        if (retryResponse.ok) {
          const data = await retryResponse.json();
          setUser(data.user);
          // Populate form fields
          setUsername(data.user.username || '');
          setDisplayName(data.user.displayName || '');
          setLocation(data.user.location || '');
          setWebsite(data.user.website || '');
          setBio(data.user.bio || '');
          setAvatarUrl(data.user.avatarUrl || '');
          setIsPublic(data.user.isPublic);
          setNotifyOnNewUser(data.user.notifyOnNewUser || false);
          setNotifyOnIssueReport(data.user.notifyOnIssueReport || false);

          fetchEmailPreferences();

          return data.user;
        } else {
          const errorData = await retryResponse.json().catch(() => ({}));
          console.error('Profile fetch retry failed:', errorData);
          toast.error('Failed to load profile data');
          return null;
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Profile fetch failed:', errorData);
        toast.error('Failed to load profile data');
        return null;
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile data');
      return null;
    }
  }, [session?.access_token, signOut, fetchEmailPreferences]);

  // Initial load
  useEffect(() => {
    if (!loading && !authUser) {
      // Don't redirect, let the component handle unauthorized access
      return;
    }
    if (authUser && session?.access_token) {
      fetchUserProfile();
      // Fetch workshop preferences
      const supabase = createClient();
      supabase
        .from('user_preferences')
        .select('skill_level, tool_inventory')
        .eq('user_id', authUser.id)
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            if (data.skill_level) setSkillLevel(data.skill_level as SkillLevel);
            if (data.tool_inventory) setToolInventory(data.tool_inventory);
          }
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser, loading, session?.access_token]);

  // Handle Billing Return & Polling
  useEffect(() => {
    const billingStatus = searchParams?.get('billing_status');

    // Clear polling on unmount
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []); // Run only on mount/unmount for cleanup

  useEffect(() => {
    const billingStatus = searchParams?.get('billing_status');

    if (billingStatus === 'success' && !isPolling && session?.access_token) {
      setIsPolling(true);
      setActiveTab('billing');
      const toastId = toast.loading('Finalizing your subscription...');

      let attempts = 0;
      const maxAttempts = 15; // 30 seconds (15 * 2000ms)

      const poll = async () => {
        const updatedUser = await fetchUserProfile(false);
        attempts++;

        if (updatedUser?.plan === 'pro') {
          // Success!
          toast.success('You are now a Pro member!', { id: toastId });
          if (pollingRef.current) clearInterval(pollingRef.current);
          setIsPolling(false);
          router.replace('/account?tab=billing'); // Clear query param
          await refreshProfile(); // Sync global auth context
        } else if (attempts >= maxAttempts) {
          // Timeout
          toast.error('Subscription update taking longer than expected. Please check back later.', { id: toastId });
          if (pollingRef.current) clearInterval(pollingRef.current);
          setIsPolling(false);
          router.replace('/account?tab=billing');
        }
      };

      // Initial check immediately
      poll();

      // Start polling
      pollingRef.current = setInterval(poll, 2000);
    } else if (billingStatus === 'canceled') {
      toast.error('Subscription update canceled');
      router.replace('/account?tab=billing');
    }
  }, [searchParams, router, fetchUserProfile, session?.access_token, isPolling, refreshProfile]);

  // Handle tab from URL
  useEffect(() => {
    const tab = searchParams?.get('tab');
    if (tab && ['profile', 'security', 'billing', 'account', 'theme', 'workshop'].includes(tab)) {
      setActiveTab(tab as TabType);
    }
  }, [searchParams]);



  const handleManageBilling = async () => {
    setIsRedirecting(true);
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error('Failed to redirect to billing portal');
        setIsRedirecting(false);
      }
    } catch (error) {
      console.error('Error redirecting to portal:', error);
      toast.error('Failed to redirect to billing portal');
      setIsRedirecting(false);
    }
  };

  const handleUpgrade = async (priceId: string) => {
    if (!priceId) {
      toast.error('Plan configuration missing');
      return;
    }
    setIsRedirecting(true);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error('Failed to redirect to checkout');
        setIsRedirecting(false);
      }
    } catch (error) {
      console.error('Error redirecting to checkout:', error);
      toast.error('Failed to redirect to checkout');
      setIsRedirecting(false);
    }
  };

  // Handle Upgrade from URL
  useEffect(() => {
    const upgradePlan = searchParams?.get('upgrade');
    const period = searchParams?.get('period');

    if (upgradePlan && !isRedirecting && session?.access_token) {
      let priceId = '';
      if (upgradePlan === 'vanguard') {
        priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_VANGUARD || '';
      } else if (upgradePlan === 'pro') {
        if (period === 'annual') {
          priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_ANNUAL || '';
        } else {
          priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY || '';
        }
      }

      if (priceId) {
        // Clean URL params to prevent loop/re-trigger
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('upgrade');
        newUrl.searchParams.delete('period');
        window.history.replaceState({}, '', newUrl.toString());

        handleUpgrade(priceId);
      }
    }
  }, [searchParams, session?.access_token, isRedirecting, handleUpgrade]);




  const syncAuthMetadata = useCallback(
    async (nextUsername: string, nextDisplayName?: string, nextAvatarUrl?: string) => {
      const normalizedUsername = nextUsername.trim();
      if (!normalizedUsername) {
        return null;
      }

      const usernameSlug = toUsernameSlug(normalizedUsername) ?? normalizedUsername.toLowerCase();

      try {
        const supabase = createClient();
      const { error: metadataError } = await supabase.auth.updateUser({
          data: {
            username: usernameSlug,
            preferred_username: normalizedUsername,
            display_name: nextDisplayName?.trim() || null,
            avatar_url: nextAvatarUrl?.trim() || null,
          },
        });

        if (metadataError) {
          console.error('Error updating auth metadata:', metadataError);
          return usernameSlug;
        }

        await supabase.auth.refreshSession();
        return usernameSlug;
      } catch (metadataException) {
        console.error('Auth metadata sync failed:', metadataException);
        return usernameSlug;
      }
    },
    []
  );

  const updateScopedUrl = useCallback(
    (nextSlug: string | null) => {
      if (!nextSlug || typeof window === 'undefined') {
        return;
      }

      const currentPath = window.location.pathname;
      const { pathname: strippedPathname, stripped } = stripUsernamePrefixFromPathname(currentPath);

      if (!stripped) {
        return;
      }

      const suffix = strippedPathname === '/' ? '' : strippedPathname;
      const nextPath = `/${nextSlug}${suffix}`;

      if (nextPath !== currentPath) {
        router.replace(nextPath);
      }
    },
    [router]
  );

  const handleUpdateProfile = async () => {
    if (!session?.access_token || !user) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          displayName,
          location,
          website,
          bio,
          avatarUrl,
          isPublic,
          notifyOnNewUser,
          notifyOnIssueReport,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        toast.success('Profile updated successfully!');

        setIsUpdated(true);
        setIsLoading(false);
        setTimeout(() => setIsUpdated(false), 2000);

        const syncedSlug = await syncAuthMetadata(username, displayName, avatarUrl);
        updateScopedUrl(syncedSlug);
        await refreshProfile();
      } else {
        toast.error(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!session?.access_token) return;

    if (!newPassword || newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/account/password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(data.error || 'Failed to update password');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferenceToggle = async (channelId: string, newState: boolean) => {
    // Optimistic update — newState comes directly from onCheckedChange
    setUserPreferences(prev => ({ ...prev, [channelId]: newState }));

    if (!session?.access_token || !authUser) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('user_email_preferences')
        .upsert({
          user_id: authUser.id,
          channel_id: channelId,
          is_subscribed: newState,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        throw error;
      }
      toast.success('Preferences updated');
    } catch (error) {
      console.error('Error updating preference:', error);
      toast.error('Failed to update preference');
      // Revert on error
      setUserPreferences(prev => ({ ...prev, [channelId]: !newState }));
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      toast.success('Successfully signed out!');
    } catch {
      toast.error('Error signing out');
      setIsSigningOut(false);
    }
  };

  const handleSignInClick = () => {
    setIsSignUpMode(false);
    setAuthModalOpen(true);
  };

  const handleSignUpClick = () => {
    setIsSignUpMode(true);
    setAuthModalOpen(true);
  };

  const handleGoBack = () => {
    // Try to go back in browser history first
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // If no history, go to home
      router.push('/');
    }
  };

  const handleEmailSignUp = async (email: string, password: string) => {
    const result = await signUp(email, password);
    return result;
  };

  const handleEmailSignIn = async (email: string, password: string) => {
    const result = await signIn(email, password);
    return result;
  };

  const handleGoogleSignIn = async () => {
    await signInWithGoogle();
  };

  if (loading || isSigningOut) {
    return (
      <section className="relative py-12 min-h-screen">
        <div className="relative container px-4 md:px-6 pt-24 flex items-center justify-center min-h-[60vh]">
          <div className="text-foreground text-lg">
            {isSigningOut ? 'Signing out...' : 'Loading...'}
          </div>
        </div>
      </section>
    );
  }

  // Show unauthorized access page for non-authenticated users
  if (!loading && !authUser) {
    return (
      <section className="relative py-12 min-h-screen">
        <div className="relative container px-4 md:px-6 pt-24">
          <div className="max-w-md mx-auto flex items-center justify-center min-h-[60vh]">
            <Card className="w-full">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Access Restricted</CardTitle>
                <CardDescription className="text-muted-foreground">
                  You must be signed in to access this page
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Button
                    onClick={handleSignInClick}
                    className="w-full"
                    size="lg"
                  >
                    Sign In
                  </Button>

                  <Button
                    onClick={handleSignUpClick}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    Create Account
                  </Button>

                  <Button
                    onClick={handleGoBack}
                    variant="ghost"
                    className="w-full text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    Go Back
                  </Button>
                </div>

                <div className="text-center text-sm text-muted-foreground mt-6">
                  <p>Manage your profile, security settings, and account preferences</p>
                </div>
              </CardContent>
            </Card>

            {/* Auth Modal */}
            <AuthModal
              open={authModalOpen}
              onOpenChange={setAuthModalOpen}
              onGoogleSignIn={handleGoogleSignIn}
              onEmailSignUp={handleEmailSignUp}
              onEmailSignIn={handleEmailSignIn}
              initialMode={isSignUpMode ? 'signup' : 'signin'}
            />
          </div>
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="relative py-12 min-h-screen">
        <div className="relative container px-4 md:px-6 pt-24 flex items-center justify-center min-h-[60vh]">
          <div className="text-foreground text-lg">Loading profile...</div>
        </div>
      </section>
    );
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'free': return 'text-muted-foreground';
      case 'pro': return 'text-warning';
      default: return 'text-muted-foreground';
    }
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'free': return '🧱'; // Foundation/Maintainer
      case 'pro': return '🔧';
      default: return '🧱';
    }
  };

  return (
    <>
      <section className="relative py-12 min-h-screen">

        <div className="relative container px-4 md:px-6 pt-24 max-w-4xl mx-auto">
          <div className="mb-8">
            <Button
              onClick={() => router.push('/hub')}
              variant="ghost"
              className="mb-4 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Hub
            </Button>
            <h1 className="text-4xl font-bold text-foreground mb-2">Account Management</h1>
            <p className="text-lg text-muted-foreground">Manage your account settings and preferences</p>

            {/* Member info bar */}
            <div className="mt-4 p-4 bg-card border border-border rounded-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Member since: {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Crown className={`h-4 w-4 ${getPlanColor(user.plan)}`} />
                    <span className={`text-sm font-medium ${getPlanColor(user.plan)}`}>
                      {getPlanIcon(user.plan)} {user.plan === 'pro' ? 'Pro' : 'Maintainer'} Plan
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Email confirmed
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <ToggleGroup
              type="single"
              value={activeTab}
              onValueChange={(value) => value && setActiveTab(value as TabType)}
              className="justify-start"
            >
              <ToggleGroupItem value="profile" className="data-[state=on]:bg-accent data-[state=on]:text-accent-foreground hover:bg-muted">
                <User className="h-4 w-4 mr-2" />
                Profile
              </ToggleGroupItem>
              <ToggleGroupItem value="security" className="data-[state=on]:bg-accent data-[state=on]:text-accent-foreground hover:bg-muted">
                <Shield className="h-4 w-4 mr-2" />
                Security
              </ToggleGroupItem>
              <ToggleGroupItem value="billing" className="data-[state=on]:bg-accent data-[state=on]:text-accent-foreground hover:bg-muted">
                <CreditCard className="h-4 w-4 mr-2" />
                Billing
              </ToggleGroupItem>
              <ToggleGroupItem value="account" className="data-[state=on]:bg-accent data-[state=on]:text-accent-foreground hover:bg-muted">
                <Settings className="h-4 w-4 mr-2" />
                Account
              </ToggleGroupItem>
              <ToggleGroupItem value="theme" className="data-[state=on]:bg-accent data-[state=on]:text-accent-foreground hover:bg-muted">
                <Palette className="h-4 w-4 mr-2" />
                Theme
              </ToggleGroupItem>
              <ToggleGroupItem value="workshop" className="data-[state=on]:bg-accent data-[state=on]:text-accent-foreground hover:bg-muted">
                <Wrench className="h-4 w-4 mr-2" />
                Workshop
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile Information - Left Column */}
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Profile Information
                      </CardTitle>
                      <CardDescription>
                        Update your public profile information
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="username" className="text-foreground">Username *</Label>
                        <Input
                          id="username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="bg-background backdrop-blur-sm border-border text-foreground placeholder-muted-foreground focus:border-accent px-3 py-2"
                          placeholder="your_username"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="displayName" className="text-foreground">Display Name</Label>
                        <Input
                          id="displayName"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="bg-background backdrop-blur-sm border-border text-foreground placeholder-muted-foreground focus:border-accent px-3 py-2"
                          placeholder="Your Display Name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="location" className="text-foreground">Location</Label>
                        <Input
                          id="location"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="bg-background backdrop-blur-sm border-border text-foreground placeholder-muted-foreground focus:border-accent px-3 py-2"
                          placeholder="City, Country"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="website" className="text-foreground">Website</Label>
                        <Input
                          id="website"
                          type="url"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          className="bg-background backdrop-blur-sm border-border text-foreground placeholder-muted-foreground focus:border-accent px-3 py-2"
                          placeholder="https://yourwebsite.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bio" className="text-foreground">Bio</Label>
                        <Textarea
                          id="bio"
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          className="bg-background backdrop-blur-sm border-border text-foreground placeholder-muted-foreground focus:border-accent px-3 py-2"
                          placeholder="Tell us about yourself..."
                          rows={3}
                        />
                      </div>

                      <Button
                        onClick={handleUpdateProfile}
                        disabled={isLoading || isUpdated}
                        className="w-full"
                      >
                        {isLoading ? 'Updating...' : isUpdated ? 'Updated' : 'Update Profile'}
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - Avatar & Privacy + Email Preferences */}
                <div className="space-y-6">
                  {/* Avatar & Privacy Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" />
                        Avatar & Privacy
                      </CardTitle>
                      <CardDescription>
                        Manage your profile picture and privacy settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="avatarUrl" className="text-foreground">Avatar URL</Label>
                        <Input
                          id="avatarUrl"
                          type="url"
                          value={avatarUrl}
                          onChange={(e) => setAvatarUrl(e.target.value)}
                          className="bg-background backdrop-blur-sm border-border text-foreground placeholder-muted-foreground focus:border-accent px-3 py-2"
                          placeholder="https://example.com/avatar.jpg"
                        />
                      </div>

                      {avatarUrl && (
                        <div className="flex justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={avatarUrl}
                            alt="Avatar preview"
                            className="w-20 h-20 rounded-full object-cover border-2 border-border"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="isPublic"
                          checked={isPublic}
                          onChange={(e) => setIsPublic(e.target.checked)}
                          className="w-4 h-4 rounded border-border bg-background text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
                        />
                        <Label htmlFor="isPublic" className="text-sm text-foreground">
                          Make profile public
                        </Label>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {isPublic ? (
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            Your profile is visible to other users
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <EyeOff className="h-3 w-3" />
                            Your profile is private
                          </div>
                        )}
                      </div>

                      <div className="pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => window.open(`/u/${username}`, '_blank')}
                        >
                          View Public Profile
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Email Preferences - Always visible, content depends on role */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Email Preferences
                      </CardTitle>
                      <CardDescription>
                        Manage your email notification settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Dynamic Channels (Available to all users) */}
                      {emailChannels.map((channel) => (
                        <div key={channel.id} className="flex items-center justify-between space-x-2">
                          <Label htmlFor={`channel-${channel.id}`} className="flex flex-col space-y-1">
                            <span>{channel.name}</span>
                            <span className="font-normal text-xs text-muted-foreground">
                              {channel.description}
                            </span>
                          </Label>
                          <Switch
                            id={`channel-${channel.id}`}
                            checked={userPreferences[channel.id] ?? true} // Default to true
                            onCheckedChange={(checked) => handlePreferenceToggle(channel.id, checked)}
                          />
                        </div>
                      ))}

                      {emailChannels.length === 0 && (
                        <div className="text-sm text-muted-foreground text-center py-2">
                          No active email subscriptions available.
                        </div>
                      )}

                      {/* Admin Only Notifications */}
                      {user.role === 'admin' && (
                        <>
                          <div className="border-t border-border my-4 pt-4">
                            <h4 className="text-sm font-medium mb-3">Admin Notifications</h4>
                            <div className="space-y-4">
                              <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="notifyOnNewUser" className="flex flex-col space-y-1">
                                  <span>New User Signup</span>
                                  <span className="font-normal text-xs text-muted-foreground">
                                    Receive an email when a new user creates an account
                                  </span>
                                </Label>
                                <Switch
                                  id="notifyOnNewUser"
                                  checked={notifyOnNewUser}
                                  onCheckedChange={setNotifyOnNewUser}
                                />
                              </div>
                              <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="notifyOnIssueReport" className="flex flex-col space-y-1">
                                  <span>New Issue Report</span>
                                  <span className="font-normal text-xs text-muted-foreground">
                                    Receive an email when a user reports an issue
                                  </span>
                                </Label>
                                <Switch
                                  id="notifyOnIssueReport"
                                  checked={notifyOnIssueReport}
                                  onCheckedChange={setNotifyOnIssueReport}
                                />
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      <div className="pt-4">
                        <Button
                          onClick={handleUpdateProfile}
                          disabled={isLoading || isUpdated}
                          className="w-full"
                        >
                          {isLoading ? 'Updating...' : isUpdated ? 'Saved' : 'Save Preferences'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <Card className="max-w-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security Settings
                  </CardTitle>
                  <CardDescription>
                    Update your password and security preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="text-foreground">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="bg-background backdrop-blur-sm border-border text-foreground placeholder-muted-foreground focus:border-accent px-3 py-2"
                      placeholder="Enter your current password"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-foreground">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-background backdrop-blur-sm border-border text-foreground placeholder-muted-foreground focus:border-accent px-3 py-2"
                      placeholder="Enter your new password"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-foreground">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-background backdrop-blur-sm border-border text-foreground placeholder-muted-foreground focus:border-accent px-3 py-2"
                      placeholder="Confirm your new password"
                    />
                  </div>

                  <Button
                    onClick={handleUpdatePassword}
                    disabled={isLoading || !newPassword || !confirmPassword || !currentPassword}
                    className="w-full"
                  >
                    {isLoading ? 'Updating Password...' : 'Update Password'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Billing Tab */}
            {/* Billing Tab */}
            {activeTab === 'billing' && (
              <div className="space-y-8">
                {/* Current Plan Section */}
                {(() => {
                  const currentPlanId = user.plan === 'free' ? 'driver' : user.plan;
                  const currentPlan = PRICING_PLANS.find(p => p.id === currentPlanId) || PRICING_PLANS[0]!;
                  // Resolve dynamic values with default 'annual' false or maybe true? Just use base values.
                  // For "Current Plan" display, maybe show what they are actually on? 
                  // But we don't track annual/monthly in user object here cleanly yet (stripe logic hidden).
                  // Just use default string or function(false).
                  const price = typeof currentPlan.price === 'function' ? currentPlan.price(false) : currentPlan.price;
                  const period = typeof currentPlan.period === 'function' ? currentPlan.period(false) : currentPlan.period;

                  return (
                    <Card className="overflow-hidden border-2 border-primary/20 bg-card/50 backdrop-blur-sm">
                      <CardHeader className="bg-muted/30 border-b border-border/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CardTitle className="flex items-center gap-2 text-2xl">
                              <span className="text-3xl">{getPlanIcon(user.plan)}</span>
                              Your Plan: {currentPlan.name}
                            </CardTitle>
                            {user.plan !== 'free' && (
                              <span className="px-3 py-1 rounded-full bg-success/10 text-success text-xs font-bold uppercase tracking-wider border border-success/20">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold">{price}</div>
                            <div className="text-xs text-muted-foreground">/ {period}</div>
                          </div>
                        </div>
                        <CardDescription className="text-base mt-2">
                          {currentPlan.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold mb-4 flex items-center gap-2">
                              <span className="p-1 rounded bg-primary/10 text-primary">✓</span> Included Features
                            </h4>
                            <ul className="space-y-3">
                              {currentPlan.features.map((feature, idx) => (
                                <li key={idx} className="flex items-start gap-3 text-sm text-muted-foreground">
                                  <Check className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="flex flex-col justify-center items-center p-6 bg-muted/20 rounded-xl border border-border/50">
                            {user.plan === 'free' ? (
                              <p className="text-center text-muted-foreground mb-4">
                                You are on the free plan. Upgrade to unlock more power.
                              </p>
                            ) : (
                              <>
                                <p className="text-center text-muted-foreground mb-4">
                                  Your subscription is active. You can manage your billing details, payment methods, and invoices in the Stripe Portal.
                                </p>
                                <Button
                                  onClick={handleManageBilling}
                                  variant="outline"
                                  className="w-full sm:w-auto"
                                  disabled={isRedirecting}
                                >
                                  {isRedirecting ? 'Redirecting...' : 'Manage Billing & Invoices'}
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}

                {/* Upgrade Options Section */}
                <div>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="text-primary">⚡</span> Upgrade Options
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {PRICING_PLANS.filter(plan => {
                      const currentPlanId = user.plan === 'free' ? 'driver' : user.plan;
                      // Simple hierarchy check: driver < pro < vanguard
                      const levels = ['driver', 'pro', 'vanguard'];
                      const currentIdx = levels.indexOf(currentPlanId);
                      const planIdx = levels.indexOf(plan.id);
                      return planIdx > currentIdx;
                    }).map(plan => {
                      const price = typeof plan.price === 'function' ? plan.price(false) : plan.price;
                      const period = typeof plan.period === 'function' ? plan.period(false) : plan.period;

                      return (
                        <Card key={plan.id} className={`relative overflow-hidden transition-all hover:border-primary/50 ${plan.premium ? 'border-warning/30 bg-warning/5' : ''}`}>
                          {plan.premium && (
                            <div className="absolute top-0 right-0 bg-warning text-foreground text-xs font-bold px-3 py-1 rounded-bl-xl">
                              LIMITED
                            </div>
                          )}
                          <CardHeader>
                            <CardTitle className={`flex justify-between items-start ${plan.premium ? 'text-warning' : ''}`}>
                              <span>{plan.name}</span>
                              <div className="text-right">
                                <span className="text-lg">{price}</span>
                                <span className="text-xs font-normal text-muted-foreground block">/ {period}</span>
                              </div>
                            </CardTitle>
                            <CardDescription>{plan.description}</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            <ul className="space-y-2">
                              {plan.features.slice(0, 4).map((f, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                  <Check className={`w-3 h-3 mt-0.5 ${plan.premium ? 'text-warning' : 'text-primary'}`} />
                                  <span className="line-clamp-1">{f}</span>
                                </li>
                              ))}
                              {plan.features.length > 4 && (
                                <li className="text-xs text-muted-foreground pl-5 italic">
                                  + {plan.features.length - 4} more features
                                </li>
                              )}
                            </ul>

                            <Button
                              className={`w-full ${plan.premium ? 'bg-warning hover:bg-warning/90 text-warning-foreground' : ''}`}
                              disabled={plan.disabled || isRedirecting}
                              onClick={() => {
                                if (plan.id === 'vanguard') {
                                  // Assume env var is available or we need to find it
                                  handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_VANGUARD || '');
                                } else if (plan.id === 'pro') {
                                  handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY || '');
                                }
                              }}
                            >
                              {plan.disabled ? plan.cta : `Upgrade to ${plan.name}`}
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                    {PRICING_PLANS.filter(plan => {
                      const currentPlanId = user.plan === 'free' ? 'driver' : user.plan;
                      const levels = ['driver', 'pro', 'vanguard'];
                      return levels.indexOf(plan.id) > levels.indexOf(currentPlanId);
                    }).length === 0 && (
                        <div className="col-span-2 text-center py-12 bg-muted/10 rounded-xl border border-dashed border-border">
                          <p className="text-muted-foreground">You have access to all available plans!</p>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            )}

            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Account Settings
                    </CardTitle>
                    <CardDescription>
                      Manage your account preferences and data
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div
                        className="p-4 bg-card backdrop-blur-sm rounded-lg border border-border"
                      >
                        <h4 className="font-medium mb-2 text-foreground">Account Information</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">User ID:</span>
                            <span className="font-mono text-xs text-foreground">{user.id.slice(0, 8)}...</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Email:</span>
                            <span className="text-foreground">{user.email}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Role:</span>
                            <span className="capitalize text-foreground">{user.role}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Status:</span>
                            <span className={user.banned ? 'text-destructive' : 'text-success'}>
                              {user.banned ? 'Banned' : 'Active'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div
                        className="p-4 bg-card backdrop-blur-sm rounded-lg border border-border"
                      >
                        <h4 className="font-medium mb-2 text-foreground">Privacy Settings</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Profile Visibility:</span>
                            <span className="text-foreground">{isPublic ? 'Public' : 'Private'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Last Updated:</span>
                            <span className="text-foreground">{new Date(user.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="bg-card backdrop-blur-lg rounded-2xl text-foreground border border-border"
                >
                  <CardHeader>
                    <CardTitle className="text-foreground">Account Actions</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Manage your account status and data
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4 flex-wrap">
                      <Button
                        onClick={handleSignOut}
                        disabled={isSigningOut}
                        variant="outline"
                        className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        {isSigningOut ? 'Signing Out...' : 'Sign Out'}
                      </Button>

                      <Button variant="outline" disabled>
                        Export Data
                      </Button>

                      <Button variant="outline" disabled className="border-destructive text-destructive">
                        Delete Account
                      </Button>
                    </div>

                    <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <h4 className="font-medium text-destructive mb-2">Danger Zone</h4>
                      <p className="text-sm text-muted-foreground">
                        Account deletion and data export features are coming soon. These actions cannot be undone.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Theme Tab */}
            {activeTab === 'theme' && (
              <Card className="max-w-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Theme Preferences
                  </CardTitle>
                  <CardDescription>
                    Choose your preferred color theme for the application
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-colors bg-card border border-border hover:border-accent">
                      <input
                        type="radio"
                        name="theme"
                        value="light"
                        checked={theme === 'light'}
                        onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'auto')}
                        className="w-4 h-4 text-primary bg-background border-border focus:ring-2 focus:ring-primary focus:ring-offset-0"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-foreground">Light</div>
                        <div className="text-sm text-muted-foreground">Use light theme</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-colors bg-card backdrop-blur-sm border border-border hover:border-accent hover:bg-muted/50">
                      <input
                        type="radio"
                        name="theme"
                        value="dark"
                        checked={theme === 'dark'}
                        onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'auto')}
                        className="w-4 h-4 text-primary bg-background border-border focus:ring-2 focus:ring-primary focus:ring-offset-0"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-foreground">Dark</div>
                        <div className="text-sm text-muted-foreground">Use dark theme</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-colors bg-card backdrop-blur-sm border border-border hover:border-accent hover:bg-muted/50">
                      <input
                        type="radio"
                        name="theme"
                        value="auto"
                        checked={theme === 'auto'}
                        onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'auto')}
                        className="w-4 h-4 text-primary bg-background border-border focus:ring-2 focus:ring-primary focus:ring-offset-0"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-foreground">Auto</div>
                        <div className="text-sm text-muted-foreground">Follow system preference</div>
                      </div>
                    </label>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <Button
                      onClick={() => {
                        saveTheme(theme);
                        toast.success('Theme preference saved!');
                      }}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      Save Theme Preference
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Workshop Tab */}
            {activeTab === 'workshop' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Skill Level Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      Skill Level
                    </CardTitle>
                    <CardDescription>
                      Adjusts AI guidance detail level in Workshop mission plans
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'beginner', label: 'Beginner', desc: 'Detailed explanations, step-by-step' },
                        { value: 'intermediate', label: 'Intermediate', desc: 'Standard detail, focus on gotchas' },
                        { value: 'experienced', label: 'Experienced', desc: 'Abbreviated, specs-focused' },
                        { value: 'professional', label: 'Professional', desc: 'Spec sheet mode only' }
                      ].map((level) => (
                        <label
                          key={level.value}
                          className={`flex flex-col p-4 rounded-lg cursor-pointer transition-all border ${
                            skillLevel === level.value
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-muted-foreground'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="skillLevel"
                              value={level.value}
                              checked={skillLevel === level.value}
                              onChange={(e) => setSkillLevel(e.target.value as SkillLevel)}
                              className="w-4 h-4 text-primary bg-background border-border"
                            />
                            <span className="font-medium text-foreground">{level.label}</span>
                          </div>
                          <span className="text-xs text-muted-foreground mt-1 ml-6">{level.desc}</span>
                        </label>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Tool Inventory Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wrench className="h-5 w-5" />
                      Tool Inventory
                    </CardTitle>
                    <CardDescription>
                      Track your tools—AI will suggest alternatives for missing ones
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Add Tool Input */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a tool (e.g., 10mm socket)"
                        value={newToolName}
                        onChange={(e) => setNewToolName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newToolName.trim()) {
                            setToolInventory(prev => [
                              ...prev,
                              { name: newToolName.trim(), owned: true }
                            ]);
                            setNewToolName('');
                          }
                        }}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (newToolName.trim()) {
                            setToolInventory(prev => [
                              ...prev,
                              { name: newToolName.trim(), owned: true }
                            ]);
                            setNewToolName('');
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Tool List */}
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {toolInventory.length === 0 ? (
                        <div className="text-sm text-muted-foreground text-center py-4">
                          No tools added yet. Add your tools above or use AI suggestions.
                        </div>
                      ) : (
                        toolInventory.map((tool, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 rounded-lg border border-border"
                          >
                            <div className="flex items-center gap-3">
                              <Switch
                                checked={tool.owned}
                                onCheckedChange={(checked) => {
                                  setToolInventory(prev => prev.map((t, i) =>
                                    i === idx ? { ...t, owned: checked } : t
                                  ));
                                }}
                              />
                              <span className={tool.owned ? 'text-foreground' : 'text-muted-foreground'}>
                                {tool.name}
                              </span>
                              {tool.suggested && (
                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                  AI Suggested
                                </span>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => {
                                setToolInventory(prev => prev.filter((_, i) => i !== idx));
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* AI Suggest Button */}
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={isSuggestingTools}
                      onClick={async () => {
                        if (!session?.access_token) return;
                        setIsSuggestingTools(true);
                        try {
                          const response = await fetch('/api/workshop/suggest-tools', {
                            method: 'POST',
                            headers: {
                              'Authorization': `Bearer ${session.access_token}`,
                              'Content-Type': 'application/json'
                            }
                          });
                          const data = await response.json();
                          if (data.tools && Array.isArray(data.tools)) {
                            // Merge with existing, avoiding duplicates
                            const existingNames = new Set(toolInventory.map(t => t.name.toLowerCase()));
                            const newTools = data.tools
                              .filter((name: string) => !existingNames.has(name.toLowerCase()))
                              .map((name: string) => ({ name, owned: false, suggested: true }));
                            setToolInventory(prev => [...prev, ...newTools]);
                            toast.success(`Added ${newTools.length} suggested tools`);
                          }
                        } catch (error) {
                          console.error('Error suggesting tools:', error);
                          toast.error('Failed to get tool suggestions');
                        } finally {
                          setIsSuggestingTools(false);
                        }
                      }}
                    >
                      {isSuggestingTools ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing Vehicles...</>
                      ) : (
                        <><Sparkles className="h-4 w-4 mr-2" /> Suggest Tools for My Vehicles</>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Save Button - Full Width */}
                <div className="md:col-span-2">
                  <Button
                    onClick={async () => {
                      if (!session?.access_token || !authUser) return;
                      setIsLoadingWorkshop(true);
                      try {
                        const supabase = createClient();
                        const { error } = await supabase
                          .from('user_preferences')
                          .upsert({
                            user_id: authUser.id,
                            skill_level: skillLevel,
                            tool_inventory: toolInventory,
                            updated_at: new Date().toISOString()
                          });
                        if (error) throw error;
                        toast.success('Workshop preferences saved!');
                      } catch (error) {
                        console.error('Error saving workshop preferences:', error);
                        toast.error('Failed to save preferences');
                      } finally {
                        setIsLoadingWorkshop(false);
                      }
                    }}
                    disabled={isLoadingWorkshop}
                    className="w-full"
                  >
                    {isLoadingWorkshop ? 'Saving...' : 'Save Workshop Preferences'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
