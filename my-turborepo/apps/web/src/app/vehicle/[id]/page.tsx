'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@repo/ui/card';
import { Button } from '@repo/ui/button';
import { Plus } from 'lucide-react';
import { LogServiceModal } from '../../../components/LogServiceModal';

interface Vehicle {
  id: string;
  name: string;
  ymmt: string;
  odometer: number | null;
  current_status: string;
  horsepower_hp?: any;
  torque_ft_lbs?: any;
  cylinders?: any;
  engine_size_l?: any;
  fuel_type?: any;
  epa_combined_mpg?: any;
  drive_type?: any;
  transmission?: any;
  colors_exterior?: any;
  length_in?: any;
  width_in?: any;
  height_in?: any;
  body_type?: any;
  image_url?: string;
}

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logServiceModalOpen, setLogServiceModalOpen] = useState(false);

  const vehicleSlug = params.id as string;

  useEffect(() => {
    // Immediately set a placeholder vehicle so the UI renders
    setVehicle({
      id: 'placeholder',
      name: decodeURIComponent(vehicleSlug),
      ymmt: 'Loading...',
      odometer: null,
      current_status: 'unknown',
      // All other fields will be undefined, triggering safeExtract fallbacks
    });
    setError(null);
    setLoading(true);

    const fetchVehicle = async () => {
      try {
        const response = await fetch(`/api/garage/vehicles/${encodeURIComponent(vehicleSlug)}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch vehicle data (${response.status})`);
        }
        const data = await response.json();
        setVehicle(data.vehicle);
        setError(null); // Clear any previous errors
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        // Keep the placeholder vehicle but update the name
        setVehicle({
          id: 'placeholder',
          name: decodeURIComponent(vehicleSlug),
          ymmt: 'Vehicle Not Found',
          odometer: null,
          current_status: 'unknown',
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

  // Always render the page - never show loading or error states that hide the content
  if (!vehicle) {
    return (
      <section className="relative py-12 bg-black min-h-screen">
        <div className="relative container px-4 md:px-6 pt-24">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Vehicle Details</h1>
            <p className="text-xl text-red-400">No vehicle data available</p>
            <Button
              onClick={() => router.back()}
              className="mt-4 bg-red-600 hover:bg-red-700"
            >
              Go Back
            </Button>
          </div>
        </div>
      </section>
    );
  }

  // Extract vehicle details with safe fallbacks
  const year = vehicle.ymmt?.split(' ')[0] || 'UNK';
  const makeModel = vehicle.ymmt?.split(' ').slice(1).join(' ') || 'UNK';

  // Safe extraction functions - no state updates during render
  const safeValue = (value: any, fallback = 'UNK', transformer?: (val: any) => string) => {
    try {
      if (value === null || value === undefined || value === '') {
        return fallback;
      }
      if (transformer) {
        return transformer(value);
      }
      return String(value);
    } catch (err) {
      return fallback;
    }
  };

  const horsepower = safeValue(vehicle.horsepower_hp, 'UNK');
  const torque = safeValue(vehicle.torque_ft_lbs, 'UNK');
  const cylinders = safeValue(vehicle.cylinders, 'UNK');
  const engineSize = safeValue(vehicle.engine_size_l, 'UNK', (val) => `${val}L`);
  const fuelType = safeValue(vehicle.fuel_type, 'UNK');
  const fuelEconomy = safeValue(vehicle.epa_combined_mpg, 'UNK', (val) => `${val} MPG`);
  const driveType = safeValue(vehicle.drive_type, 'UNK');
  const transmission = safeValue(vehicle.transmission, 'UNK');
  // Parse colors to show only first color with RGB block
  const parseColors = (colorsString: any) => {
    if (!colorsString || colorsString === 'UNK') return 'UNK';

    try {
      // Split by comma and take first color
      const firstColor = String(colorsString).split(',')[0]?.trim();

      if (!firstColor) return 'UNK';

      // Extract color name and RGB
      const rgbMatch = firstColor.match(/(.+?)\s*\(([^)]+)\)/);
      if (rgbMatch) {
        const colorName = rgbMatch[1]?.trim();
        const rgbValue = rgbMatch[2]?.trim();
        return { name: colorName || firstColor, rgb: rgbValue || null };
      }

      // If no RGB found, just return the color name
      return { name: firstColor, rgb: null };
    } catch (err) {
      return 'UNK';
    }
  };

  const colorInfo = parseColors(vehicle.colors_exterior);
  const length = safeValue(vehicle.length_in, 'UNK', (val) => `${(parseFloat(val) * 25.4).toFixed(0)} mm`);
  const width = safeValue(vehicle.width_in, 'UNK', (val) => `${(parseFloat(val) * 25.4).toFixed(0)} mm`);
  const height = safeValue(vehicle.height_in, 'UNK', (val) => `${(parseFloat(val) * 25.4).toFixed(0)} mm`);
  const bodyType = safeValue(vehicle.body_type, 'UNK');

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
          <div className="mb-8 flex justify-between items-center">
            <h1 className="text-4xl font-bold text-white">{vehicle.name}</h1>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => setLogServiceModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Log Event
            </Button>
          </div>

          <div className="grid w-full max-w-7xl mx-auto grid-cols-4 grid-rows-3 gap-4 h-[600px]">
            {/* Row 1 */}
            {/* Slot 1: Build Specs */}
            <Card className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 shadow-xl flex items-center justify-center">
              <CardContent className="p-4 text-center">
                <p className="text-lg font-semibold text-white">Build Specs</p>
              </CardContent>
            </Card>

            {/* Slots 2-3: Vehicle Image (spanning 2 columns) */}
            <Card className="col-span-2 bg-gray-900/50 backdrop-blur-sm border border-gray-800 shadow-xl overflow-hidden">
              <img
                alt={`${vehicle.name} vehicle`}
                className="w-full h-full object-cover"
                src={vehicle.image_url || "https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop&crop=center"}
              />
            </Card>

            {/* Slot 4: Engine Specs */}
            <Card className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 shadow-xl">
              <CardContent className="p-4">
                <p className="text-sm font-semibold text-gray-400 mb-2">Engine Specs</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">HP:</span>
                    <span className="text-white">{horsepower}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Torque:</span>
                    <span className="text-white">{torque}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Size:</span>
                    <span className="text-white">{engineSize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Cylinders:</span>
                    <span className="text-white">{cylinders}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Row 2 */}
            {/* Slot 5: Dimensions */}
            <Card className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 shadow-xl">
              <CardContent className="p-4">
                <p className="text-sm font-semibold text-gray-400 mb-2">Dimensions</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Length:</span>
                    <span className="text-white">{length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Width:</span>
                    <span className="text-white">{width}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Height:</span>
                    <span className="text-white">{height}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Slots 6-7: Vehicle Image (spanning 2 columns) */}
            <Card className="col-span-2 bg-gray-900/50 backdrop-blur-sm border border-gray-800 shadow-xl overflow-hidden">
              <img
                alt={`${vehicle.name} vehicle`}
                className="w-full h-full object-cover"
                src={vehicle.image_url || "https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop&crop=center"}
              />
            </Card>

            {/* Slot 8: Drivetrain */}
            <Card className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 shadow-xl">
              <CardContent className="p-4">
                <p className="text-sm font-semibold text-gray-400 mb-2">Drivetrain</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Type:</span>
                    <span className="text-white">{driveType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Transmission:</span>
                    <span className="text-white">{transmission}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Row 3 */}
            {/* Slot 9: Fuel */}
            <Card className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 shadow-xl flex items-center justify-center">
              <CardContent className="p-4 text-center">
                <p className="text-lg font-semibold text-white">Fuel</p>
              </CardContent>
            </Card>

            {/* Slot 10: Maintenance */}
            <Card className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 shadow-xl flex items-center justify-center">
              <CardContent className="p-4 text-center">
                <p className="text-lg font-semibold text-white">Maintenance</p>
              </CardContent>
            </Card>

            {/* Slot 11: Repair */}
            <Card className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 shadow-xl flex items-center justify-center">
              <CardContent className="p-4 text-center">
                <p className="text-lg font-semibold text-white">Repair</p>
              </CardContent>
            </Card>

            {/* Slot 12: Performance */}
            <Card className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 shadow-xl flex items-center justify-center">
              <CardContent className="p-4 text-center">
                <p className="text-lg font-semibold text-white">Performance</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Log Service Modal */}
      <LogServiceModal
        open={logServiceModalOpen}
        onOpenChange={setLogServiceModalOpen}
      />
    </>
  );
}