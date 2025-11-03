'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@repo/ui/card';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@repo/ui/dialog';
import { Plus, Activity, Wrench, Fuel, Settings, Edit } from 'lucide-react';
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

interface VehicleDetailPageProps {
  onVehicleUpdated?: () => void;
}

export default function VehicleDetailPage({ onVehicleUpdated }: VehicleDetailPageProps) {
  const params = useParams();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logServiceModalOpen, setLogServiceModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editNickname, setEditNickname] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const vehicleSlug = params.id as string;

  useEffect(() => {
    // Immediately set a placeholder vehicle so the UI renders
    // The URL slug contains the trim, we'll combine it with model from data later
    setVehicle({
      id: 'placeholder',
      name: decodeURIComponent(vehicleSlug), // Use the full slug (trim) as initial name
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
        // Combine model + trim for the display name
        const vehicleData = data.vehicle;
        if (vehicleData.ymmt) {
          const trim = decodeURIComponent(vehicleSlug);
          // Remove the trim from the end of ymmt to get the model
          let ymmtWithoutTrim = vehicleData.ymmt;
          if (ymmtWithoutTrim.endsWith(' ' + trim)) {
            ymmtWithoutTrim = ymmtWithoutTrim.slice(0, -(trim.length + 1));
          }
          // Extract model (everything after year and make)
          const ymmtParts = ymmtWithoutTrim.split(' ');
          if (ymmtParts.length >= 3) {
            const model = ymmtParts.slice(2).join(' ');
            vehicleData.name = `${model} ${trim}`;
          }
        }
        setVehicle(vehicleData);
        setEditNickname(vehicleData.name || '');
        setEditStatus(vehicleData.current_status || 'parked');
        setError(null); // Clear any previous errors
        } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        // Keep the placeholder vehicle but update the name
        const slugParts = decodeURIComponent(vehicleSlug).split(' ');
        const defaultName = slugParts.length >= 3 && slugParts[2] ? slugParts[2] : decodeURIComponent(vehicleSlug);
        setVehicle({
          id: 'placeholder',
          name: defaultName,
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

  const handleSaveVehicle = async () => {
    if (!vehicle) return;

    setIsUpdating(true);
    try {
      // First, handle image upload if there's a new image
      let imageUrl = vehicle.image_url;
      if (editImageFile) {
        // For now, we'll use a simple approach - upload to a generic image hosting service
        // In a real app, you'd want to upload to your own storage service
        const formData = new FormData();
        formData.append('file', editImageFile);

        // This is a placeholder - you'd need to implement actual image upload
        // For now, we'll just log that image upload would happen
        console.log('Image upload would happen here:', editImageFile.name);
        // imageUrl = await uploadImage(editImageFile);
      }

      // Update vehicle data via API
      const response = await fetch('/api/garage/update-vehicle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify({
          vehicleId: vehicle.id,
          nickname: editNickname,
          status: editStatus,
          // photo_url: imageUrl // TODO: Implement image upload and uncomment
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update vehicle');
      }

      const result = await response.json();

      // Update local vehicle state
      setVehicle(prev => prev ? {
        ...prev,
        name: editNickname,
        current_status: editStatus,
        // image_url: imageUrl
      } : null);

      // If nickname changed, update the URL
      if (editNickname !== vehicle.name) {
        const newSlug = editNickname || vehicle.id;
        router.replace(`/vehicle/${encodeURIComponent(newSlug)}`, { scroll: false });
      }

      // Close modal and show success
      setEditModalOpen(false);

      // Trigger refresh callback if provided
      if (onVehicleUpdated) {
        onVehicleUpdated();
      }

      // You might want to add a toast notification here

    } catch (error) {
      console.error('Error updating vehicle:', error);
      // You might want to show an error message to the user
    } finally {
      setIsUpdating(false);
    }
  };

  const getAuthToken = async () => {
    // This is a simple way to get the auth token
    // In a real app, you'd use your auth context
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || '';
    } catch {
      return '';
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
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold text-white">{vehicle.name}</h1>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white hover:bg-gray-800"
                onClick={() => setEditModalOpen(true)}
              >
                <Edit className="w-4 h-4" />
              </Button>
            </div>
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
            <Card className="bg-black/50 backdrop-blur-lg rounded-2xl p-6 text-white"
                  style={{
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                  }}>
              <CardContent className="p-0">
                <p className="text-sm font-semibold text-gray-400 mb-2">Build Specs</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Year:</span>
                    <span className="text-white">{year}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Make:</span>
                    <span className="text-white">{vehicle.ymmt?.split(' ')[1] || 'UNK'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Model:</span>
                    <span className="text-white">{vehicle.ymmt?.split(' ').slice(2, -1).join(' ') || 'UNK'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Trim:</span>
                    <span className="text-white">{decodeURIComponent(vehicleSlug)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Slots 2-3, 6-7: Vehicle Image (spanning 2 columns and 2 rows) */}
            <Card className="col-span-2 row-span-2 bg-black/50 backdrop-blur-lg rounded-2xl overflow-hidden"
                  style={{
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                  }}>
              <img
                alt={`${vehicle.name} vehicle`}
                className="w-full h-full object-cover"
                src={vehicle.image_url || "https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop&crop=center"}
              />
            </Card>

            {/* Slot 4: Engine Specs */}
            <Card className="bg-black/50 backdrop-blur-lg rounded-2xl p-6 text-white"
                  style={{
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                  }}>
              <CardContent className="p-0">
                <p className="text-sm font-semibold text-gray-400 mb-2">Engine Specs</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Power:</span>
                    <span className="text-white">{horsepower} hp</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Torque:</span>
                    <span className="text-white">{torque} ft-lbs</span>
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
            <Card className="bg-black/50 backdrop-blur-lg rounded-2xl p-6 text-white"
                  style={{
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                  }}>
              <CardContent className="p-0">
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


            {/* Slot 8: Drivetrain */}
            <Card className="bg-black/50 backdrop-blur-lg rounded-2xl p-6 text-white"
                  style={{
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                  }}>
              <CardContent className="p-0">
                <p className="text-sm font-semibold text-gray-400 mb-2">Drivetrain</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Type:</span>
                    <span className="text-white">{driveType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Transmission:</span>
                    <span className="text-white text-right flex-1">{transmission}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Row 3 */}
            {/* Slot 9: History */}
            <Card className="bg-black/50 backdrop-blur-lg rounded-2xl p-6 text-white cursor-pointer transition-all duration-300"
                  style={{
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    transition: 'all 0.3s ease-out',
                  }}
                  onClick={() => router.push(`/vehicle/${encodeURIComponent((params.id as string) || '')}/history`)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.border = '1px solid rgb(132, 204, 22)';
                    e.currentTarget.style.boxShadow = '0 0 30px rgba(132, 204, 22, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.3)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}>
              <CardContent className="p-0">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-blue-400" />
                  <p className="text-sm font-semibold text-gray-400">History</p>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last Service:</span>
                    <span className="text-white">---</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Records:</span>
                    <span className="text-white">---</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Slot 10: Service */}
            <Card className="bg-black/50 backdrop-blur-lg rounded-2xl p-6 text-white cursor-pointer transition-all duration-300"
                  style={{
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    transition: 'all 0.3s ease-out',
                  }}
                  onClick={() => router.push(`/vehicle/${encodeURIComponent((params.id as string) || '')}/service`)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.border = '1px solid rgb(132, 204, 22)';
                    e.currentTarget.style.boxShadow = '0 0 30px rgba(132, 204, 22, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.3)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}>
              <CardContent className="p-0">
                <div className="flex items-center gap-2 mb-2">
                  <Wrench className="w-5 h-5 text-blue-400" />
                  <p className="text-sm font-semibold text-gray-400">Service</p>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Next Service:</span>
                    <span className="text-white">---</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Service Count:</span>
                    <span className="text-white">---</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Slot 11: Fuel */}
            <Card className="bg-black/50 backdrop-blur-lg rounded-2xl p-6 text-white cursor-pointer transition-all duration-300"
                  style={{
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    transition: 'all 0.3s ease-out',
                  }}
                  onClick={() => router.push(`/vehicle/${encodeURIComponent((params.id as string) || '')}/fuel`)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.border = '1px solid rgb(132, 204, 22)';
                    e.currentTarget.style.boxShadow = '0 0 30px rgba(132, 204, 22, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.3)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}>
              <CardContent className="p-0">
                <div className="flex items-center gap-2 mb-2">
                  <Fuel className="w-5 h-5 text-blue-400" />
                  <p className="text-sm font-semibold text-gray-400">Fuel</p>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Avg MPG:</span>
                    <span className="text-white">---</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Cost:</span>
                    <span className="text-white">---</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Slot 12: Mods */}
            <Card className="bg-black/50 backdrop-blur-lg rounded-2xl p-6 text-white cursor-pointer transition-all duration-300"
                  style={{
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    transition: 'all 0.3s ease-out',
                  }}
                  onClick={() => router.push(`/vehicle/${encodeURIComponent((params.id as string) || '')}/mods`)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.border = '1px solid rgb(132, 204, 22)';
                    e.currentTarget.style.boxShadow = '0 0 30px rgba(132, 204, 22, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.3)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}>
              <CardContent className="p-0">
                <div className="flex items-center gap-2 mb-2">
                  <Settings className="w-5 h-5 text-blue-400" />
                  <p className="text-sm font-semibold text-gray-400">Mods</p>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Mods:</span>
                    <span className="text-white">---</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Cost:</span>
                    <span className="text-white">---</span>
                  </div>
                </div>
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

      {/* Edit Vehicle Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Edit Vehicle</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Nickname Input */}
            <div>
              <Label htmlFor="nickname" className="text-sm font-medium text-gray-300">
                Vehicle Nickname
              </Label>
              <Input
                id="nickname"
                type="text"
                value={editNickname}
                onChange={(e) => setEditNickname(e.target.value)}
                className="mt-1 bg-gray-800 border-gray-600 text-white"
                placeholder="Enter vehicle nickname"
              />
            </div>

            {/* Status Dropdown */}
            <div>
              <Label htmlFor="status" className="text-sm font-medium text-gray-300">
                Vehicle Status
              </Label>
              <select
                id="status"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="mt-1 w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="daily_driver">Daily Driver</option>
                <option value="parked">Parked</option>
                <option value="listed">Listed</option>
                <option value="sold">Sold</option>
                <option value="retired">Retired</option>
              </select>
            </div>

            {/* Image Upload - TODO: Implement image upload functionality */}
            <div>
              <Label htmlFor="image" className="text-sm font-medium text-gray-300">
                Vehicle Image
              </Label>
              <div className="mt-1 p-4 border-2 border-dashed border-gray-600 rounded-md text-center">
                <p className="text-sm text-gray-400">
                  Image upload coming soon...
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  For now, you can update nickname and status
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setEditModalOpen(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveVehicle}
              disabled={isUpdating}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}