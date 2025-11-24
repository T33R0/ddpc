import React, { useEffect, useMemo, useState } from 'react';
import { ImageWithFallback } from '../../components/image-with-fallback';
import { getVehicleImageSources } from '../../lib/vehicle-images';
import type { VehicleSummary, TrimVariant } from '@repo/types';
import toast from 'react-hot-toast';
import { useAuth } from '@repo/ui/auth-context';
import { supabase } from '../../lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@repo/ui/dialog';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

type AddVehicleModalProps = {
  open?: boolean;
  onOpenChange: (open: boolean) => void;
  onVehicleAdded?: () => void;
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

type TabType = 'vin' | 'manual';

interface FilterOptions {
  years: number[];
  makes: string[];
  models: string[];
  engineTypes: string[];
  fuelTypes: string[];
  drivetrains: string[];
  bodyTypes: string[];
}

const AddVehicleModal = ({ open = false, onOpenChange, onVehicleAdded }: AddVehicleModalProps) => {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('vin');

  // VIN decoder state
  const [vin, setVin] = useState('');
  const [isDecodingVin, setIsDecodingVin] = useState(false);
  const [vinVehicleData, setVinVehicleData] = useState<VehicleSummary | null>(null);
  const [selectedVinTrimId, setSelectedVinTrimId] = useState<string>('');

  // Manual entry state
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMake, setSelectedMake] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedTrimId, setSelectedTrimId] = useState<string>('');
  const [manualVehicleData, setManualVehicleData] = useState<VehicleSummary | null>(null);

  // Common state
  const [isAddingToGarage, setIsAddingToGarage] = useState(false);
  const [isAddedToGarage, setIsAddedToGarage] = useState(false);

  // Get current vehicle data based on active tab
  const currentVehicleData = activeTab === 'vin' ? vinVehicleData : manualVehicleData;
  const currentSelectedTrimId = activeTab === 'vin' ? selectedVinTrimId : selectedTrimId;

  // Load filter options for manual entry
  useEffect(() => {
    if (activeTab === 'manual' && !filterOptions) {
      const loadFilters = async () => {
        try {
          const response = await fetch('/api/explore/filters');
          if (response.ok) {
            const data = await response.json();
            setFilterOptions(data);
          }
        } catch (error) {
          console.error('Failed to load filter options:', error);
        }
      };
      loadFilters();
    }
  }, [activeTab, filterOptions]);

  // State for dependent dropdowns
  const [availableMakes, setAvailableMakes] = useState<string[]>([]);
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  // Load makes when year changes
  useEffect(() => {
    if (selectedYear) {
      const loadMakes = async () => {
        try {
          const response = await fetch(`/api/explore/vehicle-options?type=makes&year=${selectedYear}`);
          if (response.ok) {
            const makes = await response.json();
            setAvailableMakes(makes);
          }
        } catch (error) {
          console.error('Failed to load makes:', error);
        }
      };
      loadMakes();
    } else {
      setAvailableMakes([]);
    }
    setSelectedMake('');
    setSelectedModel('');
    setSelectedTrimId('');
    setManualVehicleData(null);
  }, [selectedYear]);

  // Load models when year and make change
  useEffect(() => {
    if (selectedYear && selectedMake) {
      const loadModels = async () => {
        try {
          const response = await fetch(`/api/explore/vehicle-options?type=models&year=${selectedYear}&make=${encodeURIComponent(selectedMake)}`);
          if (response.ok) {
            const models = await response.json();
            setAvailableModels(models);
          }
        } catch (error) {
          console.error('Failed to load models:', error);
        }
      };
      loadModels();
    } else {
      setAvailableModels([]);
    }
    setSelectedModel('');
    setSelectedTrimId('');
    setManualVehicleData(null);
  }, [selectedYear, selectedMake]);

  // Get available trims for selected year, make, and model
  const availableTrims = useMemo(() => {
    if (!selectedYear || !selectedMake || !selectedModel) return [];
    // This would need to be implemented to fetch actual trims
    // For now, return empty array
    return [];
  }, [selectedYear, selectedMake, selectedModel]);

  const selectedTrim = useMemo<TrimVariant | null>(() => {
    if (!currentVehicleData || !currentSelectedTrimId) return null;
    return currentVehicleData.trims.find((trim) => trim.id === currentSelectedTrimId) ?? currentVehicleData.trims[0] ?? null;
  }, [currentVehicleData, currentSelectedTrimId]);

  const handleVinDecode = async () => {
    if (!vin.trim()) {
      toast.error('Please enter a VIN');
      return;
    }

    setIsDecodingVin(true);
    try {
      const response = await fetch('/api/garage/decode-vin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vin }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to decode VIN');
      }

      setVinVehicleData(data.vehicleData);
      setSelectedVinTrimId(data.vehicleData.trims[0]?.id || '');
      toast.success('VIN decoded successfully!');
    } catch (error) {
      console.error('Error decoding VIN:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to decode VIN');
    } finally {
      setIsDecodingVin(false);
    }
  };

  const handleManualSearch = async () => {
    if (!selectedYear || !selectedMake || !selectedModel) {
      toast.error('Please select year, make, and model');
      return;
    }

    try {
      // Fetch vehicle data based on year/make/model
      const filters = {
        minYear: parseInt(selectedYear),
        maxYear: parseInt(selectedYear),
        make: selectedMake,
        model: selectedModel,
      };

      const response = await fetch('/api/explore/vehicles?page=1&pageSize=1&' +
        new URLSearchParams({
          minYear: filters.minYear.toString(),
          maxYear: filters.maxYear.toString(),
          make: filters.make,
          model: filters.model,
        }).toString());

      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          setManualVehicleData(data.data[0]);
          setSelectedTrimId(data.data[0].trims[0]?.id || '');
        } else {
          toast.error('No vehicles found with the selected criteria');
        }
      } else {
        toast.error('Failed to search for vehicles');
      }
    } catch (error) {
      console.error('Error searching vehicles:', error);
      toast.error('Failed to search for vehicles');
    }
  };

  const handleAddToGarage = async () => {
    if (!selectedTrim) {
      toast.error('Please select a vehicle and trim before adding to your garage.');
      return;
    }

    if (!user) {
      toast.error('You must be signed in to add a vehicle to your garage.');
      return;
    }

    setIsAddingToGarage(true);

    try {
      // Use Server Action instead of API route
      const { addVehicleToGarage } = await import('@/actions/garage');
      const result = await addVehicleToGarage(selectedTrim.id);

      if (result.error) {
        throw new Error(result.error);
      }

      setIsAddedToGarage(true);
      toast.success('Vehicle successfully added to your garage!');

      // Trigger refresh of garage data
      if (onVehicleAdded) {
        onVehicleAdded();
      }

      setTimeout(() => {
        onOpenChange(false);
        // Reset state
        setVin('');
        setVinVehicleData(null);
        setSelectedVinTrimId('');
        setSelectedYear('');
        setSelectedMake('');
        setSelectedModel('');
        setSelectedTrimId('');
        setManualVehicleData(null);
        setIsAddedToGarage(false);
        setActiveTab('vin');
      }, 2000);
    } catch (error) {
      console.error('Error adding vehicle to garage:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add vehicle to garage');
    } finally {
      setIsAddingToGarage(false);
    }
  };

  const handleExploreClick = () => {
    onOpenChange(false);
    router.push('/explore');
  };

  const imageSources = selectedTrim ? getVehicleImageSources(
    selectedTrim.image_url || currentVehicleData?.heroImage,
    currentVehicleData?.make,
    currentVehicleData?.model,
    currentVehicleData?.year
  ) : '';

  const canAddToGarage = !!(selectedTrim && !isAddingToGarage && !isAddedToGarage);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader>
          <DialogTitle>Add a Vehicle to Your Garage</DialogTitle>
          <DialogDescription>
            Search our database by VIN or by Year, Make, and Model.
          </DialogDescription>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="px-6 pt-4">
          <div className="flex space-x-1 bg-muted p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('vin')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'vin'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
            >
              VIN Decoder
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'manual'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
            >
              Manual Entry
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'vin' ? (
            /* VIN Decoder Tab */
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={vin}
                  onChange={(e) => setVin(e.target.value.toUpperCase())}
                  placeholder="Enter VIN (17 characters)"
                  className="flex-1"
                  maxLength={17}
                />
                <Button
                  onClick={handleVinDecode}
                  disabled={isDecodingVin || vin.length !== 17}
                  variant="secondary"
                >
                  {isDecodingVin ? 'Decoding...' : 'Decode'}
                </Button>
              </div>

              {vinVehicleData && (
                <div className="text-sm text-muted-foreground">
                  VIN decoding will show vehicle details here once implemented.
                </div>
              )}
            </div>
          ) : (
            /* Manual Entry Tab */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground block">Year:</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => {
                      setSelectedYear(e.target.value);
                      setSelectedMake('');
                      setSelectedModel('');
                      setSelectedTrimId('');
                      setManualVehicleData(null);
                    }}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select Year</option>
                    {filterOptions?.years.map((year) => (
                      <option key={year} value={year.toString()}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground block">Make:</label>
                  <select
                    value={selectedMake}
                    onChange={(e) => {
                      setSelectedMake(e.target.value);
                      setSelectedModel('');
                      setSelectedTrimId('');
                      setManualVehicleData(null);
                    }}
                    disabled={!selectedYear}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select Make</option>
                    {availableMakes.map((make) => (
                      <option key={make} value={make}>
                        {make}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground block">Model:</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => {
                      setSelectedModel(e.target.value);
                      setSelectedTrimId('');
                      setManualVehicleData(null);
                    }}
                    disabled={!selectedMake}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select Model</option>
                    {availableModels.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={handleManualSearch}
                    disabled={!selectedYear || !selectedMake || !selectedModel}
                    className="w-full"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>

              {manualVehicleData && (
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground block">Trim:</label>
                  <select
                    value={selectedTrimId}
                    onChange={(e) => setSelectedTrimId(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {manualVehicleData.trims.map((trim) => (
                      <option key={trim.id} value={trim.id}>
                        {trim.trim || trim.trim_description || trim.model}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Vehicle Details Display */}
          {currentVehicleData && selectedTrim && (
            <div className="mt-6 border-t border-border pt-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Left Column - Image and Trim Selector */}
                <div className="space-y-4">
                  <div className="w-full aspect-video overflow-hidden rounded-lg bg-muted">
                    <ImageWithFallback
                      src={imageSources}
                      fallbackSrc="/branding/fallback-logo.png"
                      alt={`${currentVehicleData.make} ${currentVehicleData.model}`}
                      width={600}
                      height={338}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="text-center">
                    <h3 className="font-bold text-lg text-foreground">
                      {currentVehicleData.year} {currentVehicleData.make} {currentVehicleData.model}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {selectedTrim.trim || `${currentVehicleData.trims.length} trims available`}
                    </p>
                  </div>
                </div>

                {/* Right Column - Specifications */}
                <div className="space-y-4">
                  {/* Vehicle Type */}
                  {(selectedTrim.body_type || selectedTrim.drive_type) && (
                    <div className="text-muted-foreground">
                      <span className="text-lg text-foreground">
                        {[selectedTrim.body_type, selectedTrim.drive_type].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}

                  {/* Engine */}
                  {selectedTrim.engine_size_l && (
                    <div className="space-y-1">
                      <div className="text-muted-foreground text-sm">Engine:</div>
                      <div className="text-foreground">
                        {formatEngine(selectedTrim)}
                        {selectedTrim.fuel_type && ` • ${selectedTrim.fuel_type}`}
                      </div>
                    </div>
                  )}

                  {/* Output */}
                  {(selectedTrim.horsepower_hp || selectedTrim.torque_ft_lbs) && (
                    <div className="space-y-1">
                      <div className="text-muted-foreground text-sm">Output:</div>
                      <div className="text-foreground">
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
                      <div className="text-muted-foreground text-sm">Transmission:</div>
                      <div className="text-foreground">{selectedTrim.transmission}</div>
                    </div>
                  )}

                  {/* Fuel Economy/Range */}
                  {selectedTrim.epa_combined_mpg && (
                    <div className="space-y-1">
                      <div className="text-muted-foreground text-sm">Fuel Economy/Range:</div>
                      <div className="text-foreground">{formatFuelEconomy(selectedTrim)}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="flex w-full flex-col gap-4 sm:flex-row sm:justify-between items-center">
            <div className="hidden sm:block">
              <Button
                onClick={handleExploreClick}
                variant="ghost"
              >
                Need help finding a vehicle?
              </Button>
            </div>
            <div className="flex gap-4 w-full sm:w-auto justify-end">
              <Button
                onClick={() => onOpenChange(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddToGarage}
                disabled={!canAddToGarage}
                className={isAddedToGarage ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                {isAddingToGarage
                  ? 'Adding...'
                  : isAddedToGarage
                    ? 'Added'
                    : 'Add Vehicle'
                }
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddVehicleModal;
