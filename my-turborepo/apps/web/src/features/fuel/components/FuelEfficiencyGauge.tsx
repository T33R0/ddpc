'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts'

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

    // Calculate percentage relative to factory MPG
    const percentage = (averageMpg / factoryMpg) * 100

    // Cap visual percentage for the gauge (e.g., max 130% for visual purposes)
    // We want the bar to fill up appropriate to the "health"
    // Let's say Factory (100%) is the target. 
    // If we want a "gauge" style:
    // 0% - empty
    // 100% - full circle? Or 100% = "Good"?
    // Recharts RadialBar is good for "Progress".
    // Let's do a 180 degree gauge.

    // Angle: 180 (Left) -> 0 (Right) ? Or 210 -> -30 ?
    // Let's do a standard semi-circle: startAngle={180} endAngle={0}

    // Data for Recharts
    // We need a background track (always 100% of the gauge) and the value bar.
    // Actually RadialBarChart usually takes one data array.
    // Let's normalize the value. If Factory is 100%, let's say max gauge is 133% (so 75% is roughly 9 o'clock if full circle, but for semicircle 100% is full).
    // Actually for a semi-circle gauge, usually "100% efficiency" might be the goal.
    // Let's mapping: 
    // 0 MPG -> 0 degrees
    // Factory * 1.2 MPG -> 180 degrees (Full)

    const maxDomainMpg = factoryMpg * 1.25 // 125% of factory is the "Max" of the gauge
    const gaugeValue = Math.min(averageMpg, maxDomainMpg)

    // Determine color
    const pctOfFactory = averageMpg / factoryMpg
    let fill = '#9CA3AF' // gray
    if (pctOfFactory >= 1.1) fill = '#3B82F6' // Blue (Excellent)
    else if (pctOfFactory >= 0.95) fill = '#10B981' // Green (Good)
    else if (pctOfFactory >= 0.85) fill = '#F59E0B' // Yellow (Okay)
    else fill = '#EF4444' // Red (Poor)

    const data = [
        {
            name: 'MPG',
            value: gaugeValue,
            fill: fill,
        }
    ]

    const difference = averageMpg - factoryMpg

    return (
        <Card className="bg-card border-border h-full">
            <CardHeader>
                <CardTitle className="text-foreground text-lg">MPG Health</CardTitle>
            </CardHeader>
            <CardContent className="h-[250px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                        cx="50%"
                        cy="70%"
                        innerRadius="80%"
                        outerRadius="100%"
                        barSize={20}
                        data={data}
                        startAngle={180}
                        endAngle={0}
                    >
                        {/* Background Track - simulated by PolarAngleAxis simply or a second RadialBar? 
                Recharts implementation of "Track" often involves a second bar or axis configuration.
                PolarAngleAxis type="number" domain={[0, maxDomainMpg]} will create the scale.
            */}
                        <PolarAngleAxis
                            type="number"
                            domain={[0, maxDomainMpg]}
                            angleAxisId={0}
                            tick={false}
                        />
                        <RadialBar
                            background
                            dataKey="value"
                            cornerRadius={10}
                            label={false}
                        />
                    </RadialBarChart>
                </ResponsiveContainer>

                {/* Center Text Overlay - Positioned absolute to center over the semi-circle */}
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 pointer-events-none">
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wider font-medium">Average</p>
                        <div className="text-5xl font-bold tracking-tighter" style={{ color: fill }}>
                            {averageMpg.toFixed(1)}
                        </div>
                        <p className="text-sm text-muted-foreground font-medium mt-1">MPG</p>

                        {difference !== 0 && (
                            <div className={`flex items-center justify-center mt-4 px-3 py-1 rounded-full bg-muted/50 border border-border backdrop-blur-sm ${difference > 0 ? 'text-blue-500' : 'text-red-500'}`}>
                                <span className="text-sm font-semibold">
                                    {difference > 0 ? '+' : ''}{difference.toFixed(1)} vs Factory
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
