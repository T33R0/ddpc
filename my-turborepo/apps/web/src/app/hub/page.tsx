'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { GarageQuickActions } from './components/GarageQuickActions'
import { Car, Compass, Users } from 'lucide-react'
// import { DDPCDashboardOrbital } from '@/components/ddpc-dashboard-orbital'
import { useAuth } from '@/lib/auth'
import { AuthProvider } from '@repo/ui/auth-context'
import { supabase } from '@/lib/supabase'
import { DashboardCard } from '@/components/dashboard-card'

export default function HubPage() {
  const router = useRouter()
  const { user } = useAuth()

  const handleNavigate = (path: string) => {
    router.push(path)
  }

  // Admin check (using breakglass logic from memory)
  const isAdmin = user?.email === 'myddpc@gmail.com' || (user as any)?.role === 'admin'

  return (
    <AuthProvider supabase={supabase}>
      <main className="relative min-h-screen w-full overflow-hidden bg-background text-foreground">
        {/* Ambient background effects */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-blue-500/20 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-purple-500/20 blur-[120px]" />
        </div>

        <div className="container relative z-10 flex min-h-screen flex-col items-center justify-center py-12">
          {/* Orbital Visualization */}
          {/* <div className="mb-12 scale-75 md:scale-100">
             <DDPCDashboardOrbital />
          </div> */}

          <div className="grid w-full max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
            {/* Garage Card */}
            <DashboardCard
              className="bg-card/50 p-6 h-[320px] flex flex-col"
              onClick={() => handleNavigate('/garage')}
            >
              <div className="absolute inset-0 bg-[url('/images/hub/garage-bg.jpg')] bg-cover bg-center opacity-20 transition-opacity duration-300 group-hover:opacity-10" />
              <div className="relative z-10 flex flex-1 flex-col items-center justify-start pt-8">
                <div className="mb-4 rounded-full bg-background/80 p-4 shadow-lg ring-1 ring-border">
                  <Car className="h-8 w-8 text-primary" />
                </div>
                <h2 className="mb-2 text-2xl font-bold">My Garage</h2>
                <p className="text-center text-sm text-muted-foreground">
                  Manage your fleet, track mods, and log service history.
                </p>

                {/* Quick Actions (Buttons) */}
                <div className="mt-auto w-full pt-4">
                   <GarageQuickActions />
                </div>
              </div>
            </DashboardCard>

            {/* Explore Card */}
            <DashboardCard
              className="bg-card/50 p-6 h-[320px] flex flex-col"
              onClick={() => handleNavigate('/explore')}
            >
              <div className="absolute inset-0 bg-[url('/images/hub/explore-bg.jpg')] bg-cover bg-center opacity-20 transition-opacity duration-300 group-hover:opacity-10" />
              <div className="relative z-10 flex flex-1 flex-col items-center justify-center">
                <div className="mb-4 rounded-full bg-background/80 p-4 shadow-lg ring-1 ring-border">
                  <Compass className="h-8 w-8 text-secondary" />
                </div>
                <h2 className="mb-2 text-2xl font-bold">Explore</h2>
                <p className="text-center text-sm text-muted-foreground">
                  Discover builds, get inspired, and find your next project.
                </p>
              </div>
            </DashboardCard>

            {/* Community Card */}
            <DashboardCard
              className="bg-card/50 p-6 h-[320px] flex flex-col"
              onClick={() => handleNavigate('/community')}
            >
              <div className="absolute inset-0 bg-[url('/images/hub/community-bg.jpg')] bg-cover bg-center opacity-20 transition-opacity duration-300 group-hover:opacity-10" />
              <div className="relative z-10 flex flex-1 flex-col items-center justify-center">
                <div className="mb-4 rounded-full bg-background/80 p-4 shadow-lg ring-1 ring-border">
                  <Users className="h-8 w-8 text-accent-foreground" />
                </div>
                <h2 className="mb-2 text-2xl font-bold">Community</h2>
                <p className="text-center text-sm text-muted-foreground">
                  Connect with other enthusiasts and share your journey.
                </p>
              </div>
            </DashboardCard>

            {/* Admin Card (Conditional) */}
            {isAdmin && (
              <DashboardCard
                 className="bg-card/50 p-6 h-[320px] flex flex-col md:col-span-3 lg:col-span-1"
                 onClick={() => handleNavigate('/console')}
              >
                  <div className="relative z-10 flex flex-1 flex-col items-center justify-center">
                    <h2 className="text-2xl font-bold text-destructive">Admin Console</h2>
                  </div>
              </DashboardCard>
            )}

          </div>
        </div>
      </main>
    </AuthProvider>
  )
}
