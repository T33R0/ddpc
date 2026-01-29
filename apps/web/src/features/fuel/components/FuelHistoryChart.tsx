'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { FuelEntry } from '../lib/getVehicleFuelData'
import { TrendingUp } from 'lucide-react'

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
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { payload: FuelEntry; value: number | null }[]; label?: string }) => {
    if (active && payload && payload.length > 0 && payload[0]) {
      const data = payload[0].payload
      const mpgValue = payload[0].value
      if (!data || mpgValue == null) return null

      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="text-popover-foreground font-semibold">{label ? `Date: ${label}` : 'Date: N/A'}</p>
          <p className="text-success">{`MPG: ${typeof mpgValue === 'number' ? mpgValue.toFixed(1) : 'N/A'}`}</p>
          <p className="text-muted-foreground text-sm">{`Gallons: ${typeof data.gallons === 'number' ? data.gallons.toFixed(1) : 'N/A'}`}</p>
          <p className="text-muted-foreground text-sm">{`Odometer: ${typeof data.odometer === 'number' ? data.odometer.toLocaleString() : 'N/A'} mi`}</p>
          {data.cost && typeof data.cost === 'number' && (
            <p className="text-muted-foreground text-sm">{`Cost: $${data.cost.toFixed(2)}`}</p>
          )}
        </div>
      )
    }
    return null
  }

  if (chartData.length === 0) {
    return (
      <Card
        className="bg-card rounded-2xl text-foreground border border-border"
      >
        <CardHeader>
          <CardTitle className="text-foreground text-lg">Fuel Efficiency Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50 text-muted-foreground" />
              <p className="text-sm">No fuel data available</p>
              <p className="text-xs mt-1">Add fuel entries to see your efficiency trend</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className="bg-card rounded-2xl text-foreground border border-border"
    >
      <CardHeader>
        <CardTitle className="text-foreground text-lg">Fuel Efficiency Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                domain={['dataMin - 2', 'dataMax + 2']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="mpg"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--chart-1))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: 'hsl(var(--chart-1))', strokeWidth: 2, fill: 'hsl(var(--success))' }}
              />
              {/* Factory MPG reference line */}
              {factoryMpg && (
                <Line
                  type="monotone"
                  dataKey={() => factoryMpg}
                  stroke="hsl(var(--chart-2))"
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
          <div className="flex items-center justify-center mt-2 text-xs text-muted-foreground">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-0.5 bg-chart-1"></div>
              <span>Your MPG</span>
              <div className="w-3 h-0.5 bg-chart-2 border-dashed border-t"></div>
              <span>Factory EPA ({factoryMpg} MPG)</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
