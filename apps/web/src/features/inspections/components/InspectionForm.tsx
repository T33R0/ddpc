'use client';

import React, { useState, useTransition } from 'react';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui/label';
import { Badge } from '@repo/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { Plus, Trash2, Search, ClipboardCheck } from 'lucide-react';
import { recordInspection } from '../actions';
import type { InspectionType, FindingSeverity } from '../types';
import type { VehicleInstalledComponent } from '@/features/parts/types';
import type { VehicleFluid } from '@/features/fluids/types';
import { toast } from 'react-hot-toast';
import { cn } from '@repo/ui/lib/utils';

const inspectionTypes: Array<{ value: InspectionType; label: string }> = [
    { value: 'routine', label: 'Routine Inspection' },
    { value: 'pre_trip', label: 'Pre-Trip Check' },
    { value: 'issue_investigation', label: 'Issue Investigation' },
    { value: 'post_repair', label: 'Post-Repair Verification' },
];

const severityOptions: Array<{ value: FindingSeverity; label: string; className: string }> = [
    { value: 'info', label: 'Info', className: 'bg-muted text-muted-foreground' },
    { value: 'monitor', label: 'Monitor', className: 'bg-primary/10 text-primary' },
    { value: 'action_needed', label: 'Action Needed', className: 'bg-warning/15 text-warning' },
    { value: 'critical', label: 'Critical', className: 'bg-destructive/15 text-destructive' },
];

interface FindingEntry {
    finding: string;
    severity: FindingSeverity;
    inventoryId: string;
    fluidId: string;
    actionTaken: string;
}

interface InspectionFormProps {
    vehicleId: string;
    inventory?: VehicleInstalledComponent[];
    fluids?: VehicleFluid[];
    onSuccess: () => void;
}

export function InspectionForm({ vehicleId, inventory = [], fluids = [], onSuccess }: InspectionFormProps) {
    const [isPending, startTransition] = useTransition();
    const [inspectionDate, setInspectionDate] = useState<string>(new Date().toISOString().split('T')[0] || '');
    const [odometer, setOdometer] = useState('');
    const [inspectionType, setInspectionType] = useState<InspectionType>('routine');
    const [summary, setSummary] = useState('');
    const [findings, setFindings] = useState<FindingEntry[]>([]);

    const addFinding = () => {
        setFindings(prev => [...prev, {
            finding: '',
            severity: 'info',
            inventoryId: '',
            fluidId: '',
            actionTaken: '',
        }]);
    };

    const removeFinding = (idx: number) => {
        setFindings(prev => prev.filter((_, i) => i !== idx));
    };

    const updateFinding = (idx: number, field: keyof FindingEntry, value: string) => {
        setFindings(prev => {
            const next = [...prev];
            const current = next[idx];
            if (current) {
                next[idx] = { ...current, [field]: value };
            }
            return next;
        });
    };

    const handleSubmit = () => {
        if (findings.length === 0) {
            toast.error('Add at least one finding');
            return;
        }

        startTransition(async () => {
            const trimmedSummary = summary.trim();
            const findings_data = findings
                .filter(f => f.finding.trim() && f.severity)
                .map(f => {
                    const trimmedAction = f.actionTaken.trim();
                    const finding: {
                        finding: string;
                        severity: FindingSeverity;
                        inventoryId?: string;
                        fluidId?: string;
                        actionTaken?: string;
                    } = {
                        finding: f.finding.trim(),
                        severity: f.severity,
                        inventoryId: f.inventoryId || undefined,
                        fluidId: f.fluidId || undefined,
                        actionTaken: trimmedAction ? trimmedAction : undefined,
                    };
                    return finding;
                });
            
            const baseData: Parameters<typeof recordInspection>[1] = {
                inspectionDate,
                ...(odometer && { odometer: parseInt(odometer) }),
                inspectionType,
                findings: findings_data,
            };
            
            const inspectionData: Parameters<typeof recordInspection>[1] = 
                trimmedSummary 
                    ? { ...baseData, summary: trimmedSummary }
                    : baseData;
            
            const result = await recordInspection(vehicleId, inspectionData);

            if ('error' in result) {
                toast.error(result.error);
            } else {
                toast.success(`Inspection recorded with ${result.findingIds.length} finding(s)`);
                // Reset
                setFindings([]);
                setSummary('');
                onSuccess();
            }
        });
    };

    return (
        <Card className="border-border">
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4 text-primary" />
                    Record Inspection
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                        <Label>Date</Label>
                        <Input
                            type="date"
                            value={inspectionDate}
                            onChange={e => setInspectionDate(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Odometer</Label>
                        <Input
                            type="number"
                            placeholder="Current miles"
                            value={odometer}
                            onChange={e => setOdometer(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Type</Label>
                        <Select value={inspectionType} onValueChange={(v) => setInspectionType(v as InspectionType)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {inspectionTypes.map(t => (
                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Summary</Label>
                    <Input
                        placeholder="Brief summary of inspection"
                        value={summary}
                        onChange={e => setSummary(e.target.value)}
                    />
                </div>

                {/* Findings */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">Findings</Label>
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={addFinding}>
                            <Plus className="w-3 h-3" /> Add Finding
                        </Button>
                    </div>

                    {findings.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-3 border border-dashed border-border rounded">
                            No findings yet. Click &quot;Add Finding&quot; to record what you observed.
                        </p>
                    )}

                    {findings.map((finding, idx) => (
                        <div key={idx} className="border border-border rounded-lg p-3 space-y-2">
                            <div className="flex items-center gap-2">
                                <Input
                                    placeholder="What did you find? e.g. 'Rear diff seal leaking'"
                                    value={finding.finding}
                                    onChange={e => updateFinding(idx, 'finding', e.target.value)}
                                    className="flex-1 h-8 text-sm"
                                />
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => removeFinding(idx)}>
                                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                </Button>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                                <Select value={finding.severity} onValueChange={(v) => updateFinding(idx, 'severity', v)}>
                                    <SelectTrigger className="h-7 text-xs w-36">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {severityOptions.map(s => (
                                            <SelectItem key={s.value} value={s.value}>
                                                <Badge variant="outline" className={cn("text-[9px] h-4 px-1", s.className)}>
                                                    {s.label}
                                                </Badge>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Link to part */}
                                <Select value={finding.inventoryId} onValueChange={(v) => updateFinding(idx, 'inventoryId', v)}>
                                    <SelectTrigger className="h-7 text-xs w-44">
                                        <SelectValue placeholder="Link to part..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">None</SelectItem>
                                        {inventory.filter(p => p.status === 'installed').map(part => (
                                            <SelectItem key={part.id} value={part.id}>{part.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Link to fluid */}
                                {fluids.length > 0 && (
                                    <Select value={finding.fluidId} onValueChange={(v) => updateFinding(idx, 'fluidId', v)}>
                                        <SelectTrigger className="h-7 text-xs w-40">
                                            <SelectValue placeholder="Link to fluid..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">None</SelectItem>
                                            {fluids.map(f => (
                                                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>

                            <Input
                                placeholder="Action taken (optional)"
                                value={finding.actionTaken}
                                onChange={e => updateFinding(idx, 'actionTaken', e.target.value)}
                                className="h-7 text-xs"
                            />
                        </div>
                    ))}
                </div>

                <Button onClick={handleSubmit} disabled={isPending || findings.length === 0} className="w-full">
                    {isPending ? 'Recording...' : 'Record Inspection'}
                </Button>
            </CardContent>
        </Card>
    );
}
