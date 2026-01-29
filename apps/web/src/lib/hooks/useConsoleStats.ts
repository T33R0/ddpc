import { useState, useEffect } from 'react';

export interface ConsoleStats {
    vehicleStats: Record<string, {
        latestFuelGallons: number | null;
        avgMpg: number | null;
        fuelPercentage: number | null;
    }>;
    vehicleServiceStatus: Record<string, {
        needsAttention: boolean;
        serviceDue: boolean;
    }>;
    financials: {
        totalSpend: number;
        avgMonthly: number;
        totalLogs: number;
        breakdown: {
            maintenance: number;
            mods: number;
            fuel: number;
        };
    };
}

export function useConsoleStats() {
    const [data, setData] = useState<ConsoleStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchStats = async () => {
        try {
            setIsLoading(true);

            const response = await fetch('/api/console/stats');

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Authentication required');
                }
                throw new Error('Failed to fetch console stats');
            }

            const result: ConsoleStats = await response.json();
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Unknown error'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    return { data, isLoading, error, refetch: fetchStats };
}
