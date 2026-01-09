'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@repo/ui/dialog';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui/label';
import { useState } from 'react';
import { PartSlot } from '../types';
import { addPartToVehicle } from '../actions';
import { useRouter } from 'next/navigation';

interface AddPartModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: PartSlot | null;
  vehicleId: string;
  onSuccess?: () => void;
}

export const AddPartModal = ({ isOpen, onClose, slot, vehicleId, onSuccess }: AddPartModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!slot) return;

    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const partName = formData.get('partName') as string;
    const partNumber = formData.get('partNumber') as string;
    const vendorLink = formData.get('vendorLink') as string;
    const installedDate = formData.get('installedDate') as string;
    const installedMileage = formData.get('installedMileage') as string;

    try {
      const result = await addPartToVehicle(vehicleId, slot.id, {
        name: partName,
        partNumber: partNumber || undefined,
        vendorLink: vendorLink || undefined,
        installedDate: installedDate || undefined,
        installedMileage: installedMileage ? parseInt(installedMileage, 10) : undefined,
      });

      if ('error' in result) {
        setError(result.error);
        setLoading(false);
      } else {
        // Success - refresh the data
        onClose();
        if (onSuccess) {
          onSuccess();
        } else {
          router.refresh();
        }
      }
    } catch (err) {
      console.error('Error adding part:', err);
      setError('Failed to add part. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Part: {slot?.name}</DialogTitle>
          <DialogDescription>
            Add a part to track in this component slot. The part will be saved to your vehicle&apos;s parts list.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="partName">Part Name</Label>
            <Input id="partName" name="partName" placeholder="e.g. Interstate Battery" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="partNumber">Part Number</Label>
            <Input id="partNumber" name="partNumber" placeholder="e.g. MTZ-34" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendorLink">Vendor Link</Label>
            <Input id="vendorLink" name="vendorLink" type="url" placeholder="https://..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="installedDate">Date Installed</Label>
                <Input id="installedDate" name="installedDate" type="date" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="installedMileage">Mileage Installed</Label>
                <Input id="installedMileage" name="installedMileage" type="number" inputMode="numeric" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Part'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
