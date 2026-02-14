'use client'

import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@repo/ui/dialog' // Implementing using Dialog as Modal usually wraps it
import { Activity, Fuel, AlertTriangle, Layers } from 'lucide-react'

interface VehicleHealthHelpModalProps {
    isOpen: boolean
    onClose: () => void
}

export function VehicleHealthHelpModal({ isOpen, onClose }: VehicleHealthHelpModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-card border-border">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-destructive" />
                        Understanding Vehicle Health
                    </DialogTitle>
                    <DialogDescription>
                        How we calculate your vehicle's condition score.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 pt-4 px-2 pb-2">
                    {/* Health Score Section */}
                    <div className="flex gap-4">
                        <div className="mt-1 bg-muted/50 p-2 rounded-lg h-fit">
                            <Layers className="h-5 w-5 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-semibold text-sm">Component Health</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Your overall score is an average of all tracked parts. We calculate health based on both
                                <span className="font-medium text-foreground"> mileage </span> and
                                <span className="font-medium text-foreground"> time </span>
                                since installation. We always use the "worst case" scenario to ensure you are never caught off guard.
                            </p>
                        </div>
                    </div>

                    {/* Fuel Efficiency Section */}
                    <div className="flex gap-4">
                        <div className="mt-1 bg-muted/50 p-2 rounded-lg h-fit">
                            <Fuel className="h-5 w-5 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-semibold text-sm">Fuel Efficiency Indicators</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                A sudden drop in MPG is often the first sign of hidden issues like tire pressure,
                                sensor failures, or engine inefficiency. Keeping an eye on this trend can save you money on repairs.
                            </p>
                        </div>
                    </div>

                    {/* Warning Section */}
                    <div className="flex gap-4">
                        <div className="mt-1 bg-muted/50 p-2 rounded-lg h-fit">
                            <AlertTriangle className="h-5 w-5 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-semibold text-sm">Critical Alerts</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Parts drop to <span className="text-warning font-medium">Warning</span> status at 30% remaining life,
                                and <span className="text-destructive font-medium">Critical</span> at 10%. We recommend ordering replacements
                                as soon as you see a warning.
                            </p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
