'use client';

import React from 'react';
import { useParams } from 'next/navigation';

export default function VehicleServicePage() {
  const params = useParams();
  const vehicleSlug = params.id as string;

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
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white">Vehicle Service</h1>
            <p className="text-lg text-gray-400 mt-2">Service records and maintenance schedules</p>
          </div>

          {/* Placeholder content */}
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">Service page content coming soon...</p>
          </div>
        </div>
      </section>
    </>
  );
}
