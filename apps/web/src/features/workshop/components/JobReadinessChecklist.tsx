'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { Badge } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';
import { CheckCircle2, Circle, Package, Wrench, AlertTriangle, ArrowRight } from 'lucide-react';
import { checkJobReadiness, transitionJobPlanStatus } from '../actions';
import { Job } from '../types';
import { cn } from '@repo/ui/lib/utils';
import { toast } from 'react-hot-toast';

interface JobReadinessChecklistProps {
    job: Job;
    onStatusChange: () => void;
}

interface ReadinessData {
    ready: boolean;
    missingParts: Array<{ id: string; name: string; status: string }>;
    missingTools: Array<{ id: string; name: string }>;
    partsCount: number;
    toolsCount: number;
}

export function JobReadinessChecklist({ job, onStatusChange }: JobReadinessChecklistProps) {
    const [readiness, setReadiness] = useState<ReadinessData | null>(null);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        let mounted = true;
        checkJobReadiness(job.id).then(result => {
            if (mounted && !('error' in result)) {
                setReadiness(result as ReadinessData);
            }
        });
        return () => { mounted = false; };
    }, [job.id, job.parts, job.tools]);

    const planStatus = job.plan_status || 'draft';

    const handleTransition = (target: 'ready' | 'draft') => {
        startTransition(async () => {
            const result = await transitionJobPlanStatus(job.id, target);
            if ('error' in result) {
                toast.error(result.error || 'An error occurred');
            } else {
                toast.success(target === 'ready' ? 'Plan finalized — ready to start!' : 'Plan reverted to draft');
                onStatusChange();
            }
        });
    };

    if (!readiness) return null;

    const partsReady = readiness.partsCount - readiness.missingParts.length;
    const toolsReady = readiness.toolsCount - readiness.missingTools.length;

    return (
        <div className="space-y-3 rounded-lg border border-border p-3 bg-muted/30">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                    {readiness.ready
                        ? <CheckCircle2 className="w-4 h-4 text-success" />
                        : <AlertTriangle className="w-4 h-4 text-warning" />
                    }
                    Readiness Check
                </h4>
                <Badge variant="outline" className={cn(
                    "text-[10px]",
                    readiness.ready ? "text-success border-success/30" : "text-warning border-warning/30"
                )}>
                    {readiness.ready ? 'All Clear' : 'Pending'}
                </Badge>
            </div>

            {/* Parts status */}
            <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Package className="w-3 h-3" />
                    Parts ({partsReady}/{readiness.partsCount})
                </div>
                {readiness.missingParts.map(part => (
                    <div key={part.id} className="flex items-center gap-1.5 ml-4 text-xs">
                        <Circle className="w-3 h-3 text-warning" />
                        <span>{part.name}</span>
                        <Badge variant="outline" className="text-[9px] h-4 px-1 capitalize">{part.status}</Badge>
                    </div>
                ))}
                {readiness.missingParts.length === 0 && readiness.partsCount > 0 && (
                    <div className="flex items-center gap-1.5 ml-4 text-xs text-success">
                        <CheckCircle2 className="w-3 h-3" /> All parts in stock
                    </div>
                )}
            </div>

            {/* Tools status */}
            <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Wrench className="w-3 h-3" />
                    Tools ({toolsReady}/{readiness.toolsCount})
                </div>
                {readiness.missingTools.map(tool => (
                    <div key={tool.id} className="flex items-center gap-1.5 ml-4 text-xs">
                        <Circle className="w-3 h-3 text-warning" />
                        <span>{tool.name}</span>
                    </div>
                ))}
                {readiness.missingTools.length === 0 && readiness.toolsCount > 0 && (
                    <div className="flex items-center gap-1.5 ml-4 text-xs text-success">
                        <CheckCircle2 className="w-3 h-3" /> All tools acquired
                    </div>
                )}
            </div>

            {/* Transition buttons */}
            <div className="flex gap-2 pt-1">
                {planStatus === 'draft' && readiness.ready && (
                    <Button
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => handleTransition('ready')}
                        disabled={isPending}
                    >
                        <ArrowRight className="w-3 h-3" /> Finalize Plan
                    </Button>
                )}
                {planStatus === 'ready' && (
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        onClick={() => handleTransition('draft')}
                        disabled={isPending}
                    >
                        Back to Draft
                    </Button>
                )}
            </div>
        </div>
    );
}
