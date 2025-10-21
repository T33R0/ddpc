'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui/label';
import { Textarea } from '@repo/ui/textarea';
// Using native select for now - Select component not available
import { Card } from '@repo/ui/card';

interface PastEventQuickAddProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function PastEventQuickAdd({ trigger, onSuccess, open: controlledOpen, onOpenChange }: PastEventQuickAddProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    vehicleId: '',
    title: '',
    description: '',
    date: '',
    odometer: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.vehicleId || !formData.title || !formData.date) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicleId: formData.vehicleId,
          type: 'historical',
          title: formData.title,
          description: formData.description || undefined,
          date: formData.date,
          odometer: formData.odometer ? parseInt(formData.odometer) : undefined,
          photos: [], // T0 allows up to 1 photo, but we'll skip for now
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.code === 'UPGRADE_REQUIRED') {
          alert(`This feature requires a ${error.targetTier} plan`);
          return;
        }
        throw new Error(error.error || 'Failed to create event');
      }

      // Reset form
      setFormData({
        vehicleId: '',
        title: '',
        description: '',
        date: '',
        odometer: '',
      });

      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create event:', error);
      alert('Failed to create event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultTrigger = (
    <Button className="bg-lime-500 text-black hover:bg-lime-400">
      Log a Past Event
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-800 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Log Past Event</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Vehicle Selection */}
          <div>
            <Label htmlFor="vehicle" className="text-white">Vehicle</Label>
            <select
              id="vehicle"
              value={formData.vehicleId}
              onChange={(e) => setFormData(prev => ({ ...prev, vehicleId: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lime-500"
              required
            >
              <option value="" disabled>Select vehicle</option>
              {/* TODO: Replace with actual vehicle data */}
              <option value="1">2020 Honda Civic</option>
              <option value="2">2018 Toyota Camry</option>
            </select>
          </div>

          {/* Event Title */}
          <div>
            <Label htmlFor="title" className="text-white">What happened?</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Oil change, Tire rotation, Brake pads replaced"
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              required
            />
          </div>

          {/* Date */}
          <div>
            <Label htmlFor="date" className="text-white">When did it happen?</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className="bg-gray-800 border-gray-700 text-white"
              required
            />
          </div>

          {/* Odometer (Optional) */}
          <div>
            <Label htmlFor="odometer" className="text-white">Mileage (optional)</Label>
            <Input
              id="odometer"
              type="number"
              value={formData.odometer}
              onChange={(e) => setFormData(prev => ({ ...prev, odometer: e.target.value }))}
              placeholder="e.g., 45000"
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
            />
          </div>

          {/* Description (Optional) */}
          <div>
            <Label htmlFor="description" className="text-white">Notes (optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Any additional details..."
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 min-h-[80px]"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.vehicleId || !formData.title || !formData.date}
              className="flex-1 bg-lime-500 text-black hover:bg-lime-400 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Empty state component for when no events exist
export function EmptyState() {
  return (
    <Card className="p-8 bg-gray-900 border-gray-800 text-center">
      <div className="mb-6">
        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Start Your Maintenance History</h3>
        <p className="text-gray-400">
          Log your first vehicle event to begin building a comprehensive maintenance record.
        </p>
      </div>

      <PastEventQuickAdd />
    </Card>
  );
}
