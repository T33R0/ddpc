'use client';

import React, { useState } from 'react';
import {
  Modal,
  ModalBody,
  ModalClose,
  ModalContent,
  ModalHeader,
  ModalTitle,
} from '@repo/ui/modal';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui/label';
import { useVehicles } from '../lib/hooks/useVehicles';
import toast from 'react-hot-toast';

type LogServiceModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LogServiceModal({ open, onOpenChange }: LogServiceModalProps) {
  const { data: vehiclesData } = useVehicles();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    vehicleId: '',
    serviceDate: new Date().toISOString().split('T')[0],
    serviceType: '',
    odometer: '',
    cost: '',
  });

  const vehicles = vehiclesData?.vehicles || [];
  const serviceTypes = [
    'Oil Change',
    'Tire Rotation',
    'Brake Replacement',
    'Fluid Top-up',
    'General Inspection',
    'Other',
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.vehicleId || !formData.serviceDate || !formData.serviceType) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/garage/log-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to log service');
      }

      await response.json();
      toast.success('Service logged successfully!');
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error logging service:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to log service. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      vehicleId: '',
      serviceDate: new Date().toISOString().split('T')[0],
      serviceType: '',
      odometer: '',
      cost: '',
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Modal open={open} onOpenChange={handleOpenChange}>
      <ModalContent className="max-w-2xl">
        <ModalHeader>
          <ModalTitle>Log Service</ModalTitle>
        </ModalHeader>

        <ModalBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              {/* Vehicle Selection */}
              <div className="md:col-span-2">
                <Label htmlFor="vehicle-select" className="text-white">Vehicle *</Label>
                <select
                  id="vehicle-select"
                  value={formData.vehicleId}
                  onChange={(e) => handleInputChange('vehicleId', e.target.value)}
                  className="w-full h-9 rounded-md border border-slate-700 bg-transparent px-3 py-1 text-sm text-white shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="" className="bg-gray-900 text-white">Select a vehicle</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id} className="bg-gray-900 text-white">
                      {vehicle.name} ({vehicle.ymmt})
                    </option>
                  ))}
                </select>
              </div>

              {/* Service Date */}
              <div>
                <Label htmlFor="service-date" className="text-white">Date of Service *</Label>
                <Input
                  id="service-date"
                  type="date"
                  value={formData.serviceDate}
                  onChange={(e) => handleInputChange('serviceDate', e.target.value)}
                  className="bg-transparent border-slate-700 text-white"
                  required
                />
              </div>

              {/* Service Type */}
              <div>
                <Label htmlFor="service-type" className="text-white">Type of Service *</Label>
                <select
                  id="service-type"
                  value={formData.serviceType}
                  onChange={(e) => handleInputChange('serviceType', e.target.value)}
                  className="w-full h-9 rounded-md border border-slate-700 bg-transparent px-3 py-1 text-sm text-white shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="" className="bg-gray-900 text-white">Select service type</option>
                  {serviceTypes.map((type) => (
                    <option key={type} value={type} className="bg-gray-900 text-white">
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Odometer Reading */}
              <div>
                <Label htmlFor="odometer" className="text-white">Odometer Reading</Label>
                <Input
                  id="odometer"
                  type="number"
                  placeholder="e.g., 45123"
                  value={formData.odometer}
                  onChange={(e) => handleInputChange('odometer', e.target.value)}
                  className="bg-transparent border-slate-700 text-white placeholder-gray-400"
                />
              </div>

              {/* Cost */}
              <div>
                <Label htmlFor="cost" className="text-white">Cost</Label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-sm text-gray-400">$</span>
                  </div>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.cost}
                    onChange={(e) => handleInputChange('cost', e.target.value)}
                    className="pl-7 bg-transparent border-slate-700 text-white placeholder-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-700">
              <ModalClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="bg-transparent border-slate-700 hover:bg-slate-900/50"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </ModalClose>
              <Button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
