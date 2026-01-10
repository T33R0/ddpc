'use client';

import React, { useState } from 'react';
import { useAuth } from '../../lib/auth';
import { useVehicles } from '../../lib/hooks/useVehicles';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { useRouter } from 'next/navigation';
import { Search, Plus, AlertTriangle, Calendar, FileText, BarChart, Receipt, Download, Car, Activity, Wrench, Fuel, Settings } from 'lucide-react';
import { VehicleStatusBadge } from '@/components/vehicle-status-badge';

import { GalleryLoadingSkeleton } from '../../components/gallery-loading-skeleton';
import { useSearch } from '../../lib/hooks/useSearch';
import { searchConsoleVehicle } from '../../lib/search';
import { useConsoleStats } from '../../lib/hooks/useConsoleStats';
import { getVehicleSlug } from '../../lib/vehicle-utils-client';
import { DashboardCard } from '@/components/dashboard-card';
import { ProGate } from '@/components/paywall/ProGate';

export default function ConsolePage() {
  const { user, loading: authLoading } = useAuth();
  const { data: vehiclesData, isLoading: vehiclesLoading } = useVehicles();
  const { data: consoleStats } = useConsoleStats();
  const router = useRouter();
  const vehicles = vehiclesData?.vehicles || [];

  const {
    searchQuery: searchTerm,
    setSearchQuery: setSearchTerm,
    filteredItems: searchFilteredVehicles
  } = useSearch(vehicles, searchConsoleVehicle);

  const [selectedFilter, setSelectedFilter] = useState('All');


  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    router.push('/');
    return null;
  }

  const filteredVehicles = searchFilteredVehicles.filter(vehicle => {
    const serviceStatus = consoleStats?.vehicleServiceStatus?.[vehicle.id];

    switch (selectedFilter) {
      case 'Active':
        return vehicle.current_status === 'active';
      case 'Needs Attention':
        return serviceStatus?.needsAttention || false;
      case 'Service Due':
        return serviceStatus?.serviceDue || false;
      case 'Inactive':
        return ['inactive', 'retired', 'archived'].includes(vehicle.current_status);
      default:
        return true;
    }
  });

  return (
    <section className="relative py-12 min-h-screen bg-background text-foreground">
      {/* Background gradient effects */}
      <div
        aria-hidden="true"
        className="absolute inset-0 grid grid-cols-2 -space-x-52 opacity-20 pointer-events-none"
      >
        <div className="blur-[106px] h-56 bg-gradient-to-br from-red-500 to-purple-400" />
        <div className="blur-[106px] h-32 bg-gradient-to-r from-cyan-400 to-sky-300" />
      </div>

      <div className="relative container px-4 md:px-6 pt-24">
        <ProGate>
          {/* Page Header */}
          <h1 className="text-4xl font-bold mb-8 text-foreground">Vehicle Console</h1>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-lg font-medium text-foreground">Manage your vehicles:</span>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => router.push('/hub')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Log New Entry
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="space-y-4 mb-8">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search vehicles by nickname, make, model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-card border-input text-foreground placeholder-muted-foreground"
              />
            </div>

            <div className="flex gap-3 flex-wrap">
              {['All', 'Active', 'Needs Attention', 'Service Due', 'Inactive', 'Archived'].map((filter) => (
                <Button
                  key={filter}
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedFilter(filter)}
                  className={selectedFilter === filter
                    ? "bg-red-600 hover:bg-red-700 text-white border-red-600"
                    : "flex items-center justify-center gap-2 bg-card border-border hover:bg-accent hover:text-accent-foreground text-foreground"
                  }
                >
                  {filter}
                </Button>
              ))}
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {vehiclesLoading ? (
                <GalleryLoadingSkeleton />
              ) : filteredVehicles.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <Car className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <div className="text-gray-400 text-lg mb-2">No vehicles found</div>
                    <div className="text-gray-500 text-sm">Add your first vehicle to get started</div>
                  </div>
                </div>
              ) : (
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                  {filteredVehicles.map((vehicle) => {
                    // Use the smart slug generation (nickname if unique, YMMT otherwise, ID as fallback)
                    const slug = getVehicleSlug(vehicle, vehicles);
                    const imageUrl = vehicle.image_url || '/branding/fallback-logo.png';

                    return (
                      <div
                        key={vehicle.id}
                        onClick={() => router.push(`/vehicle/${encodeURIComponent(slug)}/parts`)}
                      >
                        <DashboardCard
                          className="relative min-h-[240px] p-0 overflow-hidden flex flex-col justify-end"
                        >
                          {/* Background Image */}
                          <div
                            className="absolute inset-0 bg-cover bg-center transition-opacity duration-300 group-hover:opacity-30 opacity-40"
                            style={{ backgroundImage: `url('${imageUrl}')` }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />

                          <div className="relative z-10 p-6 flex flex-col gap-4 w-full">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="text-lg font-bold text-foreground drop-shadow-md">{vehicle.name}</h3>
                                <p className="text-sm text-muted-foreground drop-shadow-sm">{vehicle.ymmt}</p>
                              </div>
                              <VehicleStatusBadge status={vehicle.current_status} />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                              <div className="text-center">
                                <p className="text-xs text-muted-foreground">Odometer</p>
                                <p className="text-sm font-medium text-foreground">
                                  {vehicle.odometer ? `${vehicle.odometer.toLocaleString()} mi` : '---'}
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-muted-foreground">Fuel Level</p>
                                <p className="text-sm font-medium text-foreground">
                                  {consoleStats?.vehicleStats?.[vehicle.id]?.fuelPercentage
                                    ? `${consoleStats.vehicleStats[vehicle.id]?.fuelPercentage}%`
                                    : '---'}
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-muted-foreground">Avg. MPG</p>
                                <p className="text-sm font-medium text-foreground">
                                  {consoleStats?.vehicleStats?.[vehicle.id]?.avgMpg
                                    ? consoleStats.vehicleStats[vehicle.id]?.avgMpg?.toFixed(1)
                                    : '---'}
                                </p>
                              </div>
                            </div>

                          </div>
                        </DashboardCard>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Priority Alerts */}
              <div className="bg-card backdrop-blur-lg rounded-2xl p-6 border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">Priority Alerts &amp; Reminders</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-red-500/10 text-red-500">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">Service Overdue</p>
                      <p className="text-xs text-muted-foreground">---</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-yellow-500/10 text-yellow-500">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">Registration Expiring</p>
                      <p className="text-xs text-muted-foreground">---</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-yellow-500/10 text-yellow-500">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">Document Pending</p>
                      <p className="text-xs text-muted-foreground">---</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-card border-border hover:bg-accent text-muted-foreground hover:text-accent-foreground"
                      onClick={() => router.push('/console/alerts')}
                    >
                      View All
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-card border-border hover:bg-accent text-muted-foreground hover:text-accent-foreground"
                      onClick={() => router.push('/console/documents')}
                    >
                      Upload
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-card border-border hover:bg-accent text-muted-foreground hover:text-accent-foreground"
                      onClick={() => router.push('/console/schedule')}
                    >
                      Schedule
                    </Button>
                  </div>
                </div>
              </div>

              {/* Financial Snapshot */}
              <div className="bg-card backdrop-blur-lg rounded-2xl p-6 border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">Financial Snapshot</h3>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Total Spend</p>
                      <p className="text-lg font-bold text-foreground">
                        ${consoleStats?.financials?.totalSpend?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Avg Monthly</p>
                      <p className="text-lg font-bold text-foreground">
                        ${consoleStats?.financials?.avgMonthly?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Total Logs</p>
                      <p className="text-lg font-bold text-foreground">
                        {consoleStats?.financials?.totalLogs || 0}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent"
                      onClick={() => router.push('/console/reports')}
                    >
                      <BarChart className="w-4 h-4 mr-2" />
                      View Reports
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent"
                      onClick={() => router.push('/console/receipts')}
                    >
                      <Receipt className="w-4 h-4 mr-2" />
                      Manage Receipts
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent"
                      onClick={() => router.push('/console/export')}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export Data
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ProGate>
      </div>


    </section>
  );
}
