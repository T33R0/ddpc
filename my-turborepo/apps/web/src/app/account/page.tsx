'use client';

import { useAuth } from '../../lib/auth';
import { useTheme } from '../../lib/theme-context';
import { Button } from '@repo/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui/label';
import { Textarea } from '@repo/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@repo/ui/toggle-group';
import { AuthModal } from '@repo/ui/auth-modal';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  Palette
} from 'lucide-react';
import { User as UserType } from '@repo/types';
import { supabase } from '../../lib/supabase';
import { stripUsernamePrefixFromPathname, toUsernameSlug } from '../../lib/user-routing';

type TabType = 'profile' | 'security' | 'billing' | 'account' | 'theme';

export default function AccountPage() {
  const { user: authUser, signOut, loading, session, signUp, signIn, signInWithGoogle, refreshProfile } = useAuth();
  const { theme, setTheme, saveTheme } = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [isUpdated, setIsUpdated] = useState(false);

  // Profile form state
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  // Security form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');



  useEffect(() => {
    if (!loading && !authUser) {
      // Don't redirect, let the component handle unauthorized access
      return;
    }
    if (authUser && session?.access_token) {
      fetchUserProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser, loading, session?.access_token, router]);

  const fetchUserProfile = useCallback(async () => {
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
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Profile fetch failed:', errorData);
        toast.error('Failed to load profile data');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile data');
    }
  }, [session?.access_token]);

  const syncAuthMetadata = useCallback(
    async (nextUsername: string, nextDisplayName?: string, nextAvatarUrl?: string) => {
      const normalizedUsername = nextUsername.trim();
      if (!normalizedUsername) {
        return null;
      }

      const usernameSlug = toUsernameSlug(normalizedUsername) ?? normalizedUsername.toLowerCase();

      try {
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
                <CardDescription className="text-gray-400">
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
                    className="w-full border-gray-700 hover:bg-gray-800"
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

                <div className="text-center text-sm text-gray-500 mt-6">
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
      case 'free': return 'text-gray-400';
      case 'builder': return 'text-red-500'; // Updated to match Builder branding
      case 'pro': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'free': return '🧱'; // Foundation/Maintainer
      case 'builder': return '🔧'; // Builder
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
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-400">
                      Member since: {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Crown className={`h-4 w-4 ${getPlanColor(user.plan)}`} />
                    <span className={`text-sm font-medium ${getPlanColor(user.plan)}`}>
                      {getPlanIcon(user.plan)} {user.plan === 'free' ? 'Maintainer' : 'Builder'} Plan
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-400">
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
            </ToggleGroup>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile Information */}
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
                          className="w-20 h-20 rounded-full object-cover border-2 border-gray-700"
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
                        className="w-4 h-4 rounded border-white/30 bg-black/30 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                      />
                      <Label htmlFor="isPublic" className="text-sm text-gray-300">
                        Make profile public
                      </Label>
                    </div>

                    <div className="text-xs text-gray-400">
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
                  </CardContent>
                </Card>
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
            {activeTab === 'billing' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Current Plan
                    </CardTitle>
                    <CardDescription>
                      Your current subscription and billing information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{getPlanIcon(user.plan)}</div>
                        <div>
                          <h3 className={`text-lg font-semibold ${getPlanColor(user.plan)}`}>
                            {user.plan === 'free' ? 'Maintainer' : 'Builder'} Plan
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {user.plan === 'free' && 'Essential tools for maintaining your daily drivers and weekend toys.'}
                            {(user.plan === 'builder' || user.plan === 'pro') && 'Advanced tools for serious builds, detailed planning, and total cost tracking.'}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" disabled className="border-border text-muted-foreground">
                        Current Plan
                      </Button>
                    </div>

                    <div className="mt-4 p-4 bg-card border border-border rounded-lg">
                      <h4 className="font-medium mb-2 text-foreground">Plan Features</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {user.plan === 'free' && (
                          <>
                            <li>• Vehicle Cap: 3 Active Vehicles</li>
                            <li>• Fuel Logging: MPG tracking and cost analysis</li>
                            <li>• Service Logging: Maintenance records</li>
                            <li>• The Garage: Basic vehicle profile and specs</li>
                            <li>• Community Access</li>
                          </>
                        )}
                        {(user.plan === 'builder' || user.plan === 'pro') && (
                          <>
                            <li>• Vehicle Cap: Unlimited</li>
                            <li>• Mod Registry: Detailed modification tracking</li>
                            <li>• The Plans: Build planning and Jobs management</li>
                            <li>• The Console: Advanced analytics & TCO</li>
                            <li>• Priority Support</li>
                          </>
                        )}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Upgrade Options</CardTitle>
                    <CardDescription>
                      Unlock more features with a premium plan
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <p className="text-gray-400 mb-4">
                        Billing management and plan upgrades coming soon!
                      </p>
                      <Button variant="outline" disabled>
                        Manage Billing
                      </Button>
                    </div>
                  </CardContent>
                </Card>
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
                            <span className={user.banned ? 'text-red-400' : 'text-green-400'}>
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

                      <Button variant="outline" disabled className="border-red-600 text-red-400">
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
          </div>
        </div>
      </section>
    </>
  );
}
