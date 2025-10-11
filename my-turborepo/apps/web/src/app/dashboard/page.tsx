'use client';

import { useAuth } from '../../lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card';
import { useRouter } from 'next/navigation';
import { Car, Settings, Users, BarChart3, Plus } from 'lucide-react';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    router.push('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-6xl mx-auto pt-24">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Welcome back, {user.user_metadata?.full_name || user.email?.split('@')[0]}!
          </h1>
          <p className="text-gray-400 text-lg">
            Here's your DDPC dashboard - manage your vehicles and track your builds.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Settings className="h-6 w-6 text-blue-400" />
                Account Settings
              </CardTitle>
              <CardDescription>
                Manage your profile, security settings, and account preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <button className="w-full h-10 px-4 py-2 border border-blue-400 bg-transparent text-blue-400 hover:bg-blue-400 hover:text-white rounded-md text-sm font-medium transition-colors" onClick={() => { console.log('Account button clicked'); router.push('/account'); }}>
                My Account
              </button>
            </CardContent>
          </Card>

          {/* Vehicle Discovery */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Car className="h-6 w-6 text-green-400" />
                Vehicle Discovery
              </CardTitle>
              <CardDescription>
                Browse and research vehicles in our database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <button className="w-full h-10 px-4 py-2 border border-green-400 bg-transparent text-green-400 hover:bg-green-400 hover:text-white rounded-md text-sm font-medium transition-colors" onClick={() => { console.log('Discover button clicked'); router.push('/discover'); }}>
                Explore Vehicles
              </button>
            </CardContent>
          </Card>

          {/* My Collection */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Car className="h-6 w-6 text-purple-400" />
                My Collection
              </CardTitle>
              <CardDescription>
                View and manage your personal vehicle collection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <button className="w-full h-10 px-4 py-2 border border-purple-400 bg-transparent text-purple-400 hover:bg-purple-400 hover:text-white rounded-md text-sm font-medium transition-colors" onClick={() => { console.log('Collection button clicked'); router.push('/garage'); }}>
                View Collection
              </button>
            </CardContent>
          </Card>

          {/* Community */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Users className="h-6 w-6 text-purple-400" />
                Community
              </CardTitle>
              <CardDescription>
                Connect with other enthusiasts and share builds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <button className="w-full h-10 px-4 py-2 border border-purple-400 bg-transparent text-purple-400 hover:bg-purple-400 hover:text-white rounded-md text-sm font-medium transition-colors" onClick={() => { console.log('Community button clicked'); router.push('/community'); }}>
                Join Community
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">Vehicles Owned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">0</div>
              <p className="text-sm text-gray-400 mt-1">No vehicles added yet</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">Active Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">0</div>
              <p className="text-sm text-gray-400 mt-1">Start your first build</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">Community Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">0</div>
              <p className="text-sm text-gray-400 mt-1">Share your progress</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Start */}
        <Card className="bg-gradient-to-r from-blue-900 to-purple-900 border-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Plus className="h-6 w-6" />
              Get Started with DDPC
            </CardTitle>
            <CardDescription className="text-blue-100">
              Ready to start tracking your vehicle projects? Here's how to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="bg-blue-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold">1</span>
                </div>
                <h4 className="font-semibold mb-2">Add Your Vehicle</h4>
                <p className="text-sm text-blue-100">Browse our database and add your first vehicle to start tracking.</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold">2</span>
                </div>
                <h4 className="font-semibold mb-2">Create Your Garage</h4>
                <p className="text-sm text-blue-100">Set up your personal garage to organize your vehicles and projects.</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold">3</span>
                </div>
                <h4 className="font-semibold mb-2">Start Tracking</h4>
                <p className="text-sm text-blue-100">Log maintenance, track modifications, and document your builds.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
