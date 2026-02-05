'use client'

import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { AlertTriangle, ChevronRight, Wrench } from 'lucide-react'
import { ScrollArea } from '@repo/ui/scroll-area'

interface PartNeedingAttention {
    id: string
    name: string
    status: 'Warning' | 'Critical'
    healthPercentage: number
    part_number?: string
}

interface NeedsAttentionModalProps {
    parts: PartNeedingAttention[]
    isOpen: boolean
    onClose: () => void
    onViewInBuild: (partId: string) => void
}

export function NeedsAttentionModal({ parts, isOpen, onClose, onViewInBuild }: NeedsAttentionModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-card border-border">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Needs Attention
                    </DialogTitle>
                    <DialogDescription>
                        The following parts have reached a warning or critical health level and should be inspected.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh] -mx-6 px-6">
                    <div className="space-y-3 py-2">
                        {parts.length > 0 ? (
                            parts.map((part) => (
                                <div
                                    key={part.id}
                                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
                                >
                                    <div className="flex items-start gap-3 min-w-0">
                                    <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${part.status === 'Critical' ? 'bg-destructive' : 'bg-warning'}`} />
                                        <div className="min-w-0">
                                            <h4 className="font-medium text-sm truncate">{part.name}</h4>
                                            <p className="text-xs text-muted-foreground">
                                                Health: <span className={part.status === 'Critical' ? 'text-destructive font-bold' : 'text-warning font-medium'}>
                                                    {part.healthPercentage}%
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-1 ml-2 shrink-0"
                                        onClick={() => {
                                            onViewInBuild(part.id)
                                            onClose()
                                        }}
                                    >
                                        Inspect <ChevronRight className="w-3 h-3" />
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Wrench className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>No parts currently need attention.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}
