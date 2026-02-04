'use client'

import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Badge } from '@repo/ui/badge'
import { AlertCircle, Fuel, Wrench, Zap, Calendar, Gauge } from 'lucide-react'
import { format } from 'date-fns'
import { DashboardLog } from '../VehicleDashboard'

interface ActivityDetailModalProps {
    activity: DashboardLog | null
    isOpen: boolean
    onClose: () => void
    onViewInBuild: ((partId: string) => void) | undefined
}

export function ActivityDetailModal({ activity, isOpen, onClose, onViewInBuild }: ActivityDetailModalProps) {
    if (!activity) return null

    const getIcon = (type: string) => {
        switch (type) {
            case 'fuel': return <Fuel className="w-5 h-5 text-green-500" />
            case 'service': return <Wrench className="w-5 h-5 text-blue-500" />
            case 'mod': return <Zap className="w-5 h-5 text-yellow-500" />
            default: return <AlertCircle className="w-5 h-5 text-gray-500" />
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

    const showViewBuildButton = (activity.type === 'mod' || activity.type === 'part') && activity.id && onViewInBuild

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-card border-border">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-full ${activity.type === 'fuel' ? 'bg-green-500/10' :
                                activity.type === 'service' ? 'bg-blue-500/10' :
                                    'bg-yellow-500/10'
                            }`}>
                            {getIcon(activity.type)}
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold">{activity.title}</DialogTitle>
                            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                                {getTypeLabel(activity.type)}
                            </span>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Key Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> Date
                            </span>
                            <p className="text-sm font-medium">{format(new Date(activity.date), 'PPP')}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Gauge className="w-3 h-3" /> Odometer
                            </span>
                            <p className="text-sm font-medium">
                                {activity.odometer ? `${activity.odometer.toLocaleString()} mi` : '---'}
                            </p>
                        </div>
                    </div>

                    {/* Cost Badge if exists */}
                    {activity.cost ? (
                        <div className="flex">
                             <Badge variant="secondary" className="font-mono text-sm">
                                ${activity.cost.toFixed(2)}
                             </Badge>
                        </div>
                    ) : null}
                    
                    {/* Description */}
                    {activity.description && (
                        <div className="bg-muted/30 p-3 rounded-lg border border-border/50 text-sm text-foreground/90 whitespace-pre-wrap">
                            {activity.description}
                        </div>
                    )}
                    
                    {/* Additional Metadata */}
                    {(activity.part_number || activity.category) && (
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
                             {activity.category && (
                                 <div className="text-xs">
                                     <span className="text-muted-foreground">Category:</span> <span className="font-medium">{activity.category}</span>
                                 </div>
                             )}
                             {activity.part_number && (
                                 <div className="text-xs">
                                     <span className="text-muted-foreground">Part #:</span> <span className="font-medium font-mono">{activity.part_number}</span>
                                 </div>
                             )}
                        </div>
                    )}

                </div>

                <DialogFooter className="sm:justify-between gap-2">
                    <Button variant="ghost" onClick={onClose}>Close</Button>
                    {showViewBuildButton && (
                        <Button onClick={() => {
                            if (onViewInBuild) onViewInBuild(activity.id)
                            onClose()
                        }}>
                            View in Build
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
