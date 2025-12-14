'use client';

import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { Badge } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs';
import {
  History,
  Wrench,
  Fuel,
  Settings,
  AlertTriangle,
  Calendar,
  FileText,
  BarChart3,
  Receipt,
  Download,
  Plus
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { VehicleCard } from '@/components/vehicle-card';
import { DashboardCard } from '@/components/dashboard-card';

interface ConsoleClientProps {
  vehicles: any[];
  user: User;
  isAdmin: boolean;
}

export function ConsoleClient({ vehicles, user, isAdmin }: ConsoleClientProps) {
  const router = useRouter();

  // Mock data for financial snapshot - in a real app this would come from the DB
  const financialData = {
    totalSpend: 16641.51,
    avgMonthly: 282.06,
    totalLogs: 184
  };

  const handleAction = (path: string) => {
    router.push(path);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Console</h1>
          <p className="text-muted-foreground">
            Manage your fleet, alerts, and reports.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-3">

        {/* Alerts & Financials (Mobile: Top, Desktop: Right Column) */}
        <div className="space-y-6 lg:col-start-3 lg:col-span-1">
          {/* Priority Alerts */}
          <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Priority Alerts & Reminders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
                <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
                <div>
                  <div className="font-medium">Service Overdue</div>
                  <div className="text-sm opacity-90">2021 Volkswagen Atlas SE w/Technology R-Line</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                <Calendar className="h-5 w-5 mt-0.5 shrink-0" />
                <div>
                  <div className="font-medium">Registration Expiring</div>
                  <div className="text-sm opacity-90">In 14 days</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-500/10 text-orange-500 border border-orange-500/20">
                <FileText className="h-5 w-5 mt-0.5 shrink-0" />
                <div>
                  <div className="font-medium">Document Pending</div>
                  <div className="text-sm opacity-90">Insurance renewal needed</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => handleAction('/console/alerts')}>View All</Button>
                <Button variant="ghost" size="sm" onClick={() => handleAction('/console/documents')}>Upload</Button>
                <Button variant="ghost" size="sm" onClick={() => handleAction('/console/schedule')}>Schedule</Button>
              </div>
            </CardContent>
          </Card>

          {/* Financial Snapshot */}
          <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Financial Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Spend</span>
                  <span className="font-bold text-lg">${financialData.totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Avg Monthly</span>
                  <span className="font-bold text-lg">${financialData.avgMonthly.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Logs</span>
                  <span className="font-bold text-lg">{financialData.totalLogs}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => handleAction('/console/reports')}>
                  <BarChart3 className="h-4 w-4" />
                  View Reports
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => handleAction('/console/receipts')}>
                  <Receipt className="h-4 w-4" />
                  Manage Receipts
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => handleAction('/console/export')}>
                  <Download className="h-4 w-4" />
                  Export Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vehicle List (Mobile: Bottom, Desktop: Left Column) */}
        <div className="space-y-6 lg:col-start-1 lg:col-span-2 lg:row-start-1">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your Fleet</h2>
            <Button size="sm" onClick={() => router.push('/garage/add')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Vehicle
            </Button>
          </div>

          <div className="grid gap-6">
            {vehicles.map((vehicle) => (
              <Card key={vehicle.id} className="overflow-hidden border-border/40 bg-card/40 backdrop-blur-sm">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
                        {vehicle.status === 'parked' && <Badge variant="secondary">Parked</Badge>}
                      </div>
                      <p className="text-muted-foreground">{vehicle.trim || 'Base Model'}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center text-sm">
                      <div>
                        <div className="text-muted-foreground">Odometer</div>
                        <div className="font-mono font-medium">{vehicle.mileage?.toLocaleString() || '---'}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Fuel Level</div>
                        <div className="font-mono font-medium">---</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Avg. MPG</div>
                        <div className="font-mono font-medium">---</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Button variant="outline" className="w-full gap-2" onClick={() => router.push(`/vehicle/${vehicle.id}/history`)}>
                      <History className="h-4 w-4" />
                      History
                    </Button>
                    <Button variant="outline" className="w-full gap-2" onClick={() => router.push(`/vehicle/${vehicle.id}/service`)}>
                      <Wrench className="h-4 w-4" />
                      Service
                    </Button>
                    <Button variant="outline" className="w-full gap-2" onClick={() => router.push(`/vehicle/${vehicle.id}/fuel`)}>
                      <Fuel className="h-4 w-4" />
                      Fuel
                    </Button>
                    <Button variant="outline" className="w-full gap-2" onClick={() => router.push(`/vehicle/${vehicle.id}/mods`)}>
                      <Settings className="h-4 w-4" />
                      Mods
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            {vehicles.length === 0 && (
              <Card className="p-8 text-center border-dashed">
                <p className="text-muted-foreground mb-4">No vehicles found in your garage.</p>
                <Button onClick={() => router.push('/garage/add')}>Add Your First Vehicle</Button>
              </Card>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
