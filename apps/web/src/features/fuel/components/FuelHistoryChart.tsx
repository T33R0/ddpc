'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { FuelEntry } from '../lib/getVehicleFuelData'
import { TrendingUp } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { HistoryDetailSheet } from '../../timeline/components/HistoryDetailSheet'
import { VehicleEvent } from '../../timeline/lib/getVehicleEvents'
import { useState } from 'react'

interface FuelHistoryChartProps {
  fuelEntries: FuelEntry[]
  factoryMpg?: number
}

export function FuelHistoryChart({ fuelEntries, factoryMpg }: FuelHistoryChartProps) {
  const [dateRange, setDateRange] = useState('30d')
  const [selectedEvent, setSelectedEvent] = useState<VehicleEvent | null>(null)

  // Filter entries based on date range
  const filteredEntries = React.useMemo(() => {
    const now = new Date()
    const cutoff = new Date()
    
    switch (dateRange) {
      case '30d':
        cutoff.setDate(now.getDate() - 30)
        break
      case '6m':
        cutoff.setMonth(now.getMonth() - 6)
        break
      case '12m':
        cutoff.setMonth(now.getMonth() - 12)
        break
      case 'all':
      default:
        return fuelEntries
    }

    return fuelEntries.filter(entry => entry.date >= cutoff)
  }, [fuelEntries, dateRange])

  // Prepare data for the chart
  const chartData = filteredEntries
    .filter(entry => entry.mpg) // Only entries with calculated MPG
    .map(entry => {
      const month = String(entry.date.getMonth() + 1).padStart(2, '0')
      const day = String(entry.date.getDate()).padStart(2, '0')
      // For all time or year view, maybe show year? 
      // Keeping it simple for now, standard MM/DD is usually distinct enough unless spanning years heavily.
      // If spanning years, MM/DD/YY might be better. 
      // Let's stick to MM/DD for compactness unless user complaints.
      return {
        ...entry, // Keep original entry data for click handler
        dateFormatted: `${month}/${day}`, // MM/DD format
        fullDate: entry.date.toISOString(),
      }
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime()) // Ensure chronological order

  // Handle graph point click
  const handlePointClick = (data: any) => {
    if (!data) return

    // Convert to VehicleEvent
    const event: VehicleEvent = {
        id: `fuel-${data.id}`,
        date: data.date,
        title: `Fuel Up: ${data.gallons.toFixed(2)} gal`,
        description: data.mpg ? `${data.mpg.toFixed(1)} MPG` : 'Fuel log',
        type: 'fuel',
        cost: data.cost,
        odometer: data.odometer,
    }
    setSelectedEvent(event)
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { payload: typeof chartData[0]; value: number | null }[]; label?: string }) => {
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
          <p className="text-xs text-muted-foreground mt-2 italic">Click point for details</p>
        </div>
      )
    }
    return null
  }

  if (fuelEntries.length === 0) {
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
    <>
      <Card
        className="bg-card rounded-2xl text-foreground border border-border"
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-foreground text-lg">Fuel Efficiency Over Time</CardTitle>
          <div className="w-[140px]">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="6m">Last 6mos</SelectItem>
                <SelectItem value="12m">Last 12mos</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full mt-4">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={chartData}
                  onClick={(e: any) => {
                    if (e && e.activePayload && e.activePayload.length > 0) {
                      handlePointClick(e.activePayload[0].payload)
                    }
                  }}
                  className="cursor-pointer"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="dateFormatted"
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
                    dot={{ 
                      fill: 'hsl(var(--chart-1))', 
                      strokeWidth: 2, 
                      r: 4, 
                      cursor: 'pointer',
                      onClick: (_: any, payload: any) => {
                         // Recharts dot onClick payload is slightly different, usually payload.payload
                         if (payload && payload.payload) handlePointClick(payload.payload)
                      }
                    }}
                    activeDot={{ 
                      r: 6, 
                      stroke: 'hsl(var(--chart-1))', 
                      strokeWidth: 2, 
                      fill: 'hsl(var(--success))', 
                      cursor: 'pointer',
                      onClick: (_: any, payload: any) => {
                         if (payload && payload.payload) handlePointClick(payload.payload)
                      }
                    }}
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
            ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    No data for this time period
                </div>
            )}
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

      <HistoryDetailSheet
        event={selectedEvent}
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </>
  )
}
