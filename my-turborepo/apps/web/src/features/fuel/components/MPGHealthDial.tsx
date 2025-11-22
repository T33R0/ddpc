'use client'
// ============================================================================
// MPG Health Dial Component - Displays average MPG vs factory rating with visual gauge
// CRITICAL: This file MUST be committed to git for Vercel build to succeed
// File: my-turborepo/apps/web/src/features/fuel/components/MpgHealthDial.tsx
// ============================================================================
//another comment
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'

interface MpgHealthDialProps {
  averageMpg: number | undefined
  factoryMpg: number | undefined
}

export function MpgHealthDial({ averageMpg, factoryMpg }: MpgHealthDialProps) {
  if (!factoryMpg || !averageMpg) {
    return (
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">MPG Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-gray-400">
            <div className="text-center">
              <p className="text-sm">No MPG data available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate the range: -5 below factory to +5 above factory
  const minMpg = factoryMpg - 5
  const maxMpg = factoryMpg + 5
  const range = maxMpg - minMpg // Should be 10

  // Calculate the position of the needle (0-180 degrees for semicircle)
  const normalizedValue = Math.max(minMpg, Math.min(maxMpg, averageMpg))
  const percentage = ((normalizedValue - minMpg) / range) * 100
  const angle = (percentage / 100) * 180 // 0 to 180 degrees

  // Determine color based on position relative to factory MPG
  const difference = averageMpg - factoryMpg
  let needleColor = '#9CA3AF' // gray (neutral)
  if (difference > 2) {
    needleColor = '#10B981' // green (excellent)
  } else if (difference > 0) {
    needleColor = '#3B82F6' // blue (good)
  } else if (difference > -2) {
    needleColor = '#F59E0B' // yellow (fair)
  } else {
    needleColor = '#EF4444' // red (poor)
  }

  // Calculate needle position (centered at bottom, rotating around center)
  const centerX = 150
  const centerY = 150
  const radius = 100
  const needleLength = 80

  // Helper function to calculate point on semicircle arc
  const getArcPoint = (angleDeg: number) => {
    // Convert angle to radians (0° = left, 180° = right)
    // In SVG, 0 is Right, PI is Left. We want to go from Left (PI) to Right (2PI) clockwise.
    const angleRad = Math.PI + (angleDeg * Math.PI) / 180
    // Semicircle center is at (150, 150), radius 100
    const arcCenterX = 150
    const arcCenterY = 150
    const x = arcCenterX + radius * Math.cos(angleRad)
    const y = arcCenterY + radius * Math.sin(angleRad)
    return { x, y }
  }

  // Calculate arc endpoints for each zone
  // Red zone: 0° to 54° (0% to 30% of 180°)
  const redStart = getArcPoint(0)
  const redEnd = getArcPoint(54)
  // Yellow zone: 54° to 90° (30% to 50% of 180°)
  const yellowStart = redEnd
  const yellowEnd = getArcPoint(90)
  // Blue zone: 90° to 126° (50% to 70% of 180°)
  const blueStart = yellowEnd
  const blueEnd = getArcPoint(126)
  // Green zone: 126° to 180° (70% to 100% of 180°)
  const greenStart = blueEnd
  const greenEnd = getArcPoint(180)

  // Convert angle to radians and adjust for SVG coordinate system
  // angle is 0..180. We want PI..2PI.
  const angleRad = Math.PI + (angle * Math.PI) / 180
  const needleEndX = centerX + Math.cos(angleRad) * needleLength
  const needleEndY = centerY + Math.sin(angleRad) * needleLength

  return (
    <Card className="bg-gray-900/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white text-lg">MPG Health</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center">
          {/* Dial SVG */}
          <div className="relative w-full max-w-sm">
            <svg viewBox="0 0 300 200" className="w-full h-auto">
              {/* Background semicircle */}
              <path
                d={`M 50 150 A 100 100 0 0 1 250 150`}
                fill="none"
                stroke="#374151"
                strokeWidth="20"
                strokeLinecap="round"
              />

              {/* Colored segments - properly following the arc */}
              {/* Red zone: -5 to -2 (0° to 54°) */}
              <path
                d={`M ${redStart.x} ${redStart.y} A 100 100 0 0 1 ${redEnd.x} ${redEnd.y}`}
                fill="none"
                stroke="#EF4444"
                strokeWidth="20"
                strokeLinecap="round"
              />
              {/* Yellow zone: -2 to 0 (54° to 90°) */}
              <path
                d={`M ${yellowStart.x} ${yellowStart.y} A 100 100 0 0 1 ${yellowEnd.x} ${yellowEnd.y}`}
                fill="none"
                stroke="#F59E0B"
                strokeWidth="20"
                strokeLinecap="round"
              />
              {/* Blue zone: 0 to +2 (90° to 126°) */}
              <path
                d={`M ${blueStart.x} ${blueStart.y} A 100 100 0 0 1 ${blueEnd.x} ${blueEnd.y}`}
                fill="none"
                stroke="#3B82F6"
                strokeWidth="20"
                strokeLinecap="round"
              />
              {/* Green zone: +2 to +5 (126° to 180°) */}
              <path
                d={`M ${greenStart.x} ${greenStart.y} A 100 100 0 0 1 ${greenEnd.x} ${greenEnd.y}`}
                fill="none"
                stroke="#10B981"
                strokeWidth="20"
                strokeLinecap="round"
              />

              {/* Factory MPG marker (center) */}
              <line
                x1={centerX - 10}
                y1={centerY}
                x2={centerX + 10}
                y2={centerY}
                stroke="#3B82F6"
                strokeWidth="3"
                strokeDasharray="5,5"
              />

              {/* Needle */}
              <line
                x1={centerX}
                y1={centerY}
                x2={needleEndX}
                y2={needleEndY}
                stroke={needleColor}
                strokeWidth="4"
                strokeLinecap="round"
              />

              {/* Needle center point */}
              <circle cx={centerX} cy={centerY} r="6" fill={needleColor} />
            </svg>

            {/* Labels */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4 pb-2">
              <div className="text-left">
                <p className="text-xs text-gray-400">{minMpg.toFixed(0)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-blue-400 font-semibold">Factory: {factoryMpg.toFixed(0)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">{maxMpg.toFixed(0)}</p>
              </div>
            </div>
          </div>

          {/* Current MPG Display */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400 mb-1">Your Average MPG</p>
            <p className="text-3xl font-bold" style={{ color: needleColor }}>
              {averageMpg.toFixed(1)}
            </p>
            {difference !== 0 && (
              <p className={`text-sm mt-2 ${difference > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {difference > 0 ? '+' : ''}{difference.toFixed(1)} MPG vs Factory
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

