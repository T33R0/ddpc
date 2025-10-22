import { useState, useEffect } from 'react';

export interface Vehicle {
  id: string;
  name: string;
  ymmt: string;
  odometer: number | null;
}

export interface VehiclesData {
  vehicles: Vehicle[];
  preferredVehicleId?: string;
}

export function useVehicles() {
  const [data, setData] = useState<VehiclesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchVehicles = async () => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/garage/vehicles');

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        throw new Error('Failed to fetch vehicles');
      }

      const result: VehiclesData = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  return { data, isLoading, error, refetch: fetchVehicles };
}
