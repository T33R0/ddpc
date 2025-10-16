'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import type { Vehicle } from '@repo/types';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '@repo/ui/auth-context';
import { BuildThread } from '../build-thread/build-thread';

interface UserVehicle extends Vehicle {
  id: string;
  current_status: string;
  nickname?: string;
  title?: string;
  owner_id: string;
}

type GarageVehicleDetailsModalProps = {
  vehicle: UserVehicle;
  onClose: () => void;
};

const GarageVehicleDetailsModal = ({ vehicle, onClose }: GarageVehicleDetailsModalProps) => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [selectedTrim, setSelectedTrim] = useState(vehicle.trim);
  const [vehicleStatus, setVehicleStatus] = useState(vehicle.current_status);
  const [vehicleNickname, setVehicleNickname] = useState(vehicle.nickname || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const { session } = useAuth();

  const handleTrimChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTrim(event.target.value);
  };

  const handleUpdateVehicle = async () => {
    setIsUpdating(true);

    try {
      const response = await fetch('/api/garage/update-vehicle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicleId: vehicle.id,
          nickname: vehicleNickname,
          status: vehicleStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update vehicle');
      }

      toast.success('Vehicle updated successfully!');
    } catch (error) {
      console.error('Error updating vehicle:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update vehicle');
    } finally {
      setIsUpdating(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Overview':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p><strong>Body Type:</strong> {vehicle.body_type}</p>
              <p><strong>Fuel Type:</strong> {vehicle.fuel_type}</p>
              <p><strong>Transmission:</strong> {vehicle.transmission}</p>
              <p><strong>Drive Type:</strong> {vehicle.drive_type}</p>
              <p><strong>Curb Weight:</strong> {vehicle.curb_weight_lbs} lbs</p>
            </div>
            <div>
              <p><strong>Engine:</strong> {vehicle.cylinders} cylinders, {vehicle.engine_size_l}L</p>
              <p><strong>Power:</strong> {vehicle.horsepower_hp} HP @ {vehicle.horsepower_rpm} RPM</p>
              <p><strong>Torque:</strong> {vehicle.torque_ft_lbs} lb-ft @ {vehicle.torque_rpm} RPM</p>
              <p><strong>MPG:</strong> {vehicle.epa_combined_mpg} combined</p>
            </div>
          </div>
        );
      case 'Build Tracking':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-semibold text-white mb-2">Build Status</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { status: 'daily_driver', label: 'Daily Driver', color: 'green' },
                  { status: 'project', label: 'Project Car', color: 'orange' },
                  { status: 'weekend_warrior', label: 'Weekend Warrior', color: 'purple' }
                ].map(({ status, label, color }) => (
                  <button
                    key={status}
                    onClick={() => setVehicleStatus(status)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      vehicleStatus === status
                        ? `border-${color}-400 bg-${color}-500/20 text-${color}-400`
                        : 'border-gray-600 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-2">Build Progress</h4>
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white">Overall Progress</span>
                  <span className="text-lime-400">25%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-lime-400 h-2 rounded-full" style={{ width: '25%' }}></div>
                </div>
                <div className="mt-3 text-sm text-gray-400">
                  Engine: 0% • Suspension: 50% • Brakes: 0% • Wheels: 100%
                </div>
              </div>
            </div>
          </div>
        );
      case 'Maintenance Log':
        return (
          <div className="space-y-4">
            <div className="text-center text-gray-400 py-8">
              <p>Maintenance log feature coming soon!</p>
              <p className="text-sm mt-2">Track service history, repairs, and upgrades.</p>
            </div>
          </div>
        );
      case 'Build Thread':
        return <BuildThread vehicleId={vehicle.id} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <button
          className="absolute top-4 right-4 text-white hover:text-lime-400 text-2xl z-10"
          onClick={onClose}
        >
          ×
        </button>

        <div className="flex flex-col md:flex-row">
          {/* Left side - Image and basic info */}
          <div className="md:w-1/2 p-6 bg-black/50">
            <Image
              src={vehicle.image_url || ''}
              alt={`${vehicle.make} ${vehicle.model}`}
              className="w-full h-48 object-cover rounded-lg mb-4"
              width={400}
              height={225}
            />
            <h2 className="text-2xl font-bold text-white mb-2">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h2>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">Nickname:</label>
              <input
                type="text"
                value={vehicleNickname}
                onChange={(e) => setVehicleNickname(e.target.value)}
                className="w-full bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-lime-400 focus:outline-none"
                placeholder="Enter nickname..."
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">Trim:</label>
              <select
                value={selectedTrim}
                onChange={handleTrimChange}
                className="w-full bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-lime-400 focus:outline-none"
              >
                <option value="Base">Base</option>
                <option value="Sport">Sport</option>
                <option value="Limited">Limited</option>
              </select>
            </div>
            <button
              onClick={handleUpdateVehicle}
              disabled={isUpdating}
              className="w-full bg-lime-500 text-black py-2 px-4 rounded-lg font-semibold hover:bg-lime-400 disabled:opacity-50 transition-colors"
            >
              {isUpdating ? 'Updating...' : 'Update Vehicle'}
            </button>
          </div>

          {/* Right side - Tabs and content */}
          <div className="md:w-1/2 p-6 overflow-y-auto max-h-[70vh]">
            <div className="flex space-x-1 mb-4 bg-gray-800 rounded-lg p-1">
              {[
                { id: 'Overview', label: 'Overview' },
                { id: 'Build Tracking', label: 'Build Tracking' },
                { id: 'Maintenance Log', label: 'Maintenance' },
                { id: 'Build Thread', label: 'Build Thread' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-lime-500 text-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="text-white">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GarageVehicleDetailsModal;
