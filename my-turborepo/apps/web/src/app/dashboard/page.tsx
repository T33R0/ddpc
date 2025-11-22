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
      title: "Vehicle Explore",
      route: "/explore",
      description: "Browse and research vehicles in our comprehensive database. Find your next project or learn about different models.",
      icon: Car,
      category: "Explore",
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
    <div className="min-h-screen bg-black text-white p-4 flex flex-col">
      <div className="max-w-6xl w-full mx-auto pt-24">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Welcome back, {user.user_metadata?.full_name || user.email?.split('@')[0]}!
          </h1>
          <p className="text-gray-400 text-lg">
            Here&apos;s your DDPC dashboard - manage your vehicles and track your builds.
          </p>
        </div>
      </div>

      <div className="flex-grow flex items-center justify-center">
        <DDPCDashboardOrbital nodes={dashboardNodes} />
      </div>
    </div>
  );
}
