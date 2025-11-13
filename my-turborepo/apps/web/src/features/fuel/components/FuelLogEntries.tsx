'use client'
// ============================================================================
// Fuel Log Entries Component - Displays list of fuel log entries
// CRITICAL: This file MUST be committed to git for Vercel build to succeed
// File: my-turborepo/apps/web/src/features/fuel/components/FuelLogEntries.tsx
// ============================================================================

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { FuelEntry } from '../lib/getVehicleFuelData'

interface FuelLogEntriesProps {
  fuelEntries: FuelEntry[]
}

export function FuelLogEntries({ fuelEntries }: FuelLogEntriesProps) {
  if (fuelEntries.length === 0) {
    return (
      <Card 
        className="bg-black/50 backdrop-blur-lg rounded-2xl text-white"
        style={{
          border: '1px solid rgba(255, 255, 255, 0.3)',
        }}
      >
        <CardHeader>
          <CardTitle className="text-white text-lg">Fuel Log Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">No fuel entries yet. Log your first fill-up to get started.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Sort entries by date (newest first)
  const sortedEntries = [...fuelEntries].sort((a, b) => b.date.getTime() - a.date.getTime())

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  return (
    <Card 
      className="bg-black/50 backdrop-blur-lg rounded-2xl text-white"
      style={{
        border: '1px solid rgba(255, 255, 255, 0.3)',
      }}
    >
      <CardHeader>
        <CardTitle className="text-white text-lg">Fuel Log Entries</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedEntries.map((entry) => (
            <div
              key={entry.id}
              className="bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg p-4 hover:border-white/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-sm font-medium text-white">
                      {entry.date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                    {entry.mpg && (
                      <div className="px-2 py-1 bg-green-500/20 rounded text-xs text-green-400 font-medium">
                        {entry.mpg.toFixed(1)} MPG
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-gray-400">Gallons</p>
                      <p className="text-white font-medium">{entry.gallons.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Odometer</p>
                      <p className="text-white font-medium">{entry.odometer.toLocaleString()} mi</p>
                    </div>
                    {entry.cost && (
                      <div>
                        <p className="text-gray-400">Cost</p>
                        <p className="text-white font-medium">{formatCurrency(entry.cost)}</p>
                      </div>
                    )}
                    {entry.mpg && (
                      <div>
                        <p className="text-gray-400">Price/Gal</p>
                        <p className="text-white font-medium">
                          {entry.cost ? formatCurrency(entry.cost / entry.gallons) : 'N/A'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

