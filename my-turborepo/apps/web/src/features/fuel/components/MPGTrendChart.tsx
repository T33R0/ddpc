'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { FuelEntry } from '../lib/getVehicleFuelData'

interface MPGTrendChartProps {
  fuelEntries: FuelEntry[]
}

export function MPGTrendChart({ fuelEntries }: MPGTrendChartProps) {
  // Prepare data for the chart - only entries with calculated MPG
  const chartData = fuelEntries
    .filter(entry => entry.mpg && entry.mpg > 0)
    .map(entry => ({
      date: entry.date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      mpg: entry.mpg,
      fullDate: entry.date.toISOString(),
    }))

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold">{`MPG: ${payload[0].value?.toFixed(1)}`}</p>
        </div>
      )
    }
    return null
  }

  if (chartData.length === 0) {
    return (
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">MPG Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-gray-400">
            <p className="text-sm">No MPG data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-900/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white text-lg">MPG Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48 w-full">
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
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

