'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ServiceInterval,
  MaintenanceLog,
} from '@repo/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { Button } from '@repo/ui/button'
import { Plus } from 'lucide-react'
import { AddServiceDialog } from '@/features/service/components/AddServiceDialog'
import { UpcomingServices } from '@/features/service/components/UpcomingServices'
import { ServiceHistoryTable } from '@/features/service/components/ServiceHistoryTable'
import { UpcomingService } from '@/features/service/lib/getVehicleServiceData'
import { ServiceHistoryItem } from '@/features/service/lib/getVehicleServiceData'

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
  }
  initialPlan: ServiceInterval[]
  initialHistory: MaintenanceLog[]
  initialScheduled: MaintenanceLog[]
}

// -----------------
// HELPER COMPONENTS (to keep the main component clean)
// -----------------

// The "Plan" tab's content
function PlanTabContent({
  planItems,
  scheduledItems,
  onLogService,
}: {
  planItems: ServiceInterval[]
  scheduledItems: MaintenanceLog[]
  onLogService: (service: UpcomingService) => void
}) {
  // Transform ServiceInterval to UpcomingService format
  const upcomingServices: UpcomingService[] = planItems.map((interval) => ({
    id: interval.id,
    name: interval.name,
    description: interval.description || interval.master_service_schedule?.description || undefined,
    interval_months: interval.interval_months ?? undefined,
    interval_miles: interval.interval_miles ?? undefined,
    due_date: interval.due_date ? new Date(interval.due_date) : null,
    due_miles: interval.due_miles ?? undefined,
    is_overdue: false, // For now, all are "Due" as per requirements
  }))

  return (
    <div className="space-y-8 mt-4">
      {/* Section 1: Scheduled Maintenance (from maintenance_log)
        These are items you've already scheduled for the future.
      */}
      {scheduledItems.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white">Scheduled</h3>
          <div className="space-y-2">
            {scheduledItems.map((item) => (
              <div
                key={item.id}
                className="p-4 border rounded-md bg-gray-800/50 border-gray-700 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium text-white">{item.description}</p>
                  <p className="text-sm text-gray-400">
                    Scheduled for: {new Date(item.event_date).toLocaleDateString()}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 2: Factory Plan (from service_intervals)
        This is the "Due" list.
      */}
      <div>
        <UpcomingServices 
          upcomingServices={upcomingServices} 
          onLogService={onLogService}
        />
      </div>
    </div>
  )
}

// The "History" tab's content
function HistoryTabContent({ historyItems }: { historyItems: MaintenanceLog[] }) {
  // Transform MaintenanceLog to ServiceHistoryItem format
  const serviceHistory: ServiceHistoryItem[] = historyItems.map((log) => ({
    id: log.id,
    description: log.description,
    cost: log.cost || undefined,
    odometer: log.odometer || undefined,
    event_date: new Date(log.event_date),
    notes: log.notes || undefined,
    service_provider: log.service_provider || undefined,
    service_interval_id: log.service_interval_id || undefined,
  }))

  return (
    <div className="space-y-8 mt-4">
      <ServiceHistoryTable serviceHistory={serviceHistory} />
    </div>
  )
}

// -----------------
// MAIN COMPONENT
// -----------------
export function ServicePageClient({
  vehicle,
  initialPlan,
  initialHistory,
  initialScheduled,
}: ServicePageClientProps) {
  const router = useRouter()
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)

  // This will be used to pass a selected plan item to the modal
  const [selectedPlanItem, setSelectedPlanItem] = useState<ServiceInterval | null>(null)

  const openAddServiceModal = () => {
    setSelectedPlanItem(null) // Clear any selected item
    setIsModalOpen(true)
  }

  const handleLogService = (service: UpcomingService) => {
    // Find the corresponding ServiceInterval
    const interval = initialPlan.find(si => si.id === service.id)
    if (interval) {
      setSelectedPlanItem(interval)
      setIsModalOpen(true)
    }
  }

  const closeDialog = () => {
    setIsModalOpen(false)
    setSelectedPlanItem(null)
  }

  const displayName = vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`

  return (
    <>
      <section className="relative py-12 bg-black min-h-screen">
        <div
          aria-hidden="true"
          className="absolute inset-0 grid grid-cols-2 -space-x-52 opacity-20"
        >
          <div className="blur-[106px] h-56 bg-gradient-to-br from-red-500 to-purple-400" />
          <div className="blur-[106px] h-32 bg-gradient-to-r from-cyan-400 to-sky-300" />
        </div>

        <div className="relative container px-4 md:px-6 pt-24">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white">Vehicle Service</h1>
              <p className="text-lg text-gray-400 mt-2">
                Service records and maintenance schedules for {displayName}
              </p>
            </div>
            <Button 
              onClick={openAddServiceModal}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Service
            </Button>
          </div>

          <Tabs defaultValue="plan" className="w-full text-white">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="plan">Plan</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="plan">
              <PlanTabContent
                planItems={initialPlan}
                scheduledItems={initialScheduled}
                onLogService={handleLogService}
              />
            </TabsContent>

            <TabsContent value="history">
              <HistoryTabContent historyItems={initialHistory} />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <AddServiceDialog
        isOpen={isModalOpen}
        onClose={closeDialog}
        onSuccess={() => {
          closeDialog()
          router.refresh()
        }}
        initialData={selectedPlanItem ? {
          id: selectedPlanItem.id,
          name: selectedPlanItem.name,
          description: selectedPlanItem.description || selectedPlanItem.master_service_schedule?.description || undefined,
          interval_months: selectedPlanItem.interval_months ?? undefined,
          interval_miles: selectedPlanItem.interval_miles ?? undefined,
          due_date: selectedPlanItem.due_date ? new Date(selectedPlanItem.due_date) : null,
          due_miles: selectedPlanItem.due_miles ?? undefined,
          is_overdue: false,
        } : undefined}
        vehicleId={vehicle.id}
      />
    </>
  )
}
