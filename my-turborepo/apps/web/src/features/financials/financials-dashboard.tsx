'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { Button } from '@repo/ui/button';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { supabase } from '../../lib/supabase';
import { useAuth } from '@repo/ui/auth-context';
import { DollarSign, TrendingUp, Wrench, Settings, Car, BarChart3, Download } from 'lucide-react';

interface VehicleFinancials {
  vehicle_id: string;
  nickname: string;
  ymmt: string;
  odometer: number;
  total_spend: number;
  mods_spend: number;
  maintenance_spend: number;
  cost_per_mile: number;
  fuel_spend?: number;
}

interface OverallStats {
  totalVehicles: number;
  totalSpend: number;
  averageCostPerMile: number;
  totalModsSpend: number;
  totalMaintenanceSpend: number;
  highestCostVehicle: VehicleFinancials | null;
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

export function FinancialsDashboard() {
  const { session } = useAuth();
  const [financials, setFinancials] = useState<VehicleFinancials[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'all' | 'year' | '6months'>('all');

  useEffect(() => {
    async function fetchFinancials() {
      if (!session) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch vehicle data with financial information
        const { data: vehicles, error: vehicleError } = await supabase
          .from('user_vehicle')
          .select('id, name, nickname, ymmt, odometer')
          .eq('owner_id', session.user.id);

        if (vehicleError) throw vehicleError;

        // Calculate financials for each vehicle
        const vehicleFinancials: VehicleFinancials[] = await Promise.all(
          (vehicles || []).map(async (vehicle) => {
            // Get maintenance costs
            const { data: maintenance } = await supabase
              .from('maintenance_log')
              .select('cost')
              .eq('user_vehicle_id', vehicle.id)
              .not('cost', 'is', null);

            // Get mods costs
            const { data: mods } = await supabase
              .from('mods')
              .select('cost')
              .eq('user_vehicle_id', vehicle.id)
              .not('cost', 'is', null);

            const maintenanceSpend = maintenance?.reduce((sum, item) => sum + (item.cost || 0), 0) || 0;
            const modsSpend = mods?.reduce((sum, item) => sum + (item.cost || 0), 0) || 0;
            const totalSpend = maintenanceSpend + modsSpend;
            const costPerMile = vehicle.odometer && vehicle.odometer > 0 ? totalSpend / vehicle.odometer : 0;

            return {
              vehicle_id: vehicle.id,
              nickname: vehicle.nickname || vehicle.name,
              ymmt: vehicle.ymmt,
              odometer: vehicle.odometer || 0,
              total_spend: totalSpend,
              mods_spend: modsSpend,
              maintenance_spend: maintenanceSpend,
              cost_per_mile: costPerMile,
            };
          })
        );

        setFinancials(vehicleFinancials);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setLoading(false);
      }
    }

    fetchFinancials();
  }, [session]);

  // Calculate overall statistics
  const overallStats: OverallStats = React.useMemo(() => {
    const totalVehicles = financials.length;
    const totalSpend = financials.reduce((sum, v) => sum + v.total_spend, 0);
    const totalModsSpend = financials.reduce((sum, v) => sum + v.mods_spend, 0);
    const totalMaintenanceSpend = financials.reduce((sum, v) => sum + v.maintenance_spend, 0);
    const averageCostPerMile = financials.length > 0
      ? financials.reduce((sum, v) => sum + v.cost_per_mile, 0) / financials.length
      : 0;
    const highestCostVehicle = financials.reduce((max, v) =>
      v.total_spend > (max?.total_spend || 0) ? v : max, null);

    return {
      totalVehicles,
      totalSpend,
      averageCostPerMile,
      totalModsSpend,
      totalMaintenanceSpend,
      highestCostVehicle,
    };
  }, [financials]);

  // Prepare chart data
  const spendingByCategoryData = [
    { name: 'Mods', value: overallStats.totalModsSpend, color: '#10B981' },
    { name: 'Maintenance', value: overallStats.totalMaintenanceSpend, color: '#3B82F6' },
  ].filter(item => item.value > 0);

  const vehicleCostData = financials
    .sort((a, b) => b.total_spend - a.total_spend)
    .slice(0, 10) // Top 10 vehicles by cost
    .map(vehicle => ({
      name: vehicle.nickname.length > 15 ? vehicle.nickname.substring(0, 15) + '...' : vehicle.nickname,
      cost: vehicle.total_spend,
      costPerMile: vehicle.cost_per_mile,
    }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-white">Loading financial data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <DollarSign className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Unable to Load Financial Data</h3>
        <p className="text-gray-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-medium flex items-center">
              <Car className="w-4 h-4 mr-2" />
              Total Vehicles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{overallStats.totalVehicles}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-medium flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              ${overallStats.totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-medium flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Avg Cost/Mile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              ${overallStats.averageCostPerMile.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-medium">
              Highest Cost Vehicle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium text-white">
              {overallStats.highestCostVehicle?.nickname || 'N/A'}
            </div>
            <div className="text-xs text-gray-400">
              ${overallStats.highestCostVehicle?.total_spend.toFixed(0) || 0} total
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Spending Breakdown */}
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-lg flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Spending Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={spendingByCategoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {spendingByCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`$${value.toLocaleString()}`, 'Amount']}
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center space-x-6 mt-4">
              {spendingByCategoryData.map((item, index) => (
                <div key={item.name} className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-300">
                    {item.name}: ${(item.value as number).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Costs Comparison */}
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-lg flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Vehicle Costs Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vehicleCostData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="name"
                    stroke="#9CA3AF"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    formatter={(value: any, name: string) => [
                      name === 'cost' ? `$${value.toLocaleString()}` : `$${value.toFixed(2)}/mi`,
                      name === 'cost' ? 'Total Cost' : 'Cost per Mile'
                    ]}
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="cost" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white text-lg">Detailed Breakdown</CardTitle>
          <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-white">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-left py-3 px-4">Vehicle</th>
                  <th className="text-left py-3 px-4">Details</th>
                  <th className="text-right py-3 px-4">Mileage</th>
                  <th className="text-right py-3 px-4">Total Spend</th>
                  <th className="text-right py-3 px-4">Mods</th>
                  <th className="text-right py-3 px-4">Maintenance</th>
                  <th className="text-right py-3 px-4">Cost/Mile</th>
                </tr>
              </thead>
              <tbody>
                {financials.map((vehicle) => (
                  <tr key={vehicle.vehicle_id} className="border-b border-gray-700 hover:bg-gray-800/50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-white">{vehicle.nickname}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-400">{vehicle.ymmt}</div>
                    </td>
                    <td className="text-right py-3 px-4 text-gray-300">
                      {vehicle.odometer.toLocaleString()} mi
                    </td>
                    <td className="text-right py-3 px-4">
                      <span className="font-medium text-green-400">
                        ${vehicle.total_spend.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="text-right py-3 px-4 text-orange-400">
                      ${vehicle.mods_spend.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="text-right py-3 px-4 text-blue-400">
                      ${vehicle.maintenance_spend.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="text-right py-3 px-4">
                      <span className={`font-medium ${
                        vehicle.cost_per_mile > overallStats.averageCostPerMile ? 'text-red-400' : 'text-green-400'
                      }`}>
                        ${vehicle.cost_per_mile.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
                {financials.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400">
                      No financial data available. Add some maintenance or modification records to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
