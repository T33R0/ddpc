'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

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

    // Determine color
    const pctOfFactory = averageMpg / factoryMpg
    let fill = '#9CA3AF' // gray
    if (pctOfFactory >= 1.1) fill = '#3B82F6' // Blue (Excellent)
    else if (pctOfFactory >= 0.95) fill = '#10B981' // Green (Good)
    else if (pctOfFactory >= 0.85) fill = '#F59E0B' // Yellow (Okay)
    else fill = '#EF4444' // Red (Poor)

    // Gauge Logic
    // We want a semi-circle (180 degrees)
    // Range: 0 to Max (125% of factory)
    const maxDomainMpg = factoryMpg * 1.25
    const gaugeValue = Math.min(averageMpg, maxDomainMpg)
    const remainder = maxDomainMpg - gaugeValue

    const data = [
        { name: 'Value', value: gaugeValue, color: fill },
        { name: 'Remainder', value: remainder, color: 'hsl(var(--muted))' }, // Track color
    ]

    const difference = averageMpg - factoryMpg

    return (
        <Card className="bg-card border-border h-full">
            <CardHeader>
                <CardTitle className="text-foreground text-lg">MPG Health</CardTitle>
            </CardHeader>
            <CardContent className="h-[250px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="70%"
                            startAngle={180}
                            endAngle={0}
                            innerRadius="80%"
                            outerRadius="100%"
                            paddingAngle={0}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>

                {/* Center Text Overlay */}
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
