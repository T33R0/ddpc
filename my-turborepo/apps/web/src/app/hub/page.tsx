'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { User, Compass, Car, Terminal, Monitor } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { DashboardCard } from '@/components/dashboard-card'

export default function HubPage() {
  const router = useRouter()
  const { user } = useAuth()

  const displayName = user?.user_metadata?.full_name?.split(' ')[0]?.toLowerCase() || 'me myself and i'

  // Admin logic: Role is 'admin' OR email is 'myddpc@gmail.com'
  const isAdmin = user?.email === 'myddpc@gmail.com' || (user as any)?.role === 'admin'

  const handleNavigate = (path: string) => {
    router.push(path)
  }

  return (
    <main className="min-h-screen w-full bg-background text-foreground p-6 md:p-12">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* Header */}
        <div className="flex flex-col space-y-2">
          <h1 className="text-4xl font-light tracking-tight text-foreground">
            welcome back, <span className="font-medium">{displayName}</span>
          </h1>
          <p className="text-muted-foreground">
            select a destination to begin
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">

          {/* 1. Account */}
          <DashboardCard
            className="h-[320px] p-0"
            onClick={() => handleNavigate('/account')}
          >
             <div className="absolute inset-0 bg-[url('/images/hub/account.png')] bg-cover bg-center opacity-40 transition-opacity duration-300 group-hover:opacity-30" />
             <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />

             <div className="relative z-10 flex h-full flex-col justify-end p-6">
                <div className="mb-2 flex items-center space-x-2">
                  <User className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-bold uppercase tracking-wide">Account</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Manage your profile and settings.
                </p>
             </div>
          </DashboardCard>

          {/* 2. Explore */}
          <DashboardCard
            className="h-[320px] p-0"
            onClick={() => handleNavigate('/explore')}
          >
             <div className="absolute inset-0 bg-[url('/images/hub/explore.png')] bg-cover bg-center opacity-40 transition-opacity duration-300 group-hover:opacity-30" />
             <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />

             <div className="relative z-10 flex h-full flex-col justify-end p-6">
                <div className="mb-2 flex items-center space-x-2">
                  <Compass className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-bold uppercase tracking-wide">Explore</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Discover builds and get inspired.
                </p>
             </div>
          </DashboardCard>

          {/* 3. Garage */}
          <DashboardCard
            className="h-[320px] p-0"
            onClick={() => handleNavigate('/garage')}
          >
             <div className="absolute inset-0 bg-[url('/images/hub/garage.jpg')] bg-cover bg-center opacity-40 transition-opacity duration-300 group-hover:opacity-30" />
             <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />

             <div className="relative z-10 flex h-full flex-col justify-end p-6">
                <div className="mb-2 flex items-center space-x-2">
                  <Car className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-bold uppercase tracking-wide">Garage</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Manage your fleet and service history.
                </p>
             </div>
          </DashboardCard>

          {/* 4. Console (Admin Only) */}
          {isAdmin && (
            <DashboardCard
              className="h-[320px] p-0"
              onClick={() => handleNavigate('/console')}
            >
              <div className="absolute inset-0 bg-[url('/images/hub/console.png')] bg-cover bg-center opacity-40 transition-opacity duration-300 group-hover:opacity-30" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />

              <div className="relative z-10 flex h-full flex-col justify-end p-6">
                  <div className="mb-2 flex items-center space-x-2">
                    <Terminal className="h-5 w-5 text-primary" />
                    <h3 className="text-xl font-bold uppercase tracking-wide">Console</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Administrative controls and reports.
                  </p>
              </div>
            </DashboardCard>
          )}

          {/* 5. ddsr (Daily Driven Sim Rig) */}
          <DashboardCard
            className="h-[320px] p-0"
            onClick={() => handleNavigate('/ddsr')}
          >
             <div className="absolute inset-0 bg-[url('/images/hub/ddsr.png')] bg-cover bg-center opacity-40 transition-opacity duration-300 group-hover:opacity-30" />
             <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />

             <div className="relative z-10 flex h-full flex-col justify-end p-6">
                <div className="mb-2 flex items-center space-x-2">
                  <Monitor className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-bold uppercase tracking-wide">ddsr</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Daily Driven Sim Rig configurations.
                </p>
             </div>
          </DashboardCard>

        </div>
      </div>
    </main>
  )
}
