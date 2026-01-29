import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { FuelStats } from '../lib/getVehicleFuelData'

interface FuelStatsCardProps {
  stats: FuelStats
}

export function FuelStatsCard({ stats }: FuelStatsCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  const formatNumber = (value: number, decimals: number = 1) => {
    return value.toFixed(decimals)
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground text-lg">Fuel Efficiency Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Factory MPG */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Factory EPA MPG</p>
            <p className="text-2xl font-bold text-blue-500">
              {stats.factoryMpg ? formatNumber(stats.factoryMpg, 0) : 'N/A'}
            </p>
          </div>

          {/* Average MPG */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Your Average MPG</p>
            <p className="text-2xl font-bold text-green-500">
              {stats.averageMpg ? formatNumber(stats.averageMpg) : 'N/A'}
            </p>
          </div>
        </div>

        {/* MPG Comparison */}
        {stats.mpgDifference !== undefined && (
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">vs Factory Rating</p>
            <p className={`text-lg font-semibold ${
              stats.mpgDifference > 0
                ? 'text-green-500'
                : stats.mpgDifference < 0
                ? 'text-red-500'
                : 'text-muted-foreground'
            }`}>
              {stats.mpgDifference > 0 ? '+' : ''}{formatNumber(stats.mpgDifference)} MPG
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 pt-2">
          {/* Total Cost */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Total Fuel Cost</p>
            <p className="text-xl font-bold text-foreground">
              {formatCurrency(stats.totalCost)}
            </p>
          </div>

          {/* Cost per Mile */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Cost per Mile</p>
            <p className="text-xl font-bold text-orange-500">
              {stats.fuelCostPerMile ? formatCurrency(stats.fuelCostPerMile) : 'N/A'}
            </p>
          </div>
        </div>

        {/* Total Gallons */}
        <div className="text-center pt-2 border-t border-border">
          <p className="text-sm text-muted-foreground">Total Gallons</p>
          <p className="text-lg font-semibold text-foreground">
            {formatNumber(stats.totalGallons, 1)} gal
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
