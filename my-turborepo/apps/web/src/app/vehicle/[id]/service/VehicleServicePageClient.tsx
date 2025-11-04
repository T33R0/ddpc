'use client';

import React, { useState } from 'react';
import { Button } from '@repo/ui/button';
import { Plus } from 'lucide-react';
import { ServiceHistoryTable } from '@/features/service/components/ServiceHistoryTable';
import { UpcomingServices } from '@/features/service/components/UpcomingServices';
import { AddServiceDialog } from '@/features/service/components/AddServiceDialog';
import { VehicleServiceData } from '@/features/service/lib/getVehicleServiceData';

interface VehicleServicePageClientProps {
  serviceData: VehicleServiceData;
}

export function VehicleServicePageClient({ serviceData }: VehicleServicePageClientProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

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
                Service records and maintenance schedules for {serviceData.vehicle.name}
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

          <div className="space-y-8">
            <UpcomingServices upcomingServices={serviceData.upcomingServices} />
            <ServiceHistoryTable serviceHistory={serviceData.serviceHistory} />
          </div>
        </div>
      </section>

      <AddServiceDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
      />
    </>
  );
}
