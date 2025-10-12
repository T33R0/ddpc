'use client';

import { useAuth } from '../../lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card';
import { Button } from '@repo/ui/button';
import DDPCDashboardOrbital from '../../components/ddpc-dashboard-orbital';
import { useRouter } from 'next/navigation';
import { Car, Settings, Users, Plus, X, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showGetStarted, setShowGetStarted] = useState(true);

  // Check localStorage for dismissed state
  useEffect(() => {
    const dismissed = localStorage.getItem('ddpc-get-started-dismissed');
    if (dismissed === 'true') {
      setShowGetStarted(false);
    }
  }, []);

  const handleDismissGetStarted = () => {
    setShowGetStarted(false);
    localStorage.setItem('ddpc-get-started-dismissed', 'true');
  };

  const handleNeverShowAgain = () => {
    setShowGetStarted(false);
    localStorage.setItem('ddpc-get-started-dismissed', 'true');
  };

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

  // Dashboard navigation nodes
  const dashboardNodes = [
    {
      id: 1,
      title: "Account Settings",
      route: "/account",
      description: "Manage your profile, security settings, and account preferences. Update your personal information and customize your DDPC experience.",
      icon: Settings,
      category: "Account",
      relatedIds: [2, 3],
      status: "available" as const,
      color: "#3b82f6"
    },
    {
      id: 2,
      title: "Vehicle Discovery",
      route: "/discover",
      description: "Browse and research vehicles in our comprehensive database. Find your next project or learn about different models.",
      icon: Car,
      category: "Discovery",
      relatedIds: [1, 3, 5],
      status: "featured" as const,
      color: "#10b981"
    },
    {
      id: 3,
      title: "My Collection",
      route: "/garage",
      description: "View and manage your personal vehicle collection. Track maintenance, modifications, and build progress for each vehicle.",
      icon: Car,
      category: "Garage",
      relatedIds: [1, 2, 4],
      status: "available" as const,
      color: "#8b5cf6"
    },
    {
      id: 4,
      title: "Community",
      route: "/community",
      description: "Connect with other enthusiasts and share builds. Join discussions, get advice, and showcase your projects.",
      icon: Users,
      category: "Social",
      relatedIds: [3, 5],
      status: "available" as const,
      color: "#8b5cf6" // Purple
    },
    {
      id: 5,
      title: "Scrutineer",
      route: "/scrutineer",
      description: "Get intelligent recommendations for your builds, part compatibility checks, and maintenance scheduling powered by our Scrutineer AI.",
      icon: Zap,
      category: "AI",
      relatedIds: [2, 3, 4],
      status: "new" as const,
      color: "#06b6d4" // Cyan
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-6xl mx-auto pt-24">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Welcome back, {user.user_metadata?.full_name || user.email?.split('@')[0]}!
          </h1>
          <p className="text-gray-400 text-lg">
            Here&apos;s your DDPC dashboard - manage your vehicles and track your builds.
          </p>
        </div>

        {/* Get Started Section - Moved to Top */}
        {showGetStarted && (
          <Card className="bg-gradient-to-r from-blue-900 to-purple-900 border-blue-500 mb-8 relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 text-blue-200 hover:text-white hover:bg-blue-800/50"
              onClick={handleDismissGetStarted}
            >
              <X size={16} />
            </Button>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Plus className="h-6 w-6" />
                Get Started with DDPC
              </CardTitle>
              <CardDescription className="text-blue-100">
                Ready to start tracking your vehicle projects? Here&apos;s how to get started.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 mb-4">
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
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-blue-200 border-blue-400 hover:bg-blue-800 hover:text-white"
                  onClick={handleNeverShowAgain}
                >
                  Don&apos;t show this again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Orbital Navigation Section */}
        <div className="mt-16 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Navigate Your DDPC Experience</h2>
            <p className="text-gray-400">Click on any orbiting icon to explore different sections of your dashboard</p>
          </div>
          <DDPCDashboardOrbital nodes={dashboardNodes} />
        </div>
      </div>
    </div>
  );
}
