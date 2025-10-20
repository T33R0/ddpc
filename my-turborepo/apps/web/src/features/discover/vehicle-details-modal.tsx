import React, { useEffect, useMemo, useState } from 'react';
import { ImageWithFallback } from '../../components/image-with-fallback';
import { getVehicleImageSources } from '../../lib/vehicle-images';
import type { VehicleSummary, TrimVariant } from '@repo/types';
import toast from 'react-hot-toast';
import { useAuth } from '@repo/ui/auth-context';
import { supabase } from '../../lib/supabase';
import { X } from 'lucide-react';

type VehicleDetailsModalProps = {
  summary: VehicleSummary;
  initialTrimId?: string;
  onClose: () => void;
};

// Helper function to format specs with proper units
const formatSpec = (value: string | undefined | null, unit: string = ''): string => {
  if (!value || value === 'null' || value === 'undefined') return '—';
  return unit ? `${value}${unit}` : value;
};

// Calculate power-to-weight ratio
const calculatePowerToWeight = (hp: string | undefined, weight: string | undefined): string => {
  if (!hp || !weight) return '—';
  const hpNum = parseFloat(hp);
  const weightNum = parseFloat(weight);
  if (isNaN(hpNum) || isNaN(weightNum) || hpNum === 0) return '—';
  
  const lbPerHp = (weightNum / hpNum).toFixed(2);
  const hpPerTon = ((hpNum / weightNum) * 2000).toFixed(0);
  return `${lbPerHp} lb/hp (≈${hpPerTon} hp/ton)`;
};

// Calculate specific output
const calculateSpecificOutput = (hp: string | undefined, displacement: string | undefined): string => {
  if (!hp || !displacement) return '—';
  const hpNum = parseFloat(hp);
  const dispNum = parseFloat(displacement);
  if (isNaN(hpNum) || isNaN(dispNum) || dispNum === 0) return '—';
  
  const hpPerLiter = (hpNum / dispNum).toFixed(0);
  return `${hpPerLiter} hp/L`;
};

// Format engine configuration
const formatEngine = (trim: TrimVariant): string => {
  const parts: string[] = [];
  
  if (trim.engine_size_l) parts.push(`${trim.engine_size_l}L`);
  if (trim.cylinders) {
    const cyl = trim.cylinders;
    parts.push(cyl.includes('cylinder') ? cyl : `${cyl}-cyl`);
  }
  if (trim.engine_type) parts.push(trim.engine_type.toUpperCase());
  
  return parts.length > 0 ? parts.join(' ') : '—';
};

// Format fuel economy and range
const formatFuelEconomy = (trim: TrimVariant): string => {
  const parts: string[] = [];
  
  if (trim.epa_combined_mpg) {
    parts.push(`${trim.epa_combined_mpg} mpg`);
    
    if (trim.epa_city_highway_mpg) {
      parts.push(`(${trim.epa_city_highway_mpg.replace('/', '/')} city/hwy)`);
    }
  }
  
  if (trim.fuel_tank_capacity_gal) {
    parts.push(`• ${trim.fuel_tank_capacity_gal}-gal tank`);
    
    // Calculate range if we have mpg and tank size
    if (trim.epa_city_highway_mpg) {
      const mpgValues = trim.epa_city_highway_mpg.split('/').map(v => parseFloat(v));
      const city = mpgValues[0];
      const hwy = mpgValues[1];
      const tank = parseFloat(trim.fuel_tank_capacity_gal);
      if (city !== undefined && hwy !== undefined && !isNaN(city) && !isNaN(hwy) && !isNaN(tank)) {
        const cityRange = Math.round(city * tank);
        const hwyRange = Math.round(hwy * tank);
        parts.push(`• ${cityRange}–${hwyRange} mi range`);
      }
    }
  }
  
  return parts.length > 0 ? parts.join(' ') : '—';
};

