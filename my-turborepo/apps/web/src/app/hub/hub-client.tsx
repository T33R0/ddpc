'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User as UserIcon, Compass, Car, Terminal, Monitor, Plus, Fuel, ShieldAlert } from 'lucide-react'
import { User } from '@supabase/supabase-js'
import { DashboardCard } from '@/components/dashboard-card'
import { Button } from '@repo/ui/button'
import { useVehicles, Vehicle } from '../../lib/hooks/useVehicles'
import { SelectVehicleDialog } from './components/SelectVehicleDialog'
import { AddFuelDialog } from '@/features/fuel/components'
import { AddServiceDialog } from '@/features/service/components/AddServiceDialog'

interface HubClientProps {
  user: User
  isAdmin: boolean
}

export default function HubClient({ user, isAdmin }: HubClientProps) {
  const router = useRouter()
  const displayName = user?.user_metadata?.full_name?.split(' ')[0]?.toLowerCase() || 'me myself and i'

  // Vehicle Logic
  const { data, isLoading } = useVehicles()
  const allVehicles = data?.vehicles || []
  // Filter for active vehicles
  const vehicles = allVehicles.filter(v => v.current_status !== 'sold' && v.current_status !== 'retired')

  const [isSelectVehicleOpen, setIsSelectVehicleOpen] = useState(false)
  const [selectedAction, setSelectedAction] = useState<'fuel' | 'service' | null>(null)
  const [isFuelLogOpen, setIsFuelLogOpen] = useState(false)
  const [isServiceLogOpen, setIsServiceLogOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)

  const handleActionClick = (action: 'fuel' | 'service') => {
    if (isLoading) return

    if (vehicles.length === 0) {
      if (confirm('No active vehicles found. Would you like to go to your Garage to add one?')) {
        router.push('/garage')
      }
      return
    }

    // Always open selection dialog if there are vehicles (even if just 1, to be safe/consistent, or auto-select)
    // User requested "recreate it by basically making a mini gallery... shrinking the vehicle cards".
    // So I will always show the gallery if > 0 vehicles.
    setSelectedAction(action)
    setIsSelectVehicleOpen(true)
  }


  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    if (selectedAction === 'fuel') setIsFuelLogOpen(true)
    if (selectedAction === 'service') setIsServiceLogOpen(true)
    setSelectedAction(null)
  }

  const handleNavigate = (path: string) => {
    router.push(path)
  }

  return (
    <main className="min-h-screen w-full text-foreground px-6 pb-6 pt-24 md:px-12 md:pb-12 md:pt-32">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col space-y-2">
            <h1 className="text-4xl font-light tracking-tight text-foreground">
              welcome back, <span className="font-medium">{displayName}</span>
            </h1>
            <p className="text-muted-foreground">
              select a destination to begin
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={() => handleActionClick('fuel')}
              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground dark:bg-primary dark:hover:bg-primary/90 dark:text-primary-foreground"
            >
              <Fuel className="mr-2 h-4 w-4" /> Log Fuel
            </Button>
            <Button
              onClick={() => handleActionClick('service')}
              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground dark:bg-primary dark:hover:bg-primary/90 dark:text-primary-foreground"
            >
              <Plus className="mr-2 h-4 w-4" /> Log Service
            </Button>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">

          {/* 1. Garage */}
          <DashboardCard
            className="h-[320px] p-0"
            onClick={() => handleNavigate('/garage')}
            imageSrc="/images/felix-9Z2-hIOO0sk-unsplash.jpg"
            priority={true}
          >
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

          {/* 2. Console */}
          <DashboardCard
            className="h-[320px] p-0"
            onClick={() => handleNavigate('/console')}
            imageSrc="/images/hub/console.png"
            priority={true}
          >
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

          {/* 3. Explore */}
          <DashboardCard
            className="h-[320px] p-0"
            onClick={() => handleNavigate('/explore')}
            imageSrc="/images/dylan-gillis-V8_s30ttQTk-unsplash.jpg"
            priority={true}
          >
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

          {/* 4. ddsr (Daily Driven Sim Rig) */}
          <DashboardCard
            className="h-[320px] p-0"
            onClick={() => handleNavigate('/ddsr')}
            imageSrc="/images/chris-kursikowski-tSHt5Waz7Pc-unsplash.jpg"
          >
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

          {/* 5. Account */}
          <DashboardCard
            className="h-[320px] p-0"
            onClick={() => handleNavigate('/account')}
            imageSrc="/images/timeo-buehrer-3Zqe69sBI0U-unsplash.jpg"
          >
            <div className="relative z-10 flex h-full flex-col justify-end p-6">
              <div className="mb-2 flex items-center space-x-2">
                <UserIcon className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-bold uppercase tracking-wide">Account</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Manage your profile and settings.
              </p>
            </div>
          </DashboardCard>

          {/* 6. Admin (Admin Only) */}
          {isAdmin && (
            <DashboardCard
              className="h-[320px] p-0"
              onClick={() => handleNavigate('/admin')}
              imageSrc="/images/jakub-zerdzicki-pLD-QID7x3k-unsplash.jpg"
            >
              <div className="relative z-10 flex h-full flex-col justify-end p-6">
                <div className="mb-2 flex items-center space-x-2">
                  <ShieldAlert className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-bold uppercase tracking-wide">Admin</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  System administration.
                </p>
              </div>
            </DashboardCard>
          )}

        </div>
      </div>

      <SelectVehicleDialog
        isOpen={isSelectVehicleOpen}
        onClose={() => setIsSelectVehicleOpen(false)}
        vehicles={vehicles}
        onSelect={handleVehicleSelect}
        actionLabel={selectedAction === 'fuel' ? 'log fuel' : 'log service'}
      />

      {selectedVehicle && (
        <>
          <AddFuelDialog
            isOpen={isFuelLogOpen}
            onClose={() => setIsFuelLogOpen(false)}
            vehicleId={selectedVehicle.id}
            currentOdometer={selectedVehicle.odometer}
          />

          <AddServiceDialog
            isOpen={isServiceLogOpen}
            onClose={() => setIsServiceLogOpen(false)}
            vehicleId={selectedVehicle.id}
          />
        </>
      )}
    </main>
  )
}
