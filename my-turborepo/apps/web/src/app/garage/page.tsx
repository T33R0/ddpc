'use client';

import React, { useState } from 'react';
import { useVehicles } from '@/lib/hooks/useVehicles';
import { Card, CardContent } from '@repo/ui/card';
import { Button } from '@repo/ui/button';
import { Badge } from '@repo/ui/badge';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@repo/ui/modal';
import { Plus, Car } from 'lucide-react';

interface Vehicle {
  id: string;
  name: string;
  ymmt: string;
  odometer: number | null;
  current_status: string;
}

function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  // Extract year from ymmt for display
  const year = vehicle.ymmt.split(' ')[0];
  const makeModel = vehicle.ymmt.split(' ').slice(1).join(' ');

  // Determine badge text and styling based on status
  const getStatusBadge = () => {
    switch (vehicle.current_status) {
      case 'daily_driver':
        return {
          text: 'Active',
          className: 'bg-green-500/10 text-green-400 border-green-500/20'
        };
      case 'parked':
        return {
          text: 'Parked',
          className: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
        };
      case 'listed':
        return {
          text: 'Listed',
          className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
        };
      case 'sold':
        return {
          text: 'Sold',
          className: 'bg-red-500/10 text-red-400 border-red-500/20'
        };
      case 'retired':
        return {
          text: 'Retired',
          className: 'bg-gray-500/10 text-gray-400 border-gray-500/20'
        };
      default:
        return {
          text: vehicle.current_status,
          className: 'bg-gray-500/10 text-gray-400 border-gray-500/20'
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <Card className="bg-gray-900 border-gray-800 overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300">
      <div className="aspect-w-16 aspect-h-9">
        <img
          alt={`${vehicle.name} vehicle`}
          className="w-full h-full object-cover"
          src={`https://images.unsplash.com/photo-1494905998402-395d579af36f?w=400&h=225&fit=crop&crop=center`}
        />
      </div>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-400">{year} Performance Car</p>
            <h2 className="text-xl font-bold text-white mt-1">{vehicle.name}</h2>
          </div>
          <Badge variant="secondary" className={badge.className}>
            {badge.text}
          </Badge>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center text-sm text-gray-400">
          <span>Nickname</span>
          <span className="font-medium text-white">{vehicle.name}</span>
        </div>
        <div className="mt-2 flex justify-between items-center text-sm text-gray-400">
          <span>Mileage</span>
          <span className="font-medium text-white">{vehicle.odometer ? `${vehicle.odometer.toLocaleString()} mi` : 'N/A'}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function AddVehicleCard({ onClick }: { onClick: () => void }) {
  return (
    <Card
      className="min-h-[250px] border-2 border-dashed border-gray-700 bg-transparent hover:bg-gray-900/50 hover:border-red-500/50 transition-colors duration-300 cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="flex items-center justify-center h-full p-6">
        <div className="flex flex-col items-center justify-center text-gray-400 hover:text-red-400 transition-colors duration-300">
          <Plus className="text-4xl mb-2" />
          <span className="text-sm font-semibold">Add a Vehicle</span>
        </div>
      </CardContent>
    </Card>
  );
}

function AddVehicleModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="bg-gray-900 border-gray-800">
        <ModalHeader>
          <ModalTitle className="text-white">Add a Vehicle</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <p className="text-gray-300">Here is where you'll add a vehicle</p>
        </ModalBody>
        <ModalFooter>
          <Button onClick={() => onOpenChange(false)} className="bg-red-600 hover:bg-red-700">
            Okay
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function VehicleGallery({ title, vehicles, showAddCard, onAddClick }: {
  title: string;
  vehicles: Vehicle[];
  showAddCard?: boolean;
  onAddClick?: () => void;
}) {
  if (vehicles.length === 0 && !showAddCard) {
    return null;
  }

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {vehicles.map((vehicle) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} />
        ))}

        {showAddCard && (
          <AddVehicleCard onClick={onAddClick || (() => {})} />
        )}
      </div>
    </div>
  );
}

export default function Garage() {
  const { data: vehiclesData, isLoading } = useVehicles();
  const [addVehicleModalOpen, setAddVehicleModalOpen] = useState(false);

  const vehicles = vehiclesData?.vehicles || [];

  // Separate vehicles into active and stored
  const activeVehicles = vehicles.filter(vehicle => vehicle.current_status === 'daily_driver');
  const storedVehicles = vehicles.filter(vehicle => vehicle.current_status !== 'daily_driver');

  // Show add vehicle card only if total vehicles < 3
  const canAddVehicle = vehicles.length < 3;

  if (isLoading) {
    return (
      <section className="relative py-12 bg-black min-h-screen">
        <div className="relative container px-4 md:px-6 pt-24">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">My Garage</h1>
            <p className="text-xl text-gray-300">Loading your garage...</p>
          </div>
        </div>
      </section>
    );
  }

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
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-white mb-2">My Garage</h1>
            <p className="text-lg text-gray-400">Here's your garage</p>
          </div>

          {/* Active Vehicles Section */}
          <VehicleGallery
            title="Active Vehicles"
            vehicles={activeVehicles}
            showAddCard={canAddVehicle}
            onAddClick={() => setAddVehicleModalOpen(true)}
          />

          {/* Stored Vehicles Section */}
          <VehicleGallery
            title="Stored Vehicles"
            vehicles={storedVehicles}
          />
        </div>
      </section>

      <AddVehicleModal open={addVehicleModalOpen} onOpenChange={setAddVehicleModalOpen} />
    </>
  );
}
