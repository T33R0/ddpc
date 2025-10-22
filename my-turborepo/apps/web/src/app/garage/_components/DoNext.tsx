'use client';

import React, { useState } from 'react';
import { Card } from '@repo/ui/card';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui/label';
import toast from 'react-hot-toast';

interface DoNextProps {
  vehicleId: string | null;
  hasPredictions: boolean;
  onEventLogged?: () => void;
}

export function DoNext({ vehicleId, hasPredictions, onEventLogged }: DoNextProps) {
  const [title, setTitle] = useState('');
  const [occurredAt, setOccurredAt] = useState('');
  const [odometer, setOdometer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Show empty state when no vehicle is selected
  if (!vehicleId) {
    return (
      <Card className="p-6 bg-gray-900 border-gray-800">
        <h2 className="text-xl font-semibold text-white mb-4">Log Past Event</h2>
        <div className="text-center py-8">
          <div className="text-gray-400">Select a vehicle to log events</div>
        </div>
      </Card>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!vehicleId) {
      toast.error('No vehicle selected');
      return;
    }

    if (!title.trim() || !occurredAt || !odometer) {
      toast.error('Please fill in all fields');
      return;
    }

    const odometerNum = parseInt(odometer);
    if (isNaN(odometerNum) || odometerNum < 0) {
      toast.error('Please enter a valid odometer reading');
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
          vehicleId,
          kind: 'MOD_INSTALL',
          title: title.trim(),
          occurredAt,
          odometer: odometerNum,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to log event');
      }

      toast.success('Event logged successfully!');
      setTitle('');
      setOccurredAt('');
      setOdometer('');
      onEventLogged?.();
    } catch (error) {
      console.error('Error logging event:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to log event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6 bg-gray-900 border-gray-800">
      <h2 className="text-xl font-semibold text-white mb-4">Log Past Event</h2>

      {!hasPredictions && (
        <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
          <p className="text-sm text-blue-300">
            Log an install with odometer to unlock predictions for this vehicle.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="title" className="text-white">Title *</Label>
          <Input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Exhaust System, Turbocharger"
            className="bg-gray-800 border-gray-700 text-white"
            required
          />
        </div>

        <div>
          <Label htmlFor="occurredAt" className="text-white">Date *</Label>
          <Input
            id="occurredAt"
            type="date"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
            className="bg-gray-800 border-gray-700 text-white"
            required
          />
        </div>

        <div>
          <Label htmlFor="odometer" className="text-white">Odometer (miles) *</Label>
          <Input
            id="odometer"
            type="number"
            value={odometer}
            onChange={(e) => setOdometer(e.target.value)}
            placeholder="e.g., 45000"
            className="bg-gray-800 border-gray-700 text-white"
            min="0"
            required
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || !vehicleId}
          className="w-full bg-lime-600 hover:bg-lime-700 text-white"
        >
          {isSubmitting ? 'Logging Event...' : 'Log Event'}
        </Button>
      </form>
    </Card>
  );
}
