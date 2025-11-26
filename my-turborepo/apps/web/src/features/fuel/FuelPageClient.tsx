
'use client'
// ============================================================================
// Fuel Page Client Component - Main client component for fuel tracking page
// File: my-turborepo/apps/web/src/features/fuel/FuelPageClient.tsx
// ============================================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@repo/ui/button'
import { Fuel } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import {
  AddFuelDialog,
  FuelHistoryChart,
  FuelLogEntries
} from './components'
import { VehicleFuelData } from './lib/getVehicleFuelData'

interface FuelPageClientProps {
  fuelData: VehicleFuelData
}

// MPG Health Dial Component - Inlined to avoid import issues
function MpgHealthDial({ averageMpg, factoryMpg }: { averageMpg: number | undefined; factoryMpg: number | undefined }) {
  if (!factoryMpg || !averageMpg) {
    return (
      <Card
        className="bg-card backdrop-blur-lg rounded-2xl text-foreground border border-border"
      >
        <CardHeader>
          <CardTitle className="text-foreground text-lg">MPG Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">No MPG data available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate the range: 75% to 110% of factory MPG
  const minMpg = factoryMpg * 0.75
  const maxMpg = factoryMpg * 1.10
  const range = maxMpg - minMpg

  // Helper to calculate angle (0-180) for a given MPG value
  const getAngleForMpg = (mpg: number) => {
    const clampedMpg = Math.max(minMpg, Math.min(maxMpg, mpg))
    const percentage = (clampedMpg - minMpg) / range
    return percentage * 180
  }

  // Calculate the position of the needle
  const angle = getAngleForMpg(averageMpg)

  // Determine color based on position relative to factory MPG
  const pctOfFactory = averageMpg / factoryMpg
  let needleColor = '#9CA3AF' // gray fallback
  if (pctOfFactory >= 1.0) {
    needleColor = '#3B82F6' // Blue
  } else if (pctOfFactory >= 0.9) {
    needleColor = '#10B981' // Green
  } else if (pctOfFactory >= 0.8) {
    needleColor = '#F59E0B' // Yellow
  } else {
    needleColor = '#EF4444' // Red
  }

  const difference = averageMpg - factoryMpg

  // Dimensions
  const centerX = 150
  const centerY = 150
  const radius = 100
  const strokeWidth = 12 // Thinner for less cartoony look
  const needleLength = 85
  const labelRadius = 125 // Radius for text labels

  // Helper function to calculate point on semicircle arc
  const getArcPoint = (angleDeg: number, r: number = radius) => {
    // Convert angle to radians (0° = left, 180° = right)
    // In SVG, 0 is Right, PI is Left. We want to go from Left (PI) to Right (2PI) clockwise.
    const angleRad = Math.PI + (angleDeg * Math.PI) / 180
    const x = centerX + r * Math.cos(angleRad)
    const y = centerY + r * Math.sin(angleRad)
    return { x, y }
  }

  // Calculate arc endpoints for each zone
  const redStartAngle = getAngleForMpg(factoryMpg * 0.75)
  const redEndAngle = getAngleForMpg(factoryMpg * 0.80)
  const redStart = getArcPoint(redStartAngle)
  const redEnd = getArcPoint(redEndAngle)

  // const yellowStartAngle = redEndAngle
  const yellowEndAngle = getAngleForMpg(factoryMpg * 0.90)
  const yellowStart = redEnd
  const yellowEnd = getArcPoint(yellowEndAngle)

  // const greenStartAngle = yellowEndAngle
  const greenEndAngle = getAngleForMpg(factoryMpg * 1.00)
  const greenStart = yellowEnd
  const greenEnd = getArcPoint(greenEndAngle)

  // const blueStartAngle = greenEndAngle
  const blueEndAngle = getAngleForMpg(factoryMpg * 1.10)
  const blueStart = greenEnd
  const blueEnd = getArcPoint(blueEndAngle)

  // Hash marks positions
  const hash80 = getArcPoint(getAngleForMpg(factoryMpg * 0.80))
  const hash90 = getArcPoint(getAngleForMpg(factoryMpg * 0.90))
  const hash100 = getArcPoint(getAngleForMpg(factoryMpg * 1.00))

  // Label positions
  const label75 = getArcPoint(getAngleForMpg(factoryMpg * 0.75), labelRadius)
  const label80 = getArcPoint(getAngleForMpg(factoryMpg * 0.80), labelRadius)
  const label90 = getArcPoint(getAngleForMpg(factoryMpg * 0.90), labelRadius)
  const label100 = getArcPoint(getAngleForMpg(factoryMpg * 1.00), labelRadius)
  const label110 = getArcPoint(getAngleForMpg(factoryMpg * 1.10), labelRadius)

  // Needle endpoint
  const angleRad = Math.PI + (angle * Math.PI) / 180
  const needleEndX = centerX + Math.cos(angleRad) * needleLength
  const needleEndY = centerY + Math.sin(angleRad) * needleLength

  // Helper for hash lines
  const getHashLine = (point: { x: number, y: number }, angleDeg: number) => {
    const angleRad = Math.PI + (angleDeg * Math.PI) / 180
    const innerX = centerX + (radius - strokeWidth / 2) * Math.cos(angleRad)
    const innerY = centerY + (radius - strokeWidth / 2) * Math.sin(angleRad)
    // Extend slightly outward
    const outerX = centerX + (radius + strokeWidth / 2 + 2) * Math.cos(angleRad)
    const outerY = centerY + (radius + strokeWidth / 2 + 2) * Math.sin(angleRad)
    return { x1: innerX, y1: innerY, x2: outerX, y2: outerY }
  }

  const hash80Line = getHashLine(hash80, getAngleForMpg(factoryMpg * 0.80))
  const hash90Line = getHashLine(hash90, getAngleForMpg(factoryMpg * 0.90))
  const hash100Line = getHashLine(hash100, getAngleForMpg(factoryMpg * 1.00))

  return (
    <Card
      className="bg-card rounded-2xl text-foreground border border-border"
    >
      <CardHeader>
        <CardTitle className="text-foreground text-lg">MPG Health</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center">
          <div className="relative w-full max-w-sm">
            <svg viewBox="0 0 300 180" className="w-full h-auto">
              {/* Background Arc */}
              <path
                d={`M 50 150 A 100 100 0 0 1 250 150`}
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                opacity="0.2"
              />

              {/* Colored segments */}
              <path
                d={`M ${redStart.x} ${redStart.y} A 100 100 0 0 1 ${redEnd.x} ${redEnd.y}`}
                fill="none"
                stroke="#EF4444"
                strokeWidth={strokeWidth}
                strokeLinecap="butt"
              />
              <path
                d={`M ${yellowStart.x} ${yellowStart.y} A 100 100 0 0 1 ${yellowEnd.x} ${yellowEnd.y}`}
                fill="none"
                stroke="#F59E0B"
                strokeWidth={strokeWidth}
                strokeLinecap="butt"
              />
              <path
                d={`M ${greenStart.x} ${greenStart.y} A 100 100 0 0 1 ${greenEnd.x} ${greenEnd.y}`}
                fill="none"
                stroke="#10B981"
                strokeWidth={strokeWidth}
                strokeLinecap="butt"
              />
              <path
                d={`M ${blueStart.x} ${blueStart.y} A 100 100 0 0 1 ${blueEnd.x} ${blueEnd.y}`}
                fill="none"
                stroke="#3B82F6"
                strokeWidth={strokeWidth}
                strokeLinecap="butt"
              />

              {/* Hash marks */}
              <line x1={hash80Line.x1} y1={hash80Line.y1} x2={hash80Line.x2} y2={hash80Line.y2} stroke="currentColor" className="text-background" strokeWidth="2" />
              <line x1={hash90Line.x1} y1={hash90Line.y1} x2={hash90Line.x2} y2={hash90Line.y2} stroke="currentColor" className="text-background" strokeWidth="2" />
              <line x1={hash100Line.x1} y1={hash100Line.y1} x2={hash100Line.x2} y2={hash100Line.y2} stroke="currentColor" className="text-background" strokeWidth="2" />

              {/* Labels */}
              <text x={label75.x} y={label75.y} textAnchor="start" dominantBaseline="middle" className="text-[10px] fill-muted-foreground font-medium">75%</text>
              <text x={label80.x} y={label80.y} textAnchor="middle" dominantBaseline="bottom" className="text-[10px] fill-muted-foreground font-medium" transform={`rotate(-54, ${label80.x}, ${label80.y}) translate(0, -5)`}>80%</text>
              <text x={label90.x} y={label90.y} textAnchor="middle" dominantBaseline="bottom" className="text-[10px] fill-muted-foreground font-medium" transform={`rotate(-18, ${label90.x}, ${label90.y}) translate(0, -5)`}>90%</text>
              <text x={label100.x} y={label100.y} textAnchor="middle" dominantBaseline="bottom" className="text-[10px] fill-blue-500 font-bold" transform={`rotate(18, ${label100.x}, ${label100.y}) translate(0, -5)`}>Factory</text>
              <text x={label110.x} y={label110.y} textAnchor="end" dominantBaseline="middle" className="text-[10px] fill-muted-foreground font-medium">110%</text>

              {/* Needle */}
              <line
                x1={centerX}
                y1={centerY}
                x2={needleEndX}
                y2={needleEndY}
                stroke={needleColor}
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx={centerX} cy={centerY} r="4" fill={needleColor} />
            </svg>
          </div>

          {/* Current MPG Display */}
          <div className="mt-2 text-center">
            <p className="text-sm text-muted-foreground mb-1">Your Average MPG</p>
            <p className="text-3xl font-bold" style={{ color: needleColor }}>
              {averageMpg.toFixed(1)}
            </p>
            {difference !== 0 && (
              <p className={`text-sm mt-2 ${difference > 0 ? 'text-blue-500' : 'text-red-500'}`}>
                {difference > 0 ? '+' : ''}{difference.toFixed(1)} MPG vs Factory
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function FuelPageClient({ fuelData }: FuelPageClientProps) {
  const router = useRouter()
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false)

  return (
    <>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Vehicle Fuel</h1>
          <p className="text-lg text-muted-foreground mt-2">Fuel economy and consumption tracking</p>
        </div>
        <Button
          onClick={() => setIsFuelModalOpen(true)}
          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
        >
          <Fuel className="mr-2 h-4 w-4" /> Log Fuel
        </Button>
      </div>

      {/* Chart and Dial Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <FuelHistoryChart
          fuelEntries={fuelData.fuelEntries}
          factoryMpg={fuelData.vehicle.factoryMpg}
        />
        <MpgHealthDial
          averageMpg={fuelData.stats.averageMpg}
          factoryMpg={fuelData.vehicle.factoryMpg}
        />
      </div>

      {/* Fuel Log Entries */}
      <FuelLogEntries fuelEntries={fuelData.fuelEntries} />

      <AddFuelDialog
        isOpen={isFuelModalOpen}
        onClose={() => {
          setIsFuelModalOpen(false)
          router.refresh()
        }}
        vehicleId={fuelData.vehicle.id}
        currentOdometer={fuelData.vehicle.odometer ?? null}
      />
    </>
  )
}
