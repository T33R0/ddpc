'use client';

import { useAuth } from '../../lib/auth';
import DDPCDashboardOrbital from '../../components/ddpc-dashboard-orbital';
import { useRouter } from 'next/navigation';
import { Car, Settings, Zap, Warehouse, SlidersHorizontal } from 'lucide-react';

const UserAvatarIcon = ({ size }: { size?: number }) => {
  const { user } = useAuth();
  const avatarUrl = user?.user_metadata?.avatar_url;

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt="Profile"
        className="w-full h-full object-cover rounded-full"
        style={{ borderRadius: '50%' }}
      />
    );
  }

  // Fallback to Settings icon with original size
  return <Settings size={size} />;
};

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
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
      title: "Account",
      route: "/account",
      description: "Manage your profile, security settings, and account preferences. Update your personal information and customize your DDPC experience.",
      icon: UserAvatarIcon,
      category: "Account",
      relatedIds: [2, 3],
      status: "available" as const,
      color: "#3b82f6"
    },
    {
      id: 2,
      title: "Explore",
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
      title: "Garage",
      route: "/garage",
      description: "View and manage your personal vehicle collection. Track maintenance, modifications, and build progress for each vehicle.",
      icon: Warehouse,
      category: "Garage",
      relatedIds: [1, 2, 4],
      status: "available" as const,
      color: "#8b5cf6"
    },
    {
      id: 4,
      title: "Console",
      route: "/console",
      description: "Connect with other enthusiasts and share builds. Join discussions, get advice, and showcase your projects.",
      icon: SlidersHorizontal,
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

  const displayName = profile?.username || user.user_metadata?.display_name || user.user_metadata?.full_name || user.email?.split('@')[0];

  return (
    <div className="min-h-screen p-4 flex flex-col">
      <div className="max-w-6xl w-full mx-auto pt-24">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-foreground lowercase">
            welcome back, {displayName}!
          </h1>
          <p className="text-muted-foreground text-lg lowercase">
            manage your vehicles and track your builds.
          </p>
        </div>
      </div>

      <div className="flex-grow flex items-center justify-center">
        <DDPCDashboardOrbital nodes={dashboardNodes} />
      </div>
    </div>
  );
}
