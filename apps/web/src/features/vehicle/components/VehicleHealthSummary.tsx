'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import Link from 'next/link'
import { Activity, AlertTriangle, Layers, ChevronRight } from 'lucide-react'
import { VehicleHealthHelpModal } from './VehicleHealthHelpModal'

interface VehicleHealthSummaryProps {
    averageMpg: number | null | undefined
    factoryMpg: number | undefined
    inventoryStats?: {
        totalParts: number
        healthScore: number | null
        partsNeedingAttention: number
    }
    fuelType?: string | null
    onNeedsAttentionClick?: () => void
    onBuildClick?: () => void
    recordCount?: number
    vehicleId: string
}

export function VehicleHealthSummary({ averageMpg, factoryMpg, inventoryStats, fuelType, onNeedsAttentionClick, recordCount = 0, vehicleId }: VehicleHealthSummaryProps) {
    const [isHelpOpen, setIsHelpOpen] = React.useState(false)

    // MPG Calculations
    const mpgDiff = (averageMpg && factoryMpg) ? averageMpg - factoryMpg : null
    const diffColor = mpgDiff && mpgDiff > 0 ? 'text-success' : 'text-destructive'

    // Health Calculations
    const healthScore = inventoryStats?.healthScore ?? null
    let healthColor = 'bg-success'
    let healthTextColor = 'text-success'
    if (healthScore !== null) {
        if (healthScore < 50) {
            healthColor = 'bg-destructive'
            healthTextColor = 'text-destructive'
        } else if (healthScore < 80) {
            healthColor = 'bg-warning'
            healthTextColor = 'text-warning'
        }
    }

    return (
        <Card className="bg-card border-border h-full flex flex-col relative group">
            <VehicleHealthHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold flex items-center justify-between">
                    <span>Vehicle Health</span>
                    <button
                        onClick={() => setIsHelpOpen(true)}
                        className="p-1.5 rounded-full hover:bg-muted transition-all duration-300 cursor-pointer shadow-[0_0_8px_rgba(239,68,68,0.4)] hover:shadow-[0_0_12px_rgba(239,68,68,0.6)] animate-pulse hover:animate-none"
                        title="How is this calculated?"
                    >
                        <Activity className="h-4 w-4 text-destructive" />
                    </button>
                </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 flex-1 content-start pt-2">

                {/* MPG Section */}
                <Link 
                    href={`/vehicle/${vehicleId}/fuel`}
                    className="block space-y-1 hover:bg-muted/50 -mx-2 px-2 py-2 rounded-lg transition-colors group/mpg cursor-pointer"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Fuel Efficiency</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover/mpg:opacity-100 transition-opacity" />
                    </div>
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
                </Link>

                {/* Divider */}
                <div className="h-px bg-border/50 w-full" />

                {/* Fuel Type Section */}
                {fuelType && (
                    <>
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Fuel Type</p>
                            <p className="text-sm font-bold capitalize truncate" title={fuelType}>
                                {fuelType}
                            </p>
                        </div>
                        <div className="h-px bg-border/50 w-full" />
                    </>
                )}

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
                        <div className="bg-muted/30 p-2 rounded-lg border border-border/50 flex flex-col items-center justify-start text-center h-full">
                            <Layers className="h-4 w-4 text-muted-foreground mb-1 mt-1" />
                            <span className="text-lg font-bold leading-none my-auto">{inventoryStats?.totalParts || 0}</span>
                            <span className="text-[10px] text-muted-foreground mt-1 mb-1">Parts Logged</span>
                        </div>
                        <div
                            onClick={onNeedsAttentionClick}
                            className={`p-2 rounded-lg border border-border/50 flex flex-col items-center justify-start text-center h-full cursor-pointer transition-colors active:scale-95 hover:bg-accent/50 ${inventoryStats?.partsNeedingAttention ? 'bg-destructive/10 border-destructive/20' : 'bg-muted/30'}`}
                        >
                            <AlertTriangle className={`h-4 w-4 mb-1 mt-1 ${inventoryStats?.partsNeedingAttention ? 'text-destructive' : 'text-muted-foreground'}`} />
                            <span className={`text-lg font-bold leading-none my-auto ${inventoryStats?.partsNeedingAttention ? 'text-destructive' : 'text-foreground'}`}>
                                {inventoryStats?.partsNeedingAttention || 0}
                            </span>
                            <span className="text-[10px] text-muted-foreground mt-1 mb-1 px-1 leading-tight">Needs Attention</span>
                        </div>
                    </div>

                    <div className="bg-muted/30 p-2 rounded-lg border border-border/50 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <div className="bg-background p-1.5 rounded-full">
                                <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">Total Records</span>
                         </div>
                         <span className="text-sm font-bold">{recordCount}</span>
                    </div>
                </div>

            </CardContent>
        </Card>
    )
}