const VehicleDetailsModal = ({ summary, initialTrimId, onClose }: VehicleDetailsModalProps) => {
  const { user } = useAuth();
  const [selectedTrimId, setSelectedTrimId] = useState<string>(initialTrimId ?? summary.trims[0]?.id ?? '');
  const [isAddingToGarage, setIsAddingToGarage] = useState(false);
  const [isAddedToGarage, setIsAddedToGarage] = useState(false);

  useEffect(() => {
    setSelectedTrimId(initialTrimId ?? summary.trims[0]?.id ?? '');
  }, [summary, initialTrimId]);

  const selectedTrim = useMemo<TrimVariant | null>(() => {
    return summary.trims.find((trim) => trim.id === selectedTrimId) ?? summary.trims[0] ?? null;
  }, [summary, selectedTrimId]);

  if (!selectedTrim) {
    return null;
  }

  const handleTrimChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTrimId(event.target.value);
  };

  const handleAddToGarage = async () => {
    if (!selectedTrim) {
      toast.error('Select a trim before adding to your garage.');
      return;
    }

    if (!user) {
      toast.error('You must be signed in to add a vehicle to your garage.');
      return;
    }
    setIsAddingToGarage(true);

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        throw new Error('Could not get user session.');
      }
      const accessToken = sessionData.session.access_token;

      const response = await fetch('/api/garage/add-vehicle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          vehicleDataId: selectedTrim.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add vehicle to garage');
      }

      setIsAddedToGarage(true);
      toast.success('Vehicle successfully added to your garage!');

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error adding vehicle to garage:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add vehicle to garage');
    } finally {
      setIsAddingToGarage(false);
    }
  };

  const imageSources = getVehicleImageSources(
    selectedTrim.image_url || summary.heroImage,
    summary.make,
    summary.model,
    summary.year
  );

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-900 text-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto border border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold">{summary.year} {summary.make} {summary.model}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column - Image and Trim Selector */}
            <div className="space-y-4">
              <div className="w-full aspect-video overflow-hidden rounded-lg bg-gray-800">
                <ImageWithFallback
                  src={imageSources}
                  fallbackSrc="/branding/fallback-logo.png"
                  alt={`${summary.make} ${summary.model}`}
                  width={600}
                  height={338}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Trim Selector */}
              <div className="space-y-2">
                <label htmlFor="trim-select" className="text-sm text-gray-400 block">
                  Select Trim:
                </label>
                <select
                  id="trim-select"
                  value={selectedTrimId}
                  onChange={handleTrimChange}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                >
                  {summary.trims.map((trim) => (
                    <option key={trim.id} value={trim.id} className="bg-gray-800 text-white">
                      {trim.trim || trim.trim_description || trim.model}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right Column - Specifications */}
            <div className="space-y-4">
              {/* Vehicle Type */}
              {(selectedTrim.body_type || selectedTrim.drive_type) && (
                <div className="text-gray-300">
                  <span className="text-lg">
                    {[selectedTrim.body_type, selectedTrim.drive_type].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}

              {/* Engine */}
              {selectedTrim.engine_size_l && (
                <div className="space-y-1">
                  <div className="text-gray-400 text-sm">Engine:</div>
                  <div className="text-white">
                    {formatEngine(selectedTrim)}
                    {selectedTrim.fuel_type && ` • ${selectedTrim.fuel_type}`}
                  </div>
                </div>
              )}

              {/* Output */}
              {(selectedTrim.horsepower_hp || selectedTrim.torque_ft_lbs) && (
                <div className="space-y-1">
                  <div className="text-gray-400 text-sm">Output:</div>
                  <div className="text-white">
                    {selectedTrim.horsepower_hp && (
                      <>
                        {selectedTrim.horsepower_hp} hp
                        {selectedTrim.horsepower_rpm && ` @ ${selectedTrim.horsepower_rpm} rpm`}
                      </>
                    )}
                    {selectedTrim.torque_ft_lbs && (
                      <>
                        {selectedTrim.horsepower_hp && ' • '}
                        {selectedTrim.torque_ft_lbs} lb-ft
                        {selectedTrim.torque_rpm && ` @ ${selectedTrim.torque_rpm} rpm`}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Transmission */}
              {selectedTrim.transmission && (
                <div className="space-y-1">
                  <div className="text-gray-400 text-sm">Transmission:</div>
                  <div className="text-white">{selectedTrim.transmission}</div>
                </div>
              )}

              {/* Curb Weight */}
              {selectedTrim.curb_weight_lbs && (
                <div className="space-y-1">
                  <div className="text-gray-400 text-sm">Curb Weight:</div>
                  <div className="text-white">{formatSpec(selectedTrim.curb_weight_lbs, ' lb')}</div>
                </div>
              )}

              {/* Power-to-Weight Ratio */}
              {selectedTrim.horsepower_hp && selectedTrim.curb_weight_lbs && (
                <div className="space-y-1">
                  <div className="text-gray-400 text-sm">Power-to-Weight:</div>
                  <div className="text-white">
                    {calculatePowerToWeight(selectedTrim.horsepower_hp, selectedTrim.curb_weight_lbs)}
                    {' • '}
                    <span className="text-gray-400">Specific Output:</span>
                    {' '}
                    {calculateSpecificOutput(selectedTrim.horsepower_hp, selectedTrim.engine_size_l)}
                  </div>
                </div>
              )}

              {/* Suspension */}
              {selectedTrim.suspension && (
                <div className="space-y-1">
                  <div className="text-gray-400 text-sm">Suspension:</div>
                  <div className="text-white">{selectedTrim.suspension}</div>
                </div>
              )}

              {/* Drivetrain */}
              {selectedTrim.drive_type && (
                <div className="space-y-1">
                  <div className="text-gray-400 text-sm">Drivetrain:</div>
                  <div className="text-white">{selectedTrim.drive_type}</div>
                </div>
              )}

              {/* Fuel Economy/Range */}
              {selectedTrim.epa_combined_mpg && (
                <div className="space-y-1">
                  <div className="text-gray-400 text-sm">Fuel Economy/Range:</div>
                  <div className="text-white">{formatFuelEconomy(selectedTrim)}</div>
                </div>
              )}

              {/* Ground Clearance */}
              {selectedTrim.ground_clearance_in && (
                <div className="space-y-1">
                  <div className="text-gray-400 text-sm">Ground Clearance:</div>
                  <div className="text-white">{formatSpec(selectedTrim.ground_clearance_in, ' in.')}</div>
                </div>
              )}

              {/* Towing Capacity (if available) */}
              {selectedTrim.max_towing_capacity_lbs && selectedTrim.max_towing_capacity_lbs !== '0' && (
                <div className="space-y-1">
                  <div className="text-gray-400 text-sm">Max Towing Capacity:</div>
                  <div className="text-white">{formatSpec(selectedTrim.max_towing_capacity_lbs, ' lb')}</div>
                </div>
              )}

              {/* Seating */}
              {selectedTrim.total_seating && (
                <div className="space-y-1">
                  <div className="text-gray-400 text-sm">Seating:</div>
                  <div className="text-white">{selectedTrim.total_seating} passengers</div>
                </div>
              )}

              {/* Cargo Capacity */}
              {selectedTrim.cargo_capacity_cuft && (
                <div className="space-y-1">
                  <div className="text-gray-400 text-sm">Cargo Capacity:</div>
                  <div className="text-white">
                    {formatSpec(selectedTrim.cargo_capacity_cuft, ' cu ft')}
                    {selectedTrim.max_cargo_capacity_cuft && 
                      ` (${formatSpec(selectedTrim.max_cargo_capacity_cuft, ' cu ft')} max)`
                    }
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Add to Garage Button */}
          <div className="mt-8 pt-6 border-t border-gray-800">
            <button
              onClick={handleAddToGarage}
              disabled={isAddingToGarage || isAddedToGarage}
              className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                isAddedToGarage
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-lime-500 hover:bg-lime-600 text-black'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isAddingToGarage
                ? 'Adding to Garage...'
                : isAddedToGarage
                ? '✓ Added to Garage'
                : 'Add to Garage'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetailsModal;
