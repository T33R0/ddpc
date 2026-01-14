'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'

interface FuelEfficiencyGaugeProps {
    averageMpg: number | undefined
    factoryMpg: number | undefined
}

export function FuelEfficiencyGauge({ averageMpg, factoryMpg }: FuelEfficiencyGaugeProps) {
    if (!factoryMpg || !averageMpg) {
        return (
            <Card className="bg-card border-border">
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

    // Configuration
    const strokeWidth = 20
    const radius = 80
    const centerX = 100
    const centerY = 100 // Bottom of the semi-circle

    // Calculations
    const maxDomainMpg = factoryMpg * 1.25 // Gauge max is 125% of factory
    const gaugeValue = Math.min(averageMpg, maxDomainMpg)
    const percentage = Math.max(0, gaugeValue / maxDomainMpg) // 0 to 1

    // Arc Math
    // Semi-circle perimeter = PI * r
    const arcLength = Math.PI * radius
    const dashArray = arcLength
    const dashOffset = arcLength * (1 - percentage) // Offset hides the part we don't want to show (from right to left)

    // Colors
    const pctOfFactory = averageMpg / factoryMpg
    let strokeColor = '#9CA3AF' // gray
    if (pctOfFactory >= 1.1) strokeColor = '#3B82F6' // Blue (Excellent)
    else if (pctOfFactory >= 0.95) strokeColor = '#10B981' // Green (Good)
    else if (pctOfFactory >= 0.85) strokeColor = '#F59E0B' // Yellow (Okay)
    else strokeColor = '#EF4444' // Red (Poor)

    // SVG Path: Move to left point, Arc to right point
    // Left point: (centerX - radius, centerY)
    // Right point: (centerX + radius, centerY)
    const trackPath = `M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`

    const difference = averageMpg - factoryMpg

    return (
        <Card className="bg-card border-border h-full">
            <CardHeader>
                <CardTitle className="text-foreground text-lg">MPG Health</CardTitle>
            </CardHeader>
            <CardContent className="h-[250px] relative flex flex-col items-center justify-center">
                {/* SVG Gauge */}
                <div className="w-full max-w-[300px] aspect-[2/1] relative">
                    <svg
                        viewBox="0 0 200 110"
                        className="w-full h-full overflow-visible"
                    >
                        {/* Background Track */}
                        <path
                            d={trackPath}
                            fill="none"
                            stroke="hsl(var(--muted))"
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                        />
                        {/* Value Bar */}
                        <path
                            d={trackPath}
                            fill="none"
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                            strokeDasharray={dashArray}
                            strokeDashoffset={dashOffset}
                            style={{ transition: 'stroke-dashoffset 1s ease-out, stroke 0.5s ease' }}
                        />
                    </svg>

                    {/* Overlay Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-end -bottom-4">
                        <div className="text-center">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Average</p>
                            <div className="text-5xl font-bold tracking-tighter transition-colors duration-500" style={{ color: strokeColor }}>
                                {averageMpg.toFixed(1)}
                            </div>
                            <p className="text-xs text-muted-foreground font-medium mt-1">MPG</p>
                        </div>
                    </div>
                </div>

                {/* Badge */}
                {difference !== 0 && (
                    <div className={`mt-6 px-3 py-1 rounded-full bg-muted/50 border border-border backdrop-blur-sm ${difference > 0 ? 'text-blue-500' : 'text-red-500'}`}>
                        <span className="text-sm font-semibold">
                            {difference > 0 ? '+' : ''}{difference.toFixed(1)} vs Factory
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
