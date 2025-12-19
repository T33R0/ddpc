'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@repo/ui/button'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@repo/ui/modal'
import { Label } from '@repo/ui/label'
import { Input } from '@repo/ui/input'
import { Checkbox } from '@repo/ui/checkbox'
import { Textarea } from '@repo/ui/textarea'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface AddFuelEntryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AddFuelEntryDialog({ open, onOpenChange, onSuccess }: AddFuelEntryDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<{ id: string; nickname: string; make: string; model: string; year: number }[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0] || '');
  const [odometer, setOdometer] = useState<string>('');
  const [gallons, setGallons] = useState<string>('');
  const [pricePerGallon, setPricePerGallon] = useState<string>('');
  const [totalCost, setTotalCost] = useState<string>('');
  const [fuelType, setFuelType] = useState<string>('Regular');
  const [fullTank, setFullTank] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const fetchVehicles = React.useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('user_vehicle')
        .select('id, nickname, make, model, year')
        .eq('owner_id', user?.id);

      if (error) throw error;
      setVehicles(data || []);
      if (data && data.length > 0) {
        setSelectedVehicleId(data[0]?.id || '');
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  }, [user]);

  useEffect(() => {
    if (open && user) {
      fetchVehicles();
    }
  }, [open, user, fetchVehicles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedVehicleId) return;

    setLoading(true);
    setError(null);

    try {
      // Calculate missing value if 2 out of 3 are provided (gallons, price, total)
      let finalGallons = gallons;
      let finalPrice = pricePerGallon;
      let finalTotal = totalCost;

      if (gallons && pricePerGallon && !totalCost) {
        finalTotal = (parseFloat(gallons) * parseFloat(pricePerGallon)).toFixed(2);
      } else if (gallons && totalCost && !pricePerGallon) {
        finalPrice = (parseFloat(totalCost) / parseFloat(gallons)).toFixed(3);
      } else if (totalCost && pricePerGallon && !gallons) {
        finalGallons = (parseFloat(totalCost) / parseFloat(pricePerGallon)).toFixed(3);
      }

      if (!finalGallons || !finalPrice || !finalTotal) {
        throw new Error("Please provide at least two of: Gallons, Price/Gallon, Total Cost");
      }

      const { error } = await supabase.from('fuel_log').insert({
        user_vehicle_id: selectedVehicleId,
        date,
        odometer: parseInt(odometer),
        gallons: parseFloat(finalGallons),
        price_per_gallon: parseFloat(finalPrice),
        total_cost: parseFloat(finalTotal),
        fuel_type: fuelType,
        full_tank: fullTank,
        notes,
        user_id: user.id
      });

      if (error) throw error;

      toast.success('Fuel entry added successfully');
      onSuccess?.();
      onOpenChange(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add fuel entry');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDate(new Date().toISOString().split('T')[0] || '');
    setOdometer('');
    setGallons('');
    setPricePerGallon('');
    setTotalCost('');
    setNotes('');
    setError(null);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="sm:max-w-md">
        <ModalHeader>
          <ModalTitle>Add Fuel Entry</ModalTitle>
          <ModalDescription>
            Record a new fuel fill-up for your vehicle.
          </ModalDescription>
        </ModalHeader>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vehicle">Vehicle</Label>
            <select
              id="vehicle"
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
            >
              <option value="" disabled>Select vehicle</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nickname || `${v.year} ${v.make} ${v.model}`}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="odometer">Odometer</Label>
              <Input
                id="odometer"
                type="number"
                placeholder="Miles"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-2">
              <Label htmlFor="gallons">Gallons</Label>
              <Input
                id="gallons"
                type="number"
                step="0.001"
                placeholder="0.000"
                value={gallons}
                onChange={(e) => setGallons(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price/Gal</Label>
              <Input
                id="price"
                type="number"
                step="0.001"
                placeholder="$0.000"
                value={pricePerGallon}
                onChange={(e) => setPricePerGallon(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total">Total</Label>
              <Input
                id="total"
                type="number"
                step="0.01"
                placeholder="$0.00"
                value={totalCost}
                onChange={(e) => setTotalCost(e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Enter at least 2 of the 3 fields above.</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fuelType">Fuel Type</Label>
              <select
                id="fuelType"
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
              >
                <option value="Regular">Regular (87)</option>
                <option value="Midgrade">Midgrade (89)</option>
                <option value="Premium">Premium (91+)</option>
                <option value="Diesel">Diesel</option>
                <option value="E85">E85</option>
              </select>
            </div>
            <div className="flex items-center space-x-2 pt-8">
              <Checkbox
                id="fullTank"
                checked={fullTank}
                onCheckedChange={(checked) => setFullTank(checked as boolean)}
              />
              <Label htmlFor="fullTank">Full Tank</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Gas station, driving conditions, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Entry'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
