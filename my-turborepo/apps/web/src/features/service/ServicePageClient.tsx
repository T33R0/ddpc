'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@repo/ui/button';
import { Plus } from 'lucide-react';
import { ServiceHistoryTable } from '@/features/service/components/ServiceHistoryTable';
import { UpcomingServices } from '@/features/service/components/UpcomingServices';
import { AddServiceDialog } from '@/features/service/components/AddServiceDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs';
import { ServiceInterval, MaintenanceLog } from '@repo/types';
import { UpcomingService } from '@/features/service/lib/getVehicleServiceData';

interface ServicePageClientProps {
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: string;
    nickname?: string | null;
  };
  initialPlan: ServiceInterval[];
  initialHistory: MaintenanceLog[];
  initialScheduled: MaintenanceLog[];
}

export function ServicePageClient({ 
  vehicle, 
  initialPlan, 
  initialHistory, 
  initialScheduled // eslint-disable-line @typescript-eslint/no-unused-vars
}: ServicePageClientProps) {
  // Note: initialScheduled is reserved for future use when displaying scheduled future services
  // Currently not used but kept for API compatibility
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<ServiceInterval | null>(null)
  const router = useRouter()

  const displayName = vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`

  // Transform ServiceInterval to UpcomingService format for the UpcomingServices component
  const upcomingServices: UpcomingService[] = initialPlan.map((interval) => ({
    id: interval.id,
    name: interval.name,
    description: interval.description || interval.master_service_schedule?.description || undefined,
    interval_months: interval.interval_months ?? undefined,
    interval_miles: interval.interval_miles ?? undefined,
    due_date: interval.due_date ? new Date(interval.due_date) : null,
    due_miles: interval.due_miles ?? undefined,
    is_overdue: false, // For now, all are "Due" as per requirements
  }))

  const handleLogService = (service: UpcomingService) => {
    // Find the corresponding ServiceInterval
    const interval = initialPlan.find(si => si.id === service.id)
    if (interval) {
      setSelectedService(interval);
      setIsAddDialogOpen(true);
    }
  };

  const closeDialog = () => {
    setIsAddDialogOpen(false);
    setSelectedService(null);
  }

  // Transform MaintenanceLog to ServiceHistoryItem format
  const serviceHistory = initialHistory.map((log) => ({
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
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white">Vehicle Service</h1>
              <p className="text-lg text-gray-400 mt-2">
                Service records and maintenance schedules for {displayName}
              </p>
            </div>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </div>

          <Tabs defaultValue="plan" className="w-full text-white">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="plan">Plan</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            <TabsContent value="plan">
              <div className="space-y-8 mt-4">
                <UpcomingServices 
                  upcomingServices={upcomingServices} 
                  onLogService={handleLogService}
                />
              </div>
            </TabsContent>
            <TabsContent value="history">
              <div className="space-y-8 mt-4">
                <ServiceHistoryTable serviceHistory={serviceHistory} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <AddServiceDialog
        isOpen={isAddDialogOpen}
        onClose={closeDialog}
        onSuccess={() => {
          closeDialog();
          router.refresh();
        }}
        initialData={selectedService ? {
          id: selectedService.id,
          name: selectedService.name,
          description: selectedService.description || selectedService.master_service_schedule?.description || undefined,
          interval_months: selectedService.interval_months ?? undefined,
          interval_miles: selectedService.interval_miles ?? undefined,
          due_date: selectedService.due_date ? new Date(selectedService.due_date) : null,
          due_miles: selectedService.due_miles ?? undefined,
          is_overdue: false,
        } : undefined}
        vehicleId={vehicle.id}
      />
    </>
  );
}

