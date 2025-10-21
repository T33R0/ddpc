import { useState, useEffect } from 'react';

interface Vehicle {
  id: string;
  name: string;
  mileage: number;
}

export function useVehicles() {
  const [data, setData] = useState<Vehicle[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setIsLoading(true);
        // This should call the existing /api/garage/vehicles endpoint
        const response = await fetch('/api/garage/vehicles');
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Authentication required');
          }
          throw new Error('Failed to fetch vehicles');
        }
        const result = await response.json();

        // Transform the response to match our interface
        const vehicles: Vehicle[] = result.vehicles?.map((vehicle: any) => ({
          id: vehicle.id,
          name: vehicle.nickname || `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}`.trim() || 'Unknown Vehicle',
          mileage: vehicle.current_mileage || vehicle.odometer || 0,
        })) || [];

        setData(vehicles);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  return { data, isLoading, error };
}
