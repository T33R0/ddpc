'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ServiceInterval,
  MaintenanceLog,
} from '@repo/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { Button } from '@repo/ui/button'
import { Plus, Fuel } from 'lucide-react'
import { AddServiceDialog } from '@/features/service/components/AddServiceDialog'
import { AddFuelDialog } from '@/features/fuel/components/AddFuelDialog'
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
    odometer?: number | null
  }
  initialPlan: ServiceInterval[]
  initialHistory: MaintenanceLog[]
  initialScheduled: MaintenanceLog[]
}

// -----------------
// HELPER FUNCTION: Calculate Due Status
// -----------------
type DueStatus = {
  status: 'overdue' | 'due' | 'ok'
  message: string
}

function getDueStatus(
  item: ServiceInterval,
  currentOdometer: number | null
): DueStatus {
  const now = new Date()
  const currentMiles = currentOdometer || 0

  // Case 1: Item has never been completed (due_miles is null)
  // This means it's due based on its *base* interval.
  if (item.due_miles === null) {
    // If current miles are *over* the base interval, it's overdue
    if (currentMiles > (item.interval_miles || 0)) {
      return {
        status: 'overdue',
        message: `Overdue (Interval: ${item.interval_miles?.toLocaleString()} mi)`,
      }
    }
    // Otherwise, it's just "Due"
    return {
      status: 'due',
      message: `Due Now (First service)`,
    }
  }

  // Case 2: Item *has* been completed, so it has a calculated due_miles/due_date
  const dueMiles = item.due_miles || 0
  const dueDate = item.due_date ? new Date(item.due_date) : null
  const milesRemaining = dueMiles - currentMiles

  // Check Overdue status first (most critical)
  if (currentMiles >= dueMiles || (dueDate && now > dueDate)) {
    return {
      status: 'overdue',
      message: `Overdue (Due at ${dueMiles.toLocaleString()} mi)`,
    }
  }

  // Check Due Soon status
  const milesWarningThreshold = (item.interval_miles || 10000) * 0.1 // 10% threshold
  if (milesRemaining <= milesWarningThreshold) {
    return {
      status: 'due',
      message: `Due in ${milesRemaining.toLocaleString()} miles`,
    }
  }

  // Otherwise, it's OK
  return {
    status: 'ok',
    message: `Due at ${dueMiles.toLocaleString()} miles`,
  }
}

// -----------------
// HELPER COMPONENTS (to keep the main component clean)
// -----------------

// The "Plan" tab's content
function PlanTabContent({
  planItems,
  scheduledItems,
  onLogPlanItem,
  currentOdometer,
}: {
  planItems: ServiceInterval[]
  scheduledItems: MaintenanceLog[]
  onLogPlanItem: (item: ServiceInterval) => void
  currentOdometer: number | null
}) {
  // Transform ServiceInterval to UpcomingService format for the UpcomingServices component
  const upcomingServices: UpcomingService[] = planItems.map((interval) => {
    const dueStatus = getDueStatus(interval, currentOdometer)
    return {
      id: interval.id,
      name: interval.name,
      description: interval.description || interval.master_service_schedule?.description || undefined,
      interval_months: interval.interval_months ?? undefined,
      interval_miles: interval.interval_miles ?? undefined,
      due_date: interval.due_date ? new Date(interval.due_date) : null,
      due_miles: interval.due_miles ?? undefined,
      is_overdue: dueStatus.status === 'overdue',
      due_status: dueStatus.status,
      due_message: dueStatus.message,
    }
  })

  // Handler that converts UpcomingService back to ServiceInterval and calls onLogPlanItem
  const handleLogService = (service: UpcomingService) => {
    const interval = planItems.find(si => si.id === service.id)
    if (interval) {
      onLogPlanItem(interval)
    }
  }

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
          onLogService={handleLogService}
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
  
  // Modal state for Service dialog
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false)

  // This will be used to pass a selected plan item to the modal
  const [selectedPlanItem, setSelectedPlanItem] = useState<ServiceInterval | null>(null)

  // Modal state for Fuel dialog
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false)

  // Handler for the "+ Add Service" button (free-text)
  const openAddServiceModal = () => {
    setSelectedPlanItem(null) // Clear any selected item
    setIsServiceModalOpen(true)
  }

  // Handler for the "Log Service" button (guided)
  const openLogPlanItemModal = (item: ServiceInterval) => {
    setSelectedPlanItem(item) // Set the selected item
    setIsServiceModalOpen(true)
  }

  const closeServiceDialog = () => {
    setIsServiceModalOpen(false)
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
            <div className="flex gap-2">
              <Button 
                onClick={() => setIsFuelModalOpen(true)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Fuel className="mr-2 h-4 w-4" /> Log Fuel
              </Button>
              <Button 
                onClick={openAddServiceModal}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Service
              </Button>
            </div>
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
                onLogPlanItem={openLogPlanItemModal}
                currentOdometer={vehicle.odometer ?? null}
              />
            </TabsContent>

            <TabsContent value="history">
              <HistoryTabContent historyItems={initialHistory} />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <AddServiceDialog
        isOpen={isServiceModalOpen}
        onClose={closeServiceDialog}
        onSuccess={() => {
          closeServiceDialog()
          router.refresh()
        }}
        planItem={selectedPlanItem}
        vehicleId={vehicle.id}
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
