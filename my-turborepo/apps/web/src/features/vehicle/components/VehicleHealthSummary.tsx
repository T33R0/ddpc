'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { Activity, AlertTriangle, Layers } from 'lucide-react'

interface VehicleHealthSummaryProps {
    averageMpg: number | null | undefined
    factoryMpg: number | undefined
    inventoryStats?: {
        totalParts: number
        healthScore: number | null
        partsNeedingAttention: number
    }
}

export function VehicleHealthSummary({ averageMpg, factoryMpg, inventoryStats }: VehicleHealthSummaryProps) {
    // MPG Calculations
    const mpgDiff = (averageMpg && factoryMpg) ? averageMpg - factoryMpg : null
    const diffColor = mpgDiff && mpgDiff > 0 ? 'text-green-500' : 'text-red-500'

    // Health Calculations
    const healthScore = inventoryStats?.healthScore ?? null
    let healthColor = 'bg-green-500'
    let healthTextColor = 'text-green-500'
    if (healthScore !== null) {
        if (healthScore < 50) {
            healthColor = 'bg-red-500'
            healthTextColor = 'text-red-500'
        } else if (healthScore < 80) {
            healthColor = 'bg-yellow-500'
            healthTextColor = 'text-yellow-500'
        }
    }

    return (
        <Card className="bg-card border-border h-full flex flex-col">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold flex items-center justify-between">
                    <span>Vehicle Health</span>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 flex-1 content-start pt-2">

                {/* MPG Section */}
                <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Fuel Efficiency</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold tracking-tighter">
                            {averageMpg ? averageMpg.toFixed(1) : '---'}
                        </span>
                        <span className="text-xs text-muted-foreground font-medium">MPG</span>
                        {mpgDiff !== null && (
                            <span className={`text-xs font-semibold ml-2 ${diffColor}`}>
                                {mpgDiff > 0 ? '+' : ''}{mpgDiff.toFixed(1)} vs Factory
                            </span>
                        )}
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-border/50 w-full" />

                {/* Build Health Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Build Health</p>
                        {healthScore !== null && (
                            <span className={`text-sm font-bold ${healthTextColor}`}>{healthScore}%</span>
                        )}
                    </div>

                    {healthScore !== null ? (
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                            <div
                                className={`h-full ${healthColor} transition-all duration-500`}
                                style={{ width: `${healthScore}%` }}
                            />
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground italic">No tracked parts installed</p>
                    )}

                    <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="bg-muted/30 p-2 rounded-lg border border-border/50 flex flex-col items-center justify-center text-center">
                            <Layers className="h-4 w-4 text-muted-foreground mb-1" />
                            <span className="text-lg font-bold leading-none">{inventoryStats?.totalParts || 0}</span>
                            <span className="text-[10px] text-muted-foreground mt-1">Parts Logged</span>
                        </div>
                        <div className={`p-2 rounded-lg border border-border/50 flex flex-col items-center justify-center text-center ${inventoryStats?.partsNeedingAttention ? 'bg-red-500/10 border-red-500/20' : 'bg-muted/30'}`}>
                            <AlertTriangle className={`h-4 w-4 mb-1 ${inventoryStats?.partsNeedingAttention ? 'text-red-500' : 'text-muted-foreground'}`} />
                            <span className={`text-lg font-bold leading-none ${inventoryStats?.partsNeedingAttention ? 'text-red-500' : 'text-foreground'}`}>
                                {inventoryStats?.partsNeedingAttention || 0}
                            </span>
                            <span className="text-[10px] text-muted-foreground mt-1">Needs Attention</span>
                        </div>
                    </div>
                </div>

            </CardContent>
        </Card>
    )
}
