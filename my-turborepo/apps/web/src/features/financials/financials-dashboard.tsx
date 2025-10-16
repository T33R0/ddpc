'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '@repo/ui/auth-context';

interface VehicleFinancials {
  vehicle_id: string;
  nickname: string;
  odometer: number;
  total_spend: number;
  mods_spend: number;
  maintenance_spend: number;
  cost_per_mile: number;
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
        const { data, error } = await supabase.rpc('get_user_vehicle_financials');

        if (error) {
          throw error;
        }

        setFinancials(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setLoading(false);
      }
    }

    fetchFinancials();
  }, [session]);

  if (loading) {
    return <div>Loading financial data...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h2 className="text-xl font-bold text-white mb-4">Financial Clarity Dashboard</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-white">
          <thead>
            <tr className="border-b border-gray-600">
              <th className="text-left py-2 px-3">Vehicle</th>
              <th className="text-right py-2 px-3">Total Spend</th>
              <th className="text-right py-2 px-3">Mods Spend</th>
              <th className="text-right py-2 px-3">Maintenance Spend</th>
              <th className="text-right py-2 px-3">Cost Per Mile</th>
            </tr>
          </thead>
          <tbody>
            {financials.map((v) => (
              <tr key={v.vehicle_id} className="border-b border-gray-700">
                <td className="py-2 px-3">{v.nickname}</td>
                <td className="text-right py-2 px-3">${v.total_spend.toFixed(2)}</td>
                <td className="text-right py-2 px-3">${v.mods_spend.toFixed(2)}</td>
                <td className="text-right py-2 px-3">${v.maintenance_spend.toFixed(2)}</td>
                <td className="text-right py-2 px-3">${v.cost_per_mile ? v.cost_per_mile.toFixed(2) : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
