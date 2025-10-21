'use client';

import React, { Suspense } from 'react';
import { supabase } from "../../lib/supabase";
import { AuthProvider } from "@repo/ui/auth-context";
import { HeaderKPIs } from './_components/HeaderKPIs';
import { Workstack } from './_components/Workstack';
import { RecentActivity } from './_components/RecentActivity';
import { VehicleSwitcher } from './_components/VehicleSwitcher';
import { Meters } from './_components/Meters';
import { TierAssistant } from './_components/TierAssistant';
import { UpgradeHooks } from './_components/UpgradeHooks';

function GarageDashboard() {
  return (
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
          <h1 className="text-4xl font-bold text-white mb-2">My Garage</h1>
        </div>

        {/* Header KPIs Row */}
        <Suspense fallback={<KPISkeleton />}>
          <HeaderKPIs />
        </Suspense>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Left Column: Workstack + Recent Activity */}
          <div className="lg:col-span-2 space-y-6">
            <Suspense fallback={<WorkstackSkeleton />}>
              <Workstack />
            </Suspense>

            <Suspense fallback={<ActivitySkeleton />}>
              <RecentActivity />
            </Suspense>
          </div>

          {/* Right Column: Context Panel */}
          <div className="space-y-6">
            <Suspense fallback={<SwitcherSkeleton />}>
              <VehicleSwitcher />
            </Suspense>

            <Suspense fallback={<MetersSkeleton />}>
              <Meters />
            </Suspense>

            <Suspense fallback={<AssistantSkeleton />}>
              <TierAssistant />
            </Suspense>

            <Suspense fallback={<UpgradeSkeleton />}>
              <UpgradeHooks />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  );
}

// Skeleton components for loading states
function KPISkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-gray-800 rounded-lg p-4 animate-pulse">
          <div className="h-4 bg-gray-700 rounded mb-2"></div>
          <div className="h-6 bg-gray-700 rounded"></div>
        </div>
      ))}
    </div>
  );
}

function WorkstackSkeleton() {
  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <div className="h-6 bg-gray-700 rounded mb-4 animate-pulse"></div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-800 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <div className="h-6 bg-gray-700 rounded mb-4 animate-pulse"></div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-800 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
  );
}

function SwitcherSkeleton() {
  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <div className="h-6 bg-gray-700 rounded mb-4 animate-pulse"></div>
      <div className="h-20 bg-gray-800 rounded animate-pulse"></div>
    </div>
  );
}

function MetersSkeleton() {
  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <div className="h-6 bg-gray-700 rounded mb-4 animate-pulse"></div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-800 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
  );
}

function AssistantSkeleton() {
  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <div className="h-6 bg-gray-700 rounded mb-4 animate-pulse"></div>
      <div className="h-32 bg-gray-800 rounded animate-pulse"></div>
    </div>
  );
}

function UpgradeSkeleton() {
  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <div className="h-6 bg-gray-700 rounded mb-4 animate-pulse"></div>
      <div className="h-24 bg-gray-800 rounded animate-pulse"></div>
    </div>
  );
}

export default function Garage() {
  return (
    <AuthProvider supabase={supabase}>
      <GarageDashboard />
    </AuthProvider>
  );
}
