'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@repo/ui/card';
import { Button } from '@repo/ui/button';
import { ArrowLeft } from 'lucide-react';

interface Vehicle {
  id: string;
  name: string;
  ymmt: string;
  odometer: number | null;
  current_status: string;
  horsepower_hp?: string;
  torque_ft_lbs?: string;
  cylinders?: string;
  engine_size_l?: string;
  fuel_type?: string;
  epa_combined_mpg?: string;
  drive_type?: string;
  transmission?: string;
  colors_exterior?: string;
  length_in?: string;
  width_in?: string;
  height_in?: string;
  body_type?: string;
  image_url?: string;
}

interface FieldError {
  horsepower?: string;
  torque?: string;
  cylinders?: string;
  engineSize?: string;
  fuelType?: string;
  fuelEconomy?: string;
  driveType?: string;
  transmission?: string;
  colors?: string;
  length?: string;
  width?: string;
  height?: string;
}

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldError>({});

  const vehicleSlug = params.id as string;

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/garage/vehicles/${encodeURIComponent(vehicleSlug)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch vehicle data');
        }
        const data = await response.json();
        setVehicle(data.vehicle);
        setError(null); // Clear any previous errors
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        // Set a placeholder vehicle so the UI still renders
        setVehicle({
          id: 'placeholder',
          name: vehicleSlug,
          ymmt: 'Unknown Vehicle',
          odometer: null,
          current_status: 'unknown',
          // All other fields will be undefined, triggering safeExtract fallbacks
        });
      } finally {
        setLoading(false);
      }
    };

    if (vehicleSlug) {
      fetchVehicle();
    }
  }, [vehicleSlug]);

  const formatStatus = (status: string) => {
    switch (status) {
      case 'daily_driver':
        return 'Active';
      case 'parked':
        return 'Parked';
      case 'listed':
        return 'Listed';
      case 'sold':
        return 'Sold';
      case 'retired':
        return 'Retired';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  if (loading) {
    return (
      <section className="relative py-12 bg-black min-h-screen">
        <div className="relative container px-4 md:px-6 pt-24">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Vehicle Details</h1>
            <p className="text-xl text-gray-300">Loading vehicle information...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error || !vehicle) {
    return (
      <section className="relative py-12 bg-black min-h-screen">
        <div className="relative container px-4 md:px-6 pt-24">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Vehicle Details</h1>
            <p className="text-xl text-red-400">{error || 'Vehicle not found'}</p>
            <Button
              onClick={() => router.back()}
              className="mt-4 bg-red-600 hover:bg-red-700"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </div>
      </section>
    );
  }

  // Extract vehicle details with error handling
  const year = vehicle.ymmt.split(' ')[0];
  const makeModel = vehicle.ymmt.split(' ').slice(1).join(' ');

  // Helper function to safely extract values with error handling
  const safeExtract = (value: any, fieldName: keyof FieldError, fallback = 'N/A', transformer?: (val: any) => string) => {
    try {
      if (value === null || value === undefined || value === '') {
        setFieldErrors(prev => ({ ...prev, [fieldName]: 'Data not available' }));
        return fallback;
      }
      if (transformer) {
        return transformer(value);
      }
      return String(value);
    } catch (err) {
      setFieldErrors(prev => ({ ...prev, [fieldName]: 'Error processing data' }));
      return fallback;
    }
  };

  const horsepower = safeExtract(vehicle.horsepower_hp, 'horsepower', 'UNK');
  const torque = safeExtract(vehicle.torque_ft_lbs, 'torque', 'UNK');
  const cylinders = safeExtract(vehicle.cylinders, 'cylinders', 'UNK');
  const engineSize = safeExtract(vehicle.engine_size_l, 'engineSize', 'UNK', (val) => `${val}L`);
  const fuelType = safeExtract(vehicle.fuel_type, 'fuelType', 'UNK');
  const fuelEconomy = safeExtract(vehicle.epa_combined_mpg, 'fuelEconomy', 'UNK', (val) => `${val} MPG`);
  const driveType = safeExtract(vehicle.drive_type, 'driveType', 'UNK');
  const transmission = safeExtract(vehicle.transmission, 'transmission', 'UNK');
  const colors = safeExtract(vehicle.colors_exterior, 'colors', 'UNK');
  const length = safeExtract(vehicle.length_in, 'length', 'UNK', (val) => `${(parseFloat(val) * 25.4).toFixed(0)} mm`);
  const width = safeExtract(vehicle.width_in, 'width', 'UNK', (val) => `${(parseFloat(val) * 25.4).toFixed(0)} mm`);
  const height = safeExtract(vehicle.height_in, 'height', 'UNK', (val) => `${(parseFloat(val) * 25.4).toFixed(0)} mm`);
  const bodyType = vehicle.body_type || 'UNK';

  return (
    <>
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
            <Button
              onClick={() => router.back()}
              className="mb-4 bg-gray-800 hover:bg-gray-700 text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Garage
            </Button>
            <h1 className="text-4xl font-bold text-white mb-2">Vehicle Details</h1>
            <p className="text-lg text-gray-400">Detailed information about your {vehicle.name}</p>
          </div>

          <div className="grid w-full max-w-7xl mx-auto grid-cols-4 grid-rows-[auto_auto_auto] gap-4">
            {/* Left Column - Performance Stats */}
            <div className="col-span-1 flex flex-col gap-4">
              <Card className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 shadow-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-xl text-blue-400">speed</span>
                    <p className="text-xs uppercase tracking-wider text-gray-400">Horsepower</p>
                  </div>
                  <p className="text-5xl font-bold text-white">{horsepower}</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 shadow-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-xl text-blue-400">shutter_speed</span>
                    <p className="text-xs uppercase tracking-wider text-gray-400">Max Speed</p>
                  </div>
                  <p className="text-5xl font-bold text-white">UNK</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 shadow-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-xl text-blue-400">rotate_right</span>
                    <p className="text-xs uppercase tracking-wider text-gray-400">Torque</p>
                  </div>
                  <p className="text-5xl font-bold text-white">{torque}</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 shadow-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-xl text-blue-400">timer</span>
                    <p className="text-xs uppercase tracking-wider text-gray-400">0-100km/h</p>
                  </div>
                  <p className="text-5xl font-bold text-white">UNK</p>
                </CardContent>
              </Card>
            </div>

            {/* Center Column - Hero Image */}
            <div className="col-span-2 row-span-2 flex flex-col gap-4">
              <Card className="relative flex h-full items-center justify-center bg-gray-900/50 backdrop-blur-sm border border-gray-800 shadow-xl overflow-hidden">
                <img
                  alt={`${vehicle.name} vehicle`}
                  className="absolute inset-0 h-full w-full object-cover opacity-70"
                  src={vehicle.image_url || "https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop&crop=center"}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-black/20"></div>
                <div className="relative z-10 flex h-full w-full flex-col justify-start items-center p-8 pt-12">
                  <p className="text-lg uppercase tracking-[0.2em] text-blue-300">{bodyType}</p>
                  <h1 className="text-6xl font-bold text-white tracking-wider">{vehicle.name}</h1>
                  <p className="text-lg text-gray-300 mt-2">{year} {makeModel}</p>
                  <p className="text-sm text-gray-400 mt-1">Status: {formatStatus(vehicle.current_status)}</p>
                </div>
              </Card>

              {/* Bottom row of center column */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 shadow-xl">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">Drivetrain</p>
                    <span className="material-symbols-outlined text-4xl text-blue-400">settings_input_component</span>
                    <p className="text-sm text-white mt-2">{driveType}</p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 shadow-xl">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">Transmission</p>
                    <span className="material-symbols-outlined text-4xl text-blue-400">settings</span>
                    <p className="text-sm text-white mt-2">{transmission}</p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 shadow-xl">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">Colors</p>
                    <span className="material-symbols-outlined text-4xl text-blue-400">palette</span>
                    <p className="text-sm text-white mt-2">{colors}</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Right Column - Engine Stats */}
            <div className="col-span-1 flex flex-col gap-4">
              <Card className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 shadow-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-xl text-blue-400">water_drop</span>
                    <p className="text-xs uppercase tracking-wider text-gray-400">Engine Size</p>
                  </div>
                  <p className="text-5xl font-bold text-white">{engineSize}</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 shadow-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-xl text-blue-400">schema</span>
                    <p className="text-xs uppercase tracking-wider text-gray-400">Cylinders</p>
                  </div>
                  <p className="text-5xl font-bold text-white">{cylinders}</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 shadow-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-xl text-blue-400">local_gas_station</span>
                    <p className="text-xs uppercase tracking-wider text-gray-400">Fuel Economy</p>
                  </div>
                  <p className="text-5xl font-bold text-white">{fuelEconomy} MPG</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 shadow-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-xl text-blue-400">engineering</span>
                    <p className="text-xs uppercase tracking-wider text-gray-400">Fuel Type</p>
                  </div>
                  <p className="text-5xl font-bold text-white">{fuelType}</p>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Row - Dimensions */}
            <div className="col-span-4 grid grid-cols-4 gap-4">
              <Card className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 shadow-xl">
                <CardContent className="p-4 text-center">
                  <span className="material-symbols-outlined text-4xl text-blue-400 mb-1">straighten</span>
                  <p className="text-xs uppercase tracking-wider text-gray-400">Dimensions</p>
                </CardContent>
              </Card>

              <Card className="col-span-3 bg-gray-900/50 backdrop-blur-sm border border-gray-800 shadow-xl">
                <CardContent className="p-4">
                  <div className="flex h-full items-center justify-around">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-white">{length}</p>
                      <p className="text-base font-normal text-gray-400">Length</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-white">{width}</p>
                      <p className="text-base font-normal text-gray-400">Width</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-white">{height}</p>
                      <p className="text-base font-normal text-gray-400">Height</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
