'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { FuelEntry } from '../lib/getVehicleFuelData'

interface FuelLogEntriesProps {
  fuelEntries: FuelEntry[]
}

export function FuelLogEntries({ fuelEntries }: FuelLogEntriesProps) {
  // Sort entries by date descending (most recent first)
  const sortedEntries = [...fuelEntries].sort((a, b) => 
    b.date.getTime() - a.date.getTime()
  )

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  if (sortedEntries.length === 0) {
    return (
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">Fuel Log Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">No fuel entries yet</p>
            <p className="text-xs mt-1">Add your first fuel log to get started</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-900/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white text-lg">Fuel Log Entries</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedEntries.map((entry) => (
            <div
              key={entry.id}
              className="p-4 border rounded-md bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="text-white font-medium">
                      {entry.date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    {entry.mpg && (
                      <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400 border border-green-500/30">
                        {entry.mpg.toFixed(1)} MPG
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                    {entry.cost && entry.gallons && (
                      <div>
                        <p className="text-gray-400">Price/Gallon</p>
                        <p className="text-white font-medium">
                          {formatCurrency(entry.cost / entry.gallons)}
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

