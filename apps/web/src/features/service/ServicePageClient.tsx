'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ServiceInterval,
} from '@repo/types'
import { Button } from '@repo/ui/button'
import { Plus, Fuel, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { AddServiceDialog } from '@/features/service/components/AddServiceDialog'
import { AddFuelDialog } from '@/features/fuel/components/AddFuelDialog'
import { ServicePlanView, ServicePlanViewRef } from '@/features/service/components/ServicePlanView'

// -----------------
// PROPS
// -----------------
type ServicePageClientProps = {
  vehicle: {
    id: string
    make: string
    model: string
    year: string
    nickname?: string | null
    odometer?: number | null
  }
  vehicleSlug: string
  initialPlannedLogs: {
    id: string
    event_date: string
    odometer: number | null
    service_item_id: string | null
    notes?: string | null
    service_provider?: string | null
    cost?: number | null
    service_item?: {
      id: string
      name: string
    } | null
  }[]
  initialPlan: ServiceInterval[]
  initialChecklistCategories: { id: string; name: string }[]
  initialChecklistItems: { id: string; name: string; description: string | null; category_id: string }[]
}

// -----------------
// HELPER COMPONENTS (to keep the main component clean)
// -----------------

// The "Plan" tab's content - replaced with ServicePlanView
const PlanTabContent = React.forwardRef<ServicePlanViewRef, {
  vehicleId: string
  onMarkComplete: (log: ServicePageClientProps['initialPlannedLogs'][number]) => void
  onAddToPlan: (serviceItemId: string) => void
  initialPlannedLogs: ServicePageClientProps['initialPlannedLogs']
  initialChecklistCategories: ServicePageClientProps['initialChecklistCategories']
  initialChecklistItems: ServicePageClientProps['initialChecklistItems']
}>(({ vehicleId, onMarkComplete, onAddToPlan, initialPlannedLogs, initialChecklistCategories, initialChecklistItems }, ref) => {
  return (
    <ServicePlanView
      ref={ref}
      vehicleId={vehicleId}
      onMarkComplete={onMarkComplete}
      onAddToPlan={onAddToPlan}
      initialPlannedLogs={initialPlannedLogs}
      initialChecklistCategories={initialChecklistCategories}
      initialChecklistItems={initialChecklistItems}
    />
  )
})

PlanTabContent.displayName = 'PlanTabContent'

// -----------------
// MAIN COMPONENT
// -----------------
export function ServicePageClient({
  vehicle,
  initialPlannedLogs,
  initialChecklistCategories,
  initialChecklistItems,
  vehicleSlug,
}: ServicePageClientProps) {
  const router = useRouter()
  const servicePlanViewRef = useRef<ServicePlanViewRef>(null)

  // Modal state for Service dialog
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false)

  // This will be used to pass a selected plan item to the modal
  const [selectedPlanItem, setSelectedPlanItem] = useState<ServiceInterval | null>(null)

  // For planned log (marking complete)
  const [selectedPlannedLog, setSelectedPlannedLog] = useState<ServicePageClientProps['initialPlannedLogs'][number] | null>(null)

  // For pre-filling service item (Add to Plan)
  const [prefillServiceItemId, setPrefillServiceItemId] = useState<string | undefined>(undefined)
  const [prefillStatus, setPrefillStatus] = useState<'History' | 'Plan'>('Plan')

  // Modal state for Fuel dialog
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false)

  // Handler for the "+ Add Service" button (free-text)
  const openAddServiceModal = () => {
    setSelectedPlanItem(null)
    setSelectedPlannedLog(null)
    setPrefillServiceItemId(undefined)
    setIsServiceModalOpen(true)
  }

  // Handler for marking a planned log as complete
  const handleMarkComplete = (log: ServicePageClientProps['initialPlannedLogs'][number]) => {
    setSelectedPlannedLog(log)
    setSelectedPlanItem(null)
    setPrefillServiceItemId(undefined)
    setIsServiceModalOpen(true)
  }

  // Handler for adding a service item to plan
  const handleAddToPlan = (serviceItemId: string) => {
    setPrefillServiceItemId(serviceItemId)
    setPrefillStatus('Plan')
    setSelectedPlanItem(null)
    setSelectedPlannedLog(null)
    setIsServiceModalOpen(true)
  }

  const closeServiceDialog = () => {
    setIsServiceModalOpen(false)
    setSelectedPlanItem(null)
    setSelectedPlannedLog(null)
    setPrefillServiceItemId(undefined)
  }

  const displayName = vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`

  return (
    <>
      <section className="relative py-12 bg-background min-h-screen">
        <div
          aria-hidden="true"
          className="absolute inset-0 grid grid-cols-2 -space-x-52 opacity-20"
        >
          <div className="blur-[106px] h-56 bg-gradient-brand" />
          <div className="blur-[106px] h-32 bg-gradient-brand-r" />
        </div>

        <div className="relative container px-4 md:px-6 pt-24">
          <div className="mb-8">
            <Button
              variant="outline"
              className="mb-4 border-border text-muted-foreground hover:bg-muted hover:border-accent"
              asChild
            >
              <Link href={`/vehicle/${vehicleSlug}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Vehicle
              </Link>
            </Button>
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-bold text-foreground">Vehicle Service</h1>
                <p className="text-lg text-muted-foreground mt-2">
                  Service records and maintenance schedules for {displayName}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsFuelModalOpen(true)}
                  className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                >
                  <Fuel className="mr-2 h-4 w-4" /> Log Fuel
                </Button>
                <Button
                  onClick={openAddServiceModal}
                  className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                >
                  <Plus className="mr-2 h-4 w-4" /> Log Service
                </Button>
              </div>
            </div>
          </div>

          {/* Plan Section - No tabs, just show the plan content directly */}
          <div className="mt-8">
            <PlanTabContent
              vehicleId={vehicle.id}
              onMarkComplete={handleMarkComplete}
              onAddToPlan={handleAddToPlan}
              initialPlannedLogs={initialPlannedLogs}
              initialChecklistCategories={initialChecklistCategories}
              initialChecklistItems={initialChecklistItems}
              ref={servicePlanViewRef}
            />
          </div>
        </div>
      </section>

      <AddServiceDialog
        isOpen={isServiceModalOpen}
        onClose={closeServiceDialog}
        onSuccess={() => {
          closeServiceDialog()
          // Refresh the active plan section
          servicePlanViewRef.current?.refresh()
          router.refresh()
        }}
        planItem={selectedPlanItem}
        plannedLog={selectedPlannedLog}
        vehicleId={vehicle.id}
        lockStatusToHistory={!!selectedPlannedLog}
        prefillServiceItemId={prefillServiceItemId}
        prefillStatus={prefillStatus}
        initialCategories={initialChecklistCategories}
        initialItems={initialChecklistItems}
      />

      <AddFuelDialog
        isOpen={isFuelModalOpen}
        onClose={() => setIsFuelModalOpen(false)}
        vehicleId={vehicle.id}
        currentOdometer={vehicle.odometer ?? null}
      />
    </>
  )
}
