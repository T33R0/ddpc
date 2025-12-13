'use client';

import { useEffect, useCallback } from 'react';
import { useAuth } from '../../lib/auth';
import { useRouter } from 'next/navigation';
import { Car, Settings, MonitorPlay, Warehouse, SlidersHorizontal, ShieldAlert, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@repo/ui/card';
import { Badge } from '@repo/ui/badge';
import { toUsernameSlug } from '../../lib/user-routing';
import { useTheme } from '../../lib/theme-context';
import { GarageQuickActions } from './components/GarageQuickActions';

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

export default function HubPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const usernameSlug = profile?.username ? toUsernameSlug(profile.username) : null;

  const buildScopedRoute = useCallback(
    (path: string) => {
      if (!path) return path;
      const normalized = path.startsWith("/") ? path : `/${path}`;
      if (!usernameSlug) {
        return normalized;
      }
      if (normalized === "/") {
        return `/${usernameSlug}`;
      }
      return `/${usernameSlug}${normalized}`;
    },
    [usernameSlug]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Admin access check
  const canAccessAdmin = profile?.role === 'admin' || user?.email === 'myddpc@gmail.com';

  const hubNodes = [
    {
      id: 1,
      title: "Account",
      route: "/account",
      description: "Manage your profile, security settings, and account preferences.",
      icon: UserAvatarIcon, // Using UserAvatarIcon instead of generic icon
      color: "text-blue-500",
      image: "/images/hub/account.png"
    },
    {
      id: 2,
      title: "Explore",
      route: "/explore",
      description: "Browse and research vehicles in our comprehensive database.",
      icon: Car,
      color: "text-emerald-500",
      image: "/images/hub/explore.png"
    },
    {
      id: 3,
      title: "Garage",
      route: "/garage",
      description: "View and manage your personal vehicle collection.",
      icon: Warehouse,
      color: "text-violet-500",
      image: "/images/hub/garage.jpg"
    },
    {
      id: 4,
      title: "Console",
      route: "/console",
      description: "Connect with other enthusiasts and share builds.",
      icon: SlidersHorizontal,
      color: "text-violet-500",
      image: "/images/hub/console.png"
    },
    {
      id: 5,
      title: "ddsr",
      route: "/ddsr",
      description: "the next extension of ddpc",
      icon: MonitorPlay,
      status: "new" as const,
      color: "text-cyan-500",
      image: "/images/hub/ddsr.png"
    },
  ];

  const displayName = profile?.username || user.user_metadata?.display_name || user.user_metadata?.full_name || user.email?.split('@')[0];

  // Theme-aware glow styles matching app consistency
  // Neon Green for dark theme, Neon Blue for light theme
  const cardHoverClass = "hover:border-blue-500/50 hover:shadow-[0_0_30px_#3b82f6] dark:hover:border-green-500/50 dark:hover:shadow-[0_0_30px_#22c55e]";

  return (
    <div className="min-h-screen p-4 flex flex-col">
      <div className="max-w-6xl w-full mx-auto pt-24">
        {/* Welcome Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2 text-foreground lowercase">
            welcome back, {displayName}!
          </h1>
          <p className="text-muted-foreground text-lg lowercase">
            manage your vehicles and track your builds.
          </p>
        </div>

        {/* Command Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[minmax(200px,auto)]">
          {hubNodes.map((node) => (
            <Card
              key={node.id}
              className={`group relative overflow-hidden transition-all duration-300 cursor-pointer border-border bg-card h-full flex flex-col ${cardHoverClass}`}
              onClick={() => router.push(buildScopedRoute(node.route))}
            >
              {/* Background Image */}
              <div
                className="absolute inset-0 z-0 transition-all duration-500 group-hover:scale-105 group-hover:brightness-50 brightness-90 dark:brightness-[0.3]"
                style={{
                  backgroundImage: `url('${node.image}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />

              {/* Content Overlay */}
              <div className="relative z-10 flex flex-col h-full bg-gradient-to-t from-background/90 via-background/60 to-background/30 p-1">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <div className={`p-2 rounded-full bg-background/50 ring-1 ring-border backdrop-blur-md group-hover:scale-110 transition-transform duration-300 ${node.color}`}>
                    <node.icon size={24} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl font-bold tracking-tight flex items-center gap-2 text-foreground drop-shadow-md">
                      {node.title}
                      {node.status === 'new' && (
                        <Badge variant="secondary" className="text-xs bg-cyan-500/10 text-cyan-500 border-cyan-500/20 backdrop-blur-md">Coming Soon</Badge>
                      )}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                  <CardDescription className="text-base leading-relaxed text-muted-foreground group-hover:text-foreground transition-colors duration-300 drop-shadow-sm">
                    {node.description}
                  </CardDescription>

                  {/* Garage Quick Actions */}
                  {node.title === 'Garage' && (
                    <div className="mt-auto">
                      <GarageQuickActions />
                    </div>
                  )}
                </CardContent>
              </div>
            </Card>
          ))}

          {/* Admin Card */}
          {canAccessAdmin && (
            <Card
              className={`group relative overflow-hidden transition-all duration-300 cursor-pointer border-red-500/20 bg-card h-full flex flex-col hover:border-red-500/50 hover:shadow-[0_0_30px_rgba(239,68,68,0.3)]`}
              onClick={() => router.push('/admin')}
            >
              {/* Background Image */}
              <div
                className="absolute inset-0 z-0 transition-all duration-500 group-hover:scale-105 group-hover:brightness-50 brightness-[0.3]"
                style={{
                  backgroundImage: `url('/images/hub/admin.png')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />

              <div className="relative z-10 flex flex-col h-full bg-gradient-to-t from-background/90 via-background/60 to-background/30 p-1">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <div className={`p-2 rounded-full bg-background/50 ring-1 ring-red-500/50 backdrop-blur-md group-hover:scale-110 transition-transform duration-300 text-red-500`}>
                    <ShieldAlert size={24} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl font-bold tracking-tight text-red-500 drop-shadow-md">
                      Admin
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed text-muted-foreground group-hover:text-foreground transition-colors duration-300 drop-shadow-sm">
                    Access administrative controls and user management.
                  </CardDescription>
                </CardContent>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
