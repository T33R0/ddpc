'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'

interface MPGHealthDialProps {
  averageMpg: number | undefined
  factoryMpg: number | undefined
}

export function MPGHealthDial({ averageMpg, factoryMpg }: MPGHealthDialProps) {
  if (!averageMpg || !factoryMpg) {
    return (
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">MPG Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-gray-400">
            <p className="text-sm">No data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate the range: factory - 5 to factory + 5
  const minMpg = factoryMpg - 5
  const maxMpg = factoryMpg + 5
  const range = maxMpg - minMpg // Should be 10

  // Calculate the position of the needle (0-180 degrees for semicircle)
  // Clamp averageMpg to the range
  const clampedMpg = Math.max(minMpg, Math.min(maxMpg, averageMpg))
  const percentage = ((clampedMpg - minMpg) / range) * 100
  const angle = (percentage / 100) * 180 - 90 // -90 to 90 degrees (centered at top)

  // Determine color based on position
  const getColor = () => {
    if (averageMpg >= factoryMpg) return '#10B981' // Green (above factory)
    if (averageMpg >= factoryMpg - 2) return '#F59E0B' // Yellow (close to factory)
    return '#EF4444' // Red (below factory)
  }

  const color = getColor()

  // Calculate arc positions for colored segments
  const redEndAngle = ((factoryMpg - 2 - minMpg) / range) * 180
  const yellowEndAngle = ((factoryMpg - minMpg) / range) * 180

  return (
    <Card className="bg-gray-900/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white text-lg">MPG Health</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center h-48">
          {/* Dial SVG */}
          <div className="relative w-48 h-48">
            <svg viewBox="0 0 200 120" className="w-full h-full">
              {/* Background semicircle */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#374151"
                strokeWidth="12"
                strokeLinecap="round"
              />
              
              {/* Red zone: minMpg to factoryMpg - 2 (0 to redEndAngle) */}
              <path
                d={`M 20 100 A 80 80 0 ${redEndAngle > 90 ? 1 : 0} 1 ${20 + 80 * (1 - Math.cos((redEndAngle * Math.PI) / 180))} ${100 - 80 * Math.sin((redEndAngle * Math.PI) / 180)}`}
                fill="none"
                stroke="#EF4444"
                strokeWidth="12"
                strokeLinecap="round"
              />
              
              {/* Yellow zone: factoryMpg - 2 to factoryMpg */}
              <path
                d={`M ${20 + 80 * (1 - Math.cos((redEndAngle * Math.PI) / 180))} ${100 - 80 * Math.sin((redEndAngle * Math.PI) / 180)} A 80 80 0 ${yellowEndAngle > 90 ? 1 : 0} 1 ${20 + 80 * (1 - Math.cos((yellowEndAngle * Math.PI) / 180))} ${100 - 80 * Math.sin((yellowEndAngle * Math.PI) / 180)}`}
                fill="none"
                stroke="#F59E0B"
                strokeWidth="12"
                strokeLinecap="round"
              />
              
              {/* Green zone: factoryMpg to maxMpg */}
              <path
                d={`M ${20 + 80 * (1 - Math.cos((yellowEndAngle * Math.PI) / 180))} ${100 - 80 * Math.sin((yellowEndAngle * Math.PI) / 180)} A 80 80 0 0 1 180 100`}
                fill="none"
                stroke="#10B981"
                strokeWidth="12"
                strokeLinecap="round"
              />

              {/* Needle */}
              <g transform={`rotate(${angle} 100 100)`}>
                <line
                  x1="100"
                  y1="100"
                  x2="100"
                  y2="30"
                  stroke={color}
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="6"
                  fill={color}
                />
              </g>

              {/* Center value */}
              <text
                x="100"
                y="95"
                textAnchor="middle"
                fill="white"
                fontSize="20"
                fontWeight="bold"
              >
                {averageMpg.toFixed(1)}
              </text>
              <text
                x="100"
                y="110"
                textAnchor="middle"
                fill="#9CA3AF"
                fontSize="12"
              >
                MPG
              </text>
            </svg>
          </div>

          {/* Range labels */}
          <div className="flex justify-between w-48 mt-2 text-xs text-gray-400">
            <span>{minMpg.toFixed(0)}</span>
            <span className="text-blue-400">Factory: {factoryMpg.toFixed(0)}</span>
            <span>{maxMpg.toFixed(0)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

