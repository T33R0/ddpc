'use client';

import React, { useState } from 'react';
import { useAuth } from '../../lib/auth';
import { useVehicles } from '../../lib/hooks/useVehicles';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Badge } from '@repo/ui/badge';
import { useRouter } from 'next/navigation';
import { Search, Plus, AlertTriangle, Calendar, FileText, BarChart, Receipt, Download, Car, Activity, Wrench, Fuel, Settings } from 'lucide-react';

export default function ConsolePage() {
  const { user, loading: authLoading } = useAuth();
  const { data: vehiclesData, isLoading: vehiclesLoading } = useVehicles();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    router.push('/');
    return null;
  }

  const vehicles = vehiclesData?.vehicles || [];
  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.ymmt.toLowerCase().includes(searchTerm.toLowerCase());

    switch (selectedFilter) {
      case 'Active':
        return matchesSearch; // For now, assume all vehicles are active
      case 'Needs Attention':
        return matchesSearch && Math.random() > 0.7; // Mock filter
      case 'Service Due':
        return matchesSearch && Math.random() > 0.8; // Mock filter
      case 'Inactive':
        return matchesSearch && Math.random() > 0.9; // Mock filter
      default:
        return matchesSearch;
    }
  });

  const getVehicleStatus = (vehicle: any) => {
    // Mock status logic - in real app this would come from data
    const statuses = ['Active', 'Needs Attention', 'Service Due', 'Inactive'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'Needs Attention': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'Service Due': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'Inactive': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <section className="relative py-12 bg-black min-h-screen">
      {/* Background gradient effects */}
      <div
        aria-hidden="true"
        className="absolute inset-0 grid grid-cols-2 -space-x-52 opacity-20"
      >
        <div className="blur-[106px] h-56 bg-gradient-to-br from-red-500 to-purple-400" />
        <div className="blur-[106px] h-32 bg-gradient-to-r from-cyan-400 to-sky-300" />
      </div>

      <div className="relative container px-4 md:px-6 pt-24">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <h1 className="text-4xl font-bold text-white">Vehicle Console</h1>
          <Button className="bg-red-600 hover:bg-red-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Log New Entry
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4 mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search vehicles by nickname, make, model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-900 border-gray-700 text-white placeholder-gray-400"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {['All', 'Active', 'Needs Attention', 'Service Due', 'Inactive'].map((filter) => (
              <Button
                key={filter}
                variant={selectedFilter === filter ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilter(filter)}
                className={selectedFilter === filter
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800"
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="bg-gray-900 border-gray-800">
                    <CardContent className="p-6">
                      <div className="animate-pulse space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="h-6 bg-gray-700 rounded w-32"></div>
                            <div className="h-4 bg-gray-700 rounded w-24"></div>
                          </div>
                          <div className="h-6 bg-gray-700 rounded w-20"></div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center space-y-2">
                            <div className="h-4 bg-gray-700 rounded"></div>
                            <div className="h-6 bg-gray-700 rounded"></div>
                          </div>
                          <div className="text-center space-y-2">
                            <div className="h-4 bg-gray-700 rounded"></div>
                            <div className="h-6 bg-gray-700 rounded"></div>
                          </div>
                          <div className="text-center space-y-2">
                            <div className="h-4 bg-gray-700 rounded"></div>
                            <div className="h-6 bg-gray-700 rounded"></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredVehicles.length === 0 ? (
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-12 text-center">
                  <Car className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No vehicles found</h3>
                  <p className="text-gray-400">Add your first vehicle to get started.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredVehicles.map((vehicle) => {
                  const status = getVehicleStatus(vehicle) || 'Active';
                  return (
                    <Card key={vehicle.id} className="bg-gray-900 border-gray-800 hover:border-red-500/50 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-white">{vehicle.name}</h3>
                            <p className="text-sm text-gray-400">{vehicle.ymmt}</p>
                          </div>
                          <Badge className={`text-xs ${getStatusColor(status)}`}>
                            {status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="text-center">
                            <p className="text-xs text-gray-400">Odometer</p>
                            <p className="text-sm font-medium text-white">
                              {vehicle.odometer ? `${vehicle.odometer.toLocaleString()} mi` : '---'}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-400">Fuel Level</p>
                            <p className="text-sm font-medium text-white">---</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-400">Avg. MPG</p>
                            <p className="text-sm font-medium text-white">---</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <Button size="sm" variant="outline" className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300">
                            <Activity className="w-3 h-3 mr-1" />
                            History
                          </Button>
                          <Button size="sm" variant="outline" className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300">
                            <Wrench className="w-3 h-3 mr-1" />
                            Service
                          </Button>
                          <Button size="sm" variant="outline" className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300">
                            <Fuel className="w-3 h-3 mr-1" />
                            Fuel
                          </Button>
                          <Button size="sm" variant="outline" className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300">
                            <Settings className="w-3 h-3 mr-1" />
                            Mods
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Priority Alerts */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Priority Alerts &amp; Reminders</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-red-500/10 text-red-500">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-white text-sm">Service Overdue</p>
                    <p className="text-xs text-gray-400">---</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-yellow-500/10 text-yellow-500">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-white text-sm">Registration Expiring</p>
                    <p className="text-xs text-gray-400">---</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-yellow-500/10 text-yellow-500">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-white text-sm">Document Pending</p>
                    <p className="text-xs text-gray-400">---</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-4">
                  <Button size="sm" variant="outline" className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300">
                    View All
                  </Button>
                  <Button size="sm" variant="outline" className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300">
                    Upload
                  </Button>
                  <Button size="sm" variant="outline" className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300">
                    Schedule
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Financial Snapshot */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Financial Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">$0</p>
                    <p className="text-xs text-gray-400">Total Spend</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">$0</p>
                    <p className="text-xs text-gray-400">Avg Monthly</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">0</p>
                    <p className="text-xs text-gray-400">Total Logs</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button size="sm" variant="ghost" className="w-full justify-start text-gray-300 hover:bg-gray-800">
                    <BarChart className="w-4 h-4 mr-2" />
                    View Reports
                  </Button>
                  <Button size="sm" variant="ghost" className="w-full justify-start text-gray-300 hover:bg-gray-800">
                    <Receipt className="w-4 h-4 mr-2" />
                    Manage Receipts
                  </Button>
                  <Button size="sm" variant="ghost" className="w-full justify-start text-gray-300 hover:bg-gray-800">
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
