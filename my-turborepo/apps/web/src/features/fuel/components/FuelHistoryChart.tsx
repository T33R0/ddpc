'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { FuelEntry } from '../lib/getVehicleFuelData'

interface FuelHistoryChartProps {
  fuelEntries: FuelEntry[]
  factoryMpg?: number
}

export function FuelHistoryChart({ fuelEntries, factoryMpg }: FuelHistoryChartProps) {
  // Prepare data for the chart
  const chartData = fuelEntries
    .filter(entry => entry.mpg) // Only entries with calculated MPG
    .map(entry => {
      const month = String(entry.date.getMonth() + 1).padStart(2, '0')
      const day = String(entry.date.getDate()).padStart(2, '0')
      return {
        date: `${month}/${day}`, // MM/DD format
        mpg: entry.mpg,
        fullDate: entry.date.toISOString(),
        gallons: entry.gallons,
        cost: entry.cost,
        odometer: entry.odometer,
      }
    })

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold">{`Date: ${label}`}</p>
          <p className="text-green-400">{`MPG: ${payload[0].value?.toFixed(1)}`}</p>
          <p className="text-gray-400 text-sm">{`Gallons: ${data.gallons?.toFixed(1)}`}</p>
          <p className="text-gray-400 text-sm">{`Odometer: ${data.odometer?.toLocaleString()} mi`}</p>
          {data.cost && (
            <p className="text-gray-400 text-sm">{`Cost: $${data.cost?.toFixed(2)}`}</p>
          )}
        </div>
      )
    }
    return null
  }

  if (chartData.length === 0) {
    return (
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">Fuel Efficiency Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-gray-400">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-sm">No fuel data available</p>
              <p className="text-xs mt-1">Add fuel entries to see your efficiency trend</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-900/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white text-lg">Fuel Efficiency Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="date"
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                domain={['dataMin - 2', 'dataMax + 2']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="mpg"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2, fill: '#065F46' }}
              />
              {/* Factory MPG reference line */}
              {factoryMpg && (
                <Line
                  type="monotone"
                  dataKey={() => factoryMpg}
                  stroke="#3B82F6"
                  strokeDasharray="5 5"
                  strokeWidth={1}
                  dot={false}
                  connectNulls={false}
                  name="Factory MPG"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        {factoryMpg && (
          <div className="flex items-center justify-center mt-2 text-xs text-gray-400">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-0.5 bg-green-400"></div>
              <span>Your MPG</span>
              <div className="w-3 h-0.5 bg-blue-400 border-dashed border-t"></div>
              <span>Factory EPA ({factoryMpg} MPG)</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
