'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/dialog';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui/label';
import { useState } from 'react';
import { PartSlot } from '../types';

interface AddPartModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: PartSlot | null;
}

export const AddPartModal = ({ isOpen, onClose, slot }: AddPartModalProps) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Placeholder for backend mutation
    console.log('Adding part to slot:', slot?.name);

    // Simulate delay
    setTimeout(() => {
        setLoading(false);
        onClose();
    }, 500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Part: {slot?.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="partName">Part Name</Label>
            <Input id="partName" placeholder="e.g. Interstate Battery" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="partNumber">Part Number</Label>
            <Input id="partNumber" placeholder="e.g. MTZ-34" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendorLink">Vendor Link</Label>
            <Input id="vendorLink" type="url" placeholder="https://..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="installedDate">Date Installed</Label>
                <Input id="installedDate" type="date" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="installedMileage">Mileage Installed</Label>
                <Input id="installedMileage" type="number" inputMode="numeric" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
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
