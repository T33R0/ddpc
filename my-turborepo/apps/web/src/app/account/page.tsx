'use client';

import { useAuth } from '../../lib/auth';
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
  EyeOff
} from 'lucide-react';
import { User as UserType } from '@repo/types';

type TabType = 'profile' | 'security' | 'billing' | 'account';

export default function AccountPage() {
  const { user: authUser, signOut, loading, session, signUp, signIn, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);

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
    } catch (error) {
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
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white">
          {isSigningOut ? 'Signing out...' : 'Loading...'}
        </div>
      </div>
    );
  }

  // Show unauthorized access page for non-authenticated users
  if (!loading && !authUser) {
    return (
      <div className="min-h-screen bg-black text-white p-4">
        <div className="max-w-md mx-auto flex items-center justify-center min-h-screen">
          <Card className="bg-gray-900 border-gray-800 w-full">
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
                  className="w-full text-gray-400 hover:text-white hover:bg-gray-800"
                >
                  Go Back
                </Button>
              </div>

              <div className="text-center text-sm text-gray-500 mt-6">
                <p>Manage your profile, security settings, and account preferences</p>
              </div>
            </CardContent>
          </Card>
        </div>

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
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white">Loading profile...</div>
      </div>
    );
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'free': return 'text-gray-400';
      case 'builder': return 'text-blue-400';
      case 'pro': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'free': return '🆓';
      case 'builder': return '🔧';
      case 'pro': return '👑';
      default: return '🆓';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            onClick={() => router.push('/dashboard')}
            variant="ghost"
            className="mb-4 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold mb-2">Account Management</h1>
          <p className="text-gray-400">Manage your account settings and preferences</p>

          {/* Member info bar */}
          <div className="mt-4 p-4 bg-gray-900 rounded-lg border border-gray-800">
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
                    {getPlanIcon(user.plan)} {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)} Plan
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
            <ToggleGroupItem value="profile" className="data-[state=on]:bg-gray-700">
              <User className="h-4 w-4 mr-2" />
              Profile
            </ToggleGroupItem>
            <ToggleGroupItem value="security" className="data-[state=on]:bg-gray-700">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </ToggleGroupItem>
            <ToggleGroupItem value="billing" className="data-[state=on]:bg-gray-700">
              <CreditCard className="h-4 w-4 mr-2" />
              Billing
            </ToggleGroupItem>
            <ToggleGroupItem value="account" className="data-[state=on]:bg-gray-700">
              <Settings className="h-4 w-4 mr-2" />
              Account
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Profile Information */}
              <Card className="bg-gray-900 border-gray-800">
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
                  <div>
                    <Label htmlFor="username">Username *</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="bg-gray-800 border-gray-700 mt-1"
                      placeholder="your_username"
                    />
                  </div>

                  <div>
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="bg-gray-800 border-gray-700 mt-1"
                      placeholder="Your Display Name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="bg-gray-800 border-gray-700 mt-1"
                      placeholder="City, Country"
                    />
                  </div>

                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="bg-gray-800 border-gray-700 mt-1"
                      placeholder="https://yourwebsite.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="bg-gray-800 border-gray-700 mt-1"
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                  </div>

                  <Button
                    onClick={handleUpdateProfile}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? 'Updating...' : 'Update Profile'}
                  </Button>
                </CardContent>
              </Card>

              {/* Avatar & Privacy Settings */}
              <Card className="bg-gray-900 border-gray-800">
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
                  <div>
                    <Label htmlFor="avatarUrl">Avatar URL</Label>
                    <Input
                      id="avatarUrl"
                      type="url"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      className="bg-gray-800 border-gray-700 mt-1"
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>

                  {avatarUrl && (
                    <div className="flex justify-center">
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
                      className="rounded border-gray-700 bg-gray-800"
                    />
                    <Label htmlFor="isPublic" className="text-sm">
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
            <Card className="bg-gray-900 border-gray-800 max-w-2xl">
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
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="bg-gray-800 border-gray-700 mt-1"
                    placeholder="Enter your current password"
                  />
                </div>

                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-gray-800 border-gray-700 mt-1"
                    placeholder="Enter your new password"
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-gray-800 border-gray-700 mt-1"
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
              <Card className="bg-gray-900 border-gray-800">
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
                  <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{getPlanIcon(user.plan)}</div>
                      <div>
                        <h3 className={`text-lg font-semibold ${getPlanColor(user.plan)}`}>
                          {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)} Plan
                        </h3>
                        <p className="text-sm text-gray-400">
                          {user.plan === 'free' && 'Basic features with limited usage'}
                          {user.plan === 'builder' && 'Enhanced features for enthusiasts'}
                          {user.plan === 'pro' && 'Full access to all premium features'}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" disabled>
                      Current Plan
                    </Button>
                  </div>

                  <div className="mt-4 p-4 border border-gray-700 rounded-lg">
                    <h4 className="font-medium mb-2">Plan Features</h4>
                    <ul className="text-sm text-gray-400 space-y-1">
                      {user.plan === 'free' && (
                        <>
                          <li>• Access to basic vehicle database</li>
                          <li>• Limited garage size (5 vehicles)</li>
                          <li>• Basic search and filtering</li>
                        </>
                      )}
                      {user.plan === 'builder' && (
                        <>
                          <li>• Everything in Free</li>
                          <li>• Unlimited garage size</li>
                          <li>• Advanced search and filtering</li>
                          <li>• Export capabilities</li>
                        </>
                      )}
                      {user.plan === 'pro' && (
                        <>
                          <li>• Everything in Builder</li>
                          <li>• Priority support</li>
                          <li>• Advanced analytics</li>
                          <li>• API access</li>
                          <li>• Custom integrations</li>
                        </>
                      )}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
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
              <Card className="bg-gray-900 border-gray-800">
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
                    <div className="p-4 bg-gray-800 rounded-lg">
                      <h4 className="font-medium mb-2">Account Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">User ID:</span>
                          <span className="font-mono text-xs">{user.id.slice(0, 8)}...</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Email:</span>
                          <span>{user.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Role:</span>
                          <span className="capitalize">{user.role}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Status:</span>
                          <span className={user.banned ? 'text-red-400' : 'text-green-400'}>
                            {user.banned ? 'Banned' : 'Active'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-800 rounded-lg">
                      <h4 className="font-medium mb-2">Privacy Settings</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Profile Visibility:</span>
                          <span>{isPublic ? 'Public' : 'Private'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Last Updated:</span>
                          <span>{new Date(user.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle>Account Actions</CardTitle>
                  <CardDescription>
                    Manage your account status and data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 flex-wrap">
                    <Button
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                      variant="outline"
                      className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
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

                  <div className="mt-4 p-4 bg-red-900/20 border border-red-800 rounded-lg">
                    <h4 className="font-medium text-red-400 mb-2">Danger Zone</h4>
                    <p className="text-sm text-gray-400">
                      Account deletion and data export features are coming soon. These actions cannot be undone.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
