'use client';

import React from 'react';
import type { Vehicle } from '@repo/types';

interface UserVehicle extends Vehicle {
  current_status: string;
  nickname?: string;
}

interface GarageStatsProps {
  vehicles: UserVehicle[];
}

export function GarageStats({ vehicles }: GarageStatsProps) {
  // Calculate statistics
  const totalVehicles = vehicles.length;
  const dailyDrivers = vehicles.filter(v => v.current_status === 'daily_driver').length;
  const projectCars = vehicles.filter(v => v.current_status === 'project').length;
  const weekendWarriors = vehicles.filter(v => v.current_status === 'weekend_warrior').length;

  // Calculate total value (placeholder - would need actual pricing data)
  const totalValue = vehicles.reduce((sum, vehicle) => {
    const baseMsrp = parseInt(vehicle.base_msrp?.replace(/[^0-9]/g, '') || '0');
    return sum + (baseMsrp || 30000); // Default to $30k if no price data
  }, 0);

  // Calculate average year
  const averageYear = totalVehicles > 0
    ? Math.round(vehicles.reduce((sum, v) => sum + parseInt(v.year), 0) / totalVehicles)
    : 0;

  // Get unique makes
  const uniqueMakes = new Set(vehicles.map(v => v.make)).size;

  const stats = [
    {
      label: 'Total Vehicles',
      value: totalVehicles.toString(),
      icon: '🚗',
      color: 'text-blue-400'
    },
    {
      label: 'Daily Drivers',
      value: dailyDrivers.toString(),
      icon: '🏠',
      color: 'text-green-400'
    },
    {
      label: 'Project Cars',
      value: projectCars.toString(),
      icon: '🔧',
      color: 'text-orange-400'
    },
    {
      label: 'Weekend Warriors',
      value: weekendWarriors.toString(),
      icon: '🏁',
      color: 'text-purple-400'
    },
    {
      label: 'Collection Value',
      value: `$${(totalValue / 1000).toFixed(0)}k`,
      icon: '💰',
      color: 'text-yellow-400'
    },
    {
      label: 'Average Year',
      value: averageYear.toString(),
      icon: '📅',
      color: 'text-cyan-400'
    },
    {
      label: 'Unique Makes',
      value: uniqueMakes.toString(),
      icon: '🏭',
      color: 'text-pink-400'
    }
  ];

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-white mb-4">Garage Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-black/50 backdrop-blur-lg rounded-xl p-4 text-center border border-transparent hover:border-lime-400/30 transition-all duration-300"
          >
            <div className={`text-2xl mb-2 ${stat.color}`}>
              {stat.icon}
            </div>
            <div className="text-white font-bold text-lg">
              {stat.value}
            </div>
            <div className="text-neutral-400 text-sm">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
