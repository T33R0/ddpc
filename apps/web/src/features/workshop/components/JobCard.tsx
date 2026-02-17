'use client';

import React from 'react';
import { Card, CardContent } from '@repo/ui/card';
import { Button } from '@repo/ui/button';
import { Badge } from '@repo/ui/badge';
import { Play, ClipboardList, CheckCircle2, FileEdit, CircleCheck } from 'lucide-react';
import { Job, PlanStatus } from '../types';
import { cn } from '@repo/ui/lib/utils';
import { format } from 'date-fns';

const planStatusConfig: Record<PlanStatus, { label: string; className: string }> = {
    draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
    ready: { label: 'Ready', className: 'bg-success/15 text-success' },
    active: { label: 'Active', className: 'bg-warning text-warning-foreground' },
};

interface JobCardProps {
    job: Job;
    onStart?: (id: string) => void;
    onOpen?: (job: Job) => void;
    className?: string;
}

export function JobCard({ job, onStart, onOpen, className }: JobCardProps) {
    const isPlanned = job.status === 'planned';
    const isInProgress = job.status === 'in_progress';
    const planStatus = job.plan_status || 'draft';
    const statusCfg = planStatusConfig[planStatus];

    return (
        <Card className={cn("bg-card border-border shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-[0.98] h-22 flex flex-col justify-center", className)} onClick={() => onOpen?.(job)}>
            <CardContent className="p-3 space-y-2">
                <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                        <h4 className="font-semibold text-sm leading-tight truncate px-0">{job.title}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {job.status === 'completed'
                                ? `Completed ${job.date_completed ? format(new Date(job.date_completed), 'MMM d') : ''}`
                                : `Created ${format(new Date(job.created_at), 'MMM d')}`}
                        </p>
                    </div>
                    <div className="flex items-center gap-1">
                        {isPlanned && (
                            <Badge variant="outline" className={cn("font-mono text-[10px] px-1.5 h-5", statusCfg.className)}>
                                {planStatus === 'draft' && <FileEdit className="w-2.5 h-2.5 mr-0.5" />}
                                {planStatus === 'ready' && <CircleCheck className="w-2.5 h-2.5 mr-0.5" />}
                                {statusCfg.label}
                            </Badge>
                        )}
                        {!isPlanned && (
                            <Badge variant={isInProgress ? 'default' : 'secondary'} className={cn(
                                "font-mono text-[10px] px-1 h-5 capitalize",
                                isInProgress ? "bg-warning hover:bg-warning/90" : ""
                            )}>
                                {job.status.replace('_', ' ')}
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <ClipboardList className="w-3 h-3" /> {(job.tasks || []).length} Steps
                    </span>
                    <span className="flex items-center gap-1">
                        <Package className="w-3 h-3" /> {(job.parts || []).length} Parts
                    </span>
                </div>

                <div className="flex justify-end pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isPlanned && onStart && (
                        <Button size="sm" className="h-7 text-xs px-2 gap-1 bg-info hover:bg-info/90 text-info-foreground" onClick={(e) => { e.stopPropagation(); onStart(job.id); }}>
                            <Play className="w-3 h-3" /> Start
                        </Button>
                    )}
                    {isInProgress && (
                        <Button size="sm" variant="secondary" className="h-7 text-xs px-2 gap-1" onClick={(e) => { e.stopPropagation(); onOpen?.(job); }}>
                            Open Workshop
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// Helper icon
function Package({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22v-9" /></svg>
    )
}
