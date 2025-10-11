'use client';

import React, { useState, useEffect } from 'react';
import { VehicleGallery } from "../../features/garage/garage-vehicle-gallery";
import { GarageStats } from "../../features/garage/garage-stats";
import { supabase } from "../../lib/supabase";
import { AuthProvider } from "@repo/ui/auth-context";
import { useAuth } from "@repo/ui/auth-context";
import type { Vehicle } from "@repo/types";

interface UserVehicle extends Vehicle {
  id: string;
  owner_id: string;
  nickname?: string;
  current_status: string;
  privacy: string;
  title?: string;
}

function GarageContent() {
  const [vehicles, setVehicles] = useState<UserVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <section className="relative py-12 bg-black min-h-screen">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-white text-lg">Loading...</div>
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="relative py-12 bg-black min-h-screen">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-red-400 text-lg">Please sign in to view your collection</div>
        </div>
      </section>
    );
  }

  // Effect to handle initial loading state
  useEffect(() => {
    if (!authLoading && !user) {
      setLoading(false);
    }
  }, [authLoading, user]);

  // Effect to fetch data when user becomes available
  useEffect(() => {
    if (authLoading || !user) return;

    let isMounted = true;

    async function fetchCollectionData() {
      try {
        if (isMounted) {
          setLoading(true);
          setError(null);
        }

        const session = await supabase.auth.getSession();
        if (!session.data.session?.access_token) {
          throw new Error('No access token available');
        }

        const response = await fetch('/api/garage/vehicles', {
          headers: {
            'Authorization': `Bearer ${session.data.session.access_token}`,
          },
        });

        if (!isMounted) return;

        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 401) {
            if (isMounted) {
              setError('Please sign in to access your collection');
            }
            return;
          }
          throw new Error(errorData.error || 'Failed to fetch vehicles');
        }

        const data = await response.json();
        if (isMounted) {
          setVehicles(data.vehicles || []);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to fetch collection data:', err);
          setError(err instanceof Error ? err.message : 'Failed to load collection');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchCollectionData();

    return () => {
      isMounted = false;
    };
  }, [authLoading, user]);

  if (loading) {
    return (
      <section className="relative py-12 bg-black min-h-screen">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-white text-lg">Loading your collection...</div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="relative py-12 bg-black min-h-screen">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-red-400 text-lg">Error: {error}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative py-12 bg-black min-h-screen">
      <div
        aria-hidden="true"
        className="absolute inset-0 grid grid-cols-2 -space-x-52 opacity-20"
      >
        <div className="blur-[106px] h-56 bg-gradient-to-br from-red-500 to-purple-400" />
        <div className="blur-[106px] h-32 bg-gradient-to-r from-cyan-400 to-sky-300" />
      </div>
      <div className="relative container px-4 md:px-6 pt-24">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">My Collection</h1>
          <p className="text-neutral-400">
            {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} in your collection
          </p>
        </div>

        <GarageStats vehicles={vehicles} />

        {vehicles.length > 0 ? (
          <VehicleGallery vehicles={vehicles} filters={{}} />
        ) : (
          <div className="text-center py-12">
            <div className="text-neutral-400 text-lg mb-4">
              Your collection is empty. Start by discovering and adding vehicles!
            </div>
            <a
              href="/discover"
              className="inline-block bg-lime-500 text-black px-6 py-3 rounded-lg font-semibold hover:bg-lime-400 transition-colors"
            >
              Discover Vehicles
            </a>
          </div>
        )}

      </div>
    </section>
  );
}

export default function Garage() {
  return (
    <AuthProvider supabase={supabase}>
      <GarageContent />
    </AuthProvider>
  );
}
