import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { Button } from '@repo/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/table';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabase';
import { useAuth } from '@repo/ui/auth-context';
import { DollarSign, TrendingUp, Car, BarChart3, Download } from 'lucide-react';

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

export function FinancialsDashboard() {
  const { session } = useAuth();
  const [financials, setFinancials] = useState<VehicleFinancials[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    const highestCostVehicle = financials.length > 0
      ? financials.reduce((max, v) =>
        v.total_spend > max.total_spend ? v : max)
      : null;

    return {
      totalVehicles,
      totalSpend,
      averageCostPerMile,
      totalModsSpend,
      totalMaintenanceSpend,
      highestCostVehicle,
    };
  }, [financials]);

  // Chart Colors (Semantic)
  const COLORS = {
    mods: 'hsl(var(--accent))',
    maintenance: 'hsl(var(--secondary))',
    bar: 'hsl(var(--primary))'
  };

  // Prepare chart data
  const spendingByCategoryData = [
    { name: 'Mods', value: overallStats.totalModsSpend, color: COLORS.mods },
    { name: 'Maintenance', value: overallStats.totalMaintenanceSpend, color: COLORS.maintenance },
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
        <div className="text-muted-foreground">Loading financial data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <DollarSign className="w-8 h-8 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Unable to Load Financial Data</h3>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center text-muted-foreground">
              <Car className="w-4 h-4 mr-2" />
              Total Vehicles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overallStats.totalVehicles}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center text-muted-foreground">
              <DollarSign className="w-4 h-4 mr-2" />
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              ${overallStats.totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center text-muted-foreground">
              <TrendingUp className="w-4 h-4 mr-2" />
              Avg Cost/Mile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${overallStats.averageCostPerMile.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Highest Cost Vehicle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {overallStats.highestCostVehicle?.nickname || 'N/A'}
            </div>
            <div className="text-xs text-muted-foreground">
              ${overallStats.highestCostVehicle?.total_spend.toFixed(0) || 0} total
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Spending Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
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
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center space-x-6 mt-4">
              {spendingByCategoryData.map((item) => (
                <div key={item.name} className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {item.name}: ${(item.value as number).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Costs Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Vehicle Costs Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vehicleCostData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      name === 'cost' ? `$${value.toLocaleString()}` : `$${value.toFixed(2)}/mi`,
                      name === 'cost' ? 'Total Cost' : 'Cost per Mile'
                    ]}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                    cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                  />
                  <Bar dataKey="cost" fill={COLORS.bar} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Detailed Breakdown</CardTitle>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="text-right">Mileage</TableHead>
                <TableHead className="text-right">Total Spend</TableHead>
                <TableHead className="text-right">Mods</TableHead>
                <TableHead className="text-right">Maintenance</TableHead>
                <TableHead className="text-right">Cost/Mile</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {financials.map((vehicle) => (
                <TableRow key={vehicle.vehicle_id}>
                  <TableCell>
                    <div className="font-medium">{vehicle.nickname}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">{vehicle.ymmt}</div>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {vehicle.odometer.toLocaleString()} mi
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-medium text-primary">
                      ${vehicle.total_spend.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-orange-600 dark:text-orange-400">
                    ${vehicle.mods_spend.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right text-blue-600 dark:text-blue-400">
                    ${vehicle.maintenance_spend.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`font-medium ${vehicle.cost_per_mile > overallStats.averageCostPerMile ? 'text-destructive' : 'text-green-600 dark:text-green-400'
                      }`}>
                      ${vehicle.cost_per_mile.toFixed(2)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {financials.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No financial data available. Add some maintenance or modification records to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
