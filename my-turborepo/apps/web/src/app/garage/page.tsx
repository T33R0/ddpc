'use client';

import React, { useState, useEffect } from 'react';
import { VehicleGallery } from "../../features/garage/garage-vehicle-gallery";
import { GarageShare } from "../../features/garage/components/garage-share";
import { GarageStats } from "../../features/garage/garage-stats";
import { supabase } from "../../lib/supabase";
import { useAuth } from "@repo/ui/auth-context";
import type { Vehicle } from "@repo/types";

interface UserVehicle extends Vehicle {
  id: string;
  garage_id: string;
  nickname?: string;
  current_status: string;
  privacy: string;
  title?: string;
}

export default function Garage() {
  const [vehicles, setVehicles] = useState<UserVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [garagePrivacy, setGaragePrivacy] = useState('PRIVATE');
  const [garageData, setGarageData] = useState<any>(null);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchGarageData() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch user's garage
        const { data: garageData, error: garageError } = await supabase
          .from('garage')
          .select('*')
          .eq('owner_id', user.id)
          .single();

        if (garageError) {
          if (garageError.code === 'PGRST116') {
            // No garage found, create one
            const { data: newGarage, error: createError } = await supabase
              .from('garage')
              .insert({
                owner_id: user.id,
                name: `${user.email}'s Garage`,
                description: 'My personal garage',
                privacy: 'PRIVATE'
              })
              .select()
              .single();

            if (createError) throw createError;

            setError('Welcome to your new garage! Start by adding some vehicles.');
            setGaragePrivacy('PRIVATE');
          }
          throw garageError;
        }

        setGarageData(garageData);
        setGaragePrivacy(garageData.privacy);

        // Fetch user's vehicles using the API
        const response = await fetch('/api/garage/vehicles', {
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 401) {
            setError('Please sign in to access your garage');
            return;
          }
          throw new Error(errorData.error || 'Failed to fetch vehicles');
        }

        const data = await response.json();
        setVehicles(data.vehicles);
        setGaragePrivacy(garageData.privacy);
      } catch (err) {
        console.error('Failed to fetch garage data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load garage');
      } finally {
        setLoading(false);
      }
    }

    fetchGarageData();
  }, [user]);

  if (loading) {
    return (
      <section className="relative py-12 bg-black min-h-screen">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-white text-lg">Loading your garage...</div>
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
          <h1 className="text-4xl font-bold text-white mb-2">My Garage</h1>
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
              Your garage is empty. Start by discovering and adding vehicles!
            </div>
            <a
              href="/discover"
              className="inline-block bg-lime-500 text-black px-6 py-3 rounded-lg font-semibold hover:bg-lime-400 transition-colors"
            >
              Discover Vehicles
            </a>
          </div>
        )}

        {/* Garage Sharing Section */}
        <div className="mt-12">
          <GarageShare
            garageId={garageData?.id || 'new-garage'}
            currentPrivacy={garagePrivacy}
            onPrivacyChange={setGaragePrivacy}
          />
        </div>
      </div>
    </section>
  );
}
