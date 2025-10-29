'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useVehicles, useStoredVehicles } from '@/lib/hooks/useVehicles';
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
  const router = useRouter();

  // Extract year from ymmt for display
  const year = vehicle.ymmt.split(' ')[0];
  const makeModel = vehicle.ymmt.split(' ').slice(1).join(' ');

  // Format status for display
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

  const handleClick = () => {
    router.push(`/vehicle/${vehicle.id}`);
  };

  return (
    <Card
      className="bg-gray-900 border-gray-800 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
      onClick={handleClick}
    >
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
        </div>
        <div className="mt-4 pt-4 border-t border-gray-800">
          <div className="flex justify-between items-center text-sm text-gray-400">
            <span>Nickname</span>
            <span className="font-medium text-white">{vehicle.name}</span>
          </div>
          <div className="mt-2 flex justify-between items-center text-sm text-gray-400">
            <span>Mileage</span>
            <span className="font-medium text-white">{vehicle.odometer ? `${vehicle.odometer.toLocaleString()} mi` : 'N/A'}</span>
          </div>
          <div className="mt-2 flex justify-between items-center text-sm text-gray-400">
            <span>Status</span>
            <span className="font-medium text-white">{formatStatus(vehicle.current_status)}</span>
          </div>
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

function VehicleGallery({ title, vehicles, showAddCard, onAddClick, onLoadMore, loadingMore, hasMore }: {
  title: string;
  vehicles: Vehicle[];
  showAddCard?: boolean;
  onAddClick?: () => void;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  hasMore?: boolean;
}) {
  // Infinite scroll logic
  const handleScroll = useCallback(() => {
    if (!onLoadMore || loadingMore || !hasMore) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    // Load more when user is within 300px of the bottom
    if (scrollTop + windowHeight >= documentHeight - 300) {
      onLoadMore();
    }
  }, [onLoadMore, loadingMore, hasMore]);

  useEffect(() => {
    if (onLoadMore) {
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll, onLoadMore]);

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

      {loadingMore && (
        <div className="flex justify-center mt-8">
          <div className="text-gray-400">Loading more vehicles...</div>
        </div>
      )}
    </div>
  );
}

export default function Garage() {
  const { data: vehiclesData, isLoading: activeLoading } = useVehicles();
  const { vehicles: storedVehicles, isLoading: storedLoading, loadingMore, hasMore, loadMore } = useStoredVehicles();
  const [addVehicleModalOpen, setAddVehicleModalOpen] = useState(false);

  const allVehicles = vehiclesData?.vehicles || [];
  const activeVehicles = allVehicles.filter(vehicle => vehicle.current_status === 'daily_driver');

  // Show add vehicle card only if active vehicles < 3
  const canAddVehicle = activeVehicles.length < 3;

  if (activeLoading) {
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
            onLoadMore={loadMore}
            loadingMore={loadingMore}
            hasMore={hasMore}
          />

          {storedLoading && storedVehicles.length === 0 && (
            <div className="flex justify-center mt-8">
              <div className="text-gray-400">Loading stored vehicles...</div>
            </div>
          )}
        </div>
      </section>

      <AddVehicleModal open={addVehicleModalOpen} onOpenChange={setAddVehicleModalOpen} />
    </>
  );
}
