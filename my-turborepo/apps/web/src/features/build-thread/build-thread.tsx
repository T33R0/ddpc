'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

interface BuildThreadEvent {
  event_id: string;
  event_title: string;
  description: string;
  event_date: string;
  event_type: 'Modification' | 'Maintenance';
  status: string;
}

interface BuildThreadProps {
  vehicleId: string;
}

export function BuildThread({ vehicleId }: BuildThreadProps) {
  const [events, setEvents] = useState<BuildThreadEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBuildThread() {
      if (!vehicleId) return;

      try {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_vehicle_build_thread', {
          vehicle_id_param: vehicleId,
        });

        if (error) {
          throw error;
        }

        setEvents(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setLoading(false);
      }
    }

    fetchBuildThread();
  }, [vehicleId]);

  if (loading) {
    return <div>Loading build thread...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <div key={event.event_id} className="bg-gray-800 p-4 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-sm font-bold ${event.event_type === 'Modification' ? 'text-lime-400' : 'text-cyan-400'}`}>
                {event.event_type}
              </p>
              <h3 className="text-lg font-bold text-white">{event.event_title}</h3>
              <p className="text-gray-400 text-sm">{event.description}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-300">{new Date(event.event_date).toLocaleDateString()}</p>
              {event.event_type === 'Modification' && (
                <span className="text-xs bg-gray-700 text-white px-2 py-1 rounded-full mt-1 inline-block">
                  {event.status}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
