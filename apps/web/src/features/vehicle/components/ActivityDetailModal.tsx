'use client'

import React from 'react'
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerClose,
    DrawerOverlay,
    DrawerPortal,
} from '@repo/ui/drawer'
import { Button } from '@repo/ui/button'
import { Badge } from '@repo/ui/badge'
import { Label } from '@repo/ui/label'
import { AlertCircle, Fuel, Wrench, Zap, Calendar, Gauge, X } from 'lucide-react'
import { format } from 'date-fns'
import { DashboardLog } from '../VehicleDashboard'
import { cn } from '@repo/ui/lib/utils'

interface ActivityDetailModalProps {
    activity: DashboardLog | null
    isOpen: boolean
    onClose: () => void
    onViewInBuild: ((partId: string) => void) | undefined
    onViewInLogbook?: (activityId: string) => void
}

export function ActivityDetailModal({ activity, isOpen, onClose, onViewInBuild, onViewInLogbook }: ActivityDetailModalProps) {
    if (!activity) return null

    const getIcon = (type: string) => {
        switch (type) {
            case 'fuel': return <Fuel className="w-4 h-4" />
            case 'service': return <Wrench className="w-4 h-4" />
            case 'mod': return <Zap className="w-4 h-4" />
            case 'job': return <Wrench className="w-4 h-4" />
            case 'part': return <Zap className="w-4 h-4" />
            default: return <AlertCircle className="w-4 h-4" />
        }
    }

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'fuel': return 'Fuel Log'
            case 'service': return 'Service Record'
            case 'mod': return 'Modification'
            case 'job': return 'Job'
            case 'part': return 'Part Installed'
            default: return 'Activity'
        }
    }

    const getTypeBadgeClass = (type: string) => {
        switch (type) {
            case 'fuel': return 'bg-success/10 text-success'
            case 'service': return 'bg-info/10 text-info'
            case 'mod': return 'bg-warning/10 text-warning'
            case 'job': return 'bg-info/10 text-info'
            case 'part': return 'bg-warning/10 text-warning'
            default: return 'bg-muted/10 text-muted-foreground'
        }
    }

    const showViewBuildButton = (activity.type === 'mod' || activity.type === 'part') && activity.id && onViewInBuild

    return (
        <Drawer direction="right" open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DrawerPortal>
                <DrawerOverlay className="fixed inset-0 bg-black/40" />
                <DrawerContent className="bg-background flex flex-col fixed bottom-0 right-0 h-full w-full sm:max-w-lg mt-0 border-l rounded-none shadow-xl outline-none z-50 overflow-hidden">
                    <div className="flex-1 overflow-y-auto">
                        <DrawerHeader className="px-6 py-4 border-b">
                            <div className="flex items-center justify-between">
                                <DrawerTitle className="text-xl font-bold">
                                    {activity.title}
                                </DrawerTitle>
                                <DrawerClose asChild>
                                    <button className="rounded-full p-2 hover:bg-muted transition-colors">
                                        <span className="sr-only">Close</span>
                                        <X className="w-5 h-5" />
                                    </button>
                                </DrawerClose>
                            </div>
                            <DrawerDescription className="sr-only">
                                Details for {activity.title}
                            </DrawerDescription>
                        </DrawerHeader>

                        <div className="p-6 space-y-6">
                            {/* Type Badge */}
                            <div className="flex items-center gap-2">
                                <Badge className={cn(
                                    "text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider",
                                    getTypeBadgeClass(activity.type)
                                )}>
                                    <span className="mr-1">{getIcon(activity.type)}</span>
                                    {getTypeLabel(activity.type)}
                                </Badge>
                            </div>

                            {/* Key Stats */}
                            <div className="space-y-4">
                                {/* Date */}
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Date</Label>
                                    <div className="flex items-center gap-2 text-foreground">
                                        <Calendar className="w-4 h-4 text-muted-foreground" />
                                        <span className="font-medium">
                                            {format(new Date(activity.date), 'MMMM d, yyyy')}
                                        </span>
                                    </div>
                                </div>

                                {/* Odometer */}
                                {activity.odometer && (
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Odometer</Label>
                                        <div className="flex items-center gap-2 text-foreground">
                                            <Gauge className="w-4 h-4 text-muted-foreground" />
                                            <span className="font-medium">
                                                {activity.odometer.toLocaleString()} mi
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Cost */}
                                {activity.cost !== undefined && activity.cost !== null && (
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Cost</Label>
                                        <div className="text-foreground">
                                            <Badge variant="outline" className="text-base font-bold px-3 py-1">
                                                ${activity.cost.toFixed(2)}
                                            </Badge>
                                        </div>
                                    </div>
                                )}

                                {/* Part-specific fields */}
                                {activity.type === 'part' && (
                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                        {activity.category && (
                                            <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground">Category</Label>
                                                <div className="text-sm font-medium">{activity.category}</div>
                                            </div>
                                        )}
                                        {activity.part_number && (
                                            <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground">Part Number</Label>
                                                <div className="text-sm font-medium font-mono">{activity.part_number}</div>
                                            </div>
                                        )}
                                        {activity.variant && (
                                            <div className="space-y-2 col-span-2">
                                                <Label className="text-xs text-muted-foreground">Variant</Label>
                                                <div className="text-sm font-medium">{activity.variant}</div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Description */}
                                {activity.description && (
                                    <div className="space-y-2 pt-4 border-t">
                                        <Label className="text-xs text-muted-foreground">Notes / Description</Label>
                                        <div className="text-foreground whitespace-pre-wrap">
                                            {activity.description}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-6 flex justify-end gap-3 border-t">
                                {onViewInLogbook && (
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            onViewInLogbook(activity.id)
                                            onClose()
                                        }}
                                    >
                                        View in Logbook
                                    </Button>
                                )}
                                {showViewBuildButton && (
                                    <Button onClick={() => {
                                        if (onViewInBuild) onViewInBuild(activity.id)
                                        onClose()
                                    }}>
                                        View in Build
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </DrawerContent>
            </DrawerPortal>
        </Drawer>
    )
}
