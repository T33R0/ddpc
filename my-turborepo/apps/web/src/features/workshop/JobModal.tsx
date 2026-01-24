'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@repo/ui/modal';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui/label';
import { Badge } from '@repo/ui/badge';
import { ScrollArea } from '@repo/ui/scroll-area';
import { Separator } from '@repo/ui/separator';
import { Checkbox } from '@repo/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs';
import { ClipboardList, Plus, Trash2, Package, Search, Play, Wrench, CheckCircle2, ArrowRight, ArrowLeft, MoreHorizontal } from 'lucide-react';
import { Job, JobTask } from './types';
import { createJobTask, addPartToJob, startJob, updateJobTask, completeJob, addCustomPartToJob, removePartFromJob, removeJobTask, deleteJob, moveJobToPlanned } from './actions';
import { VehicleInstalledComponent } from '@/features/parts/types';
import { toast } from 'react-hot-toast';
import { cn } from '@repo/ui/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu"
import { format } from 'date-fns';

interface JobModalProps {
    isOpen: boolean;
    onClose: () => void;
    job: Job | null;
    vehicleId: string;
    wishlist: VehicleInstalledComponent[];
    inventory: VehicleInstalledComponent[]; // Added inventory prop
    onSuccess: () => void;
    currentOdometer?: number;
}

export function JobModal({ isOpen, onClose, job, vehicleId, wishlist, inventory, onSuccess, currentOdometer }: JobModalProps) {
    const [isPending, startTransition] = useTransition();

    // Tab State
    const [activeTab, setActiveTab] = useState<'parts' | 'plan'>('parts');
    const [planView, setPlanView] = useState<'teardown' | 'assembly'>('teardown');

    // Parts Tab State
    const [showPartSearch, setShowPartSearch] = useState(false);
    const [partSearchQuery, setPartSearchQuery] = useState('');

    // Custom Part Form State
    const [isCustomPart, setIsCustomPart] = useState(false);
    const [customFormData, setCustomFormData] = useState({
        name: '',
        category: '',
        partNumber: '',
        vendorLink: '',
        cost: '',
        qty: '1',
        installedDate: '',
        installedMileage: '',
        lifespanMiles: '',
        lifespanMonths: ''
    });

    // Plan Tab State //
    const [taskInput, setTaskInput] = useState('');
    const [localTasks, setLocalTasks] = useState<JobTask[]>([]);

    // Finish Job State
    const [showFinishConfirm, setShowFinishConfirm] = useState(false);
    const [newOdometer, setNewOdometer] = useState<string>(currentOdometer?.toString() || '');

    // Delete Confirmation
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (job?.tasks) {
            setLocalTasks(job.tasks);
        }
    }, [job]);

    if (!job) return null;

    const isPlanned = job.status === 'planned';
    const isActive = job.status === 'in_progress';

    // --- Actions ---

    const handleAddPart = (inventoryId: string) => {
        startTransition(async () => {
            const res = await addPartToJob(job.id, inventoryId);
            if (res.error) toast.error(res.error);
            else {
                toast.success('Part added to job');
                onSuccess();
                setShowPartSearch(false);
            }
        });
    };

    const handleRemovePart = (inventoryId: string) => {
        startTransition(async () => {
            const res = await removePartFromJob(job.id, inventoryId);
            if (res.error) toast.error(res.error);
            else {
                toast.success('Part removed from job');
                onSuccess();
            }
        });
    }

    const handleCreateCustomPart = () => {
        if (!customFormData.name) return;

        startTransition(async () => {
            const res = await addCustomPartToJob(job.id, vehicleId, {
                name: customFormData.name,
                category: customFormData.category,
                partNumber: customFormData.partNumber,
                vendorLink: customFormData.vendorLink,
                cost: customFormData.cost ? parseFloat(customFormData.cost) : undefined,
                qty: customFormData.qty ? parseInt(customFormData.qty) : undefined,
                installedDate: customFormData.installedDate,
                installedMileage: customFormData.installedMileage ? parseInt(customFormData.installedMileage) : undefined,
                lifespanMiles: customFormData.lifespanMiles ? parseInt(customFormData.lifespanMiles) : undefined,
                lifespanMonths: customFormData.lifespanMonths ? parseInt(customFormData.lifespanMonths) : undefined,
            });

            if (res.error) toast.error(res.error);
            else {
                toast.success('Custom part created and added');
                onSuccess();
                setShowPartSearch(false);
                setIsCustomPart(false);
                setCustomFormData({ name: '', category: '', partNumber: '', vendorLink: '', cost: '', qty: '1', installedDate: '', installedMileage: '', lifespanMiles: '', lifespanMonths: '' });
            }
        });
    };

    const handleAddStep = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!taskInput.trim()) return;

        startTransition(async () => {
            const res = await createJobTask(job.id, taskInput);
            if (res.error) toast.error(res.error);
            else {
                setTaskInput('');
                onSuccess();
            }
        });
    };

    const handleRemoveStep = (taskId: string) => {
        // Optimistic
        setLocalTasks(prev => prev.filter(t => t.id !== taskId));

        startTransition(async () => {
            const res = await removeJobTask(taskId);
            if (res.error) toast.error(res.error);
            else onSuccess();
        });
    }

    const handleTaskToggle = (taskId: string, currentVal: boolean) => {
        const field = planView === 'teardown' ? 'is_done_tear' : 'is_done_build';

        setLocalTasks(prev => prev.map(t => t.id === taskId ? { ...t, [field]: !currentVal } : t));

        startTransition(async () => {
            const res = await updateJobTask(taskId, field, !currentVal);
            if (res.error) toast.error('Failed to update task');
            else onSuccess();
        });
    };

    const handleStartJob = () => {
        startTransition(async () => {
            const res = await startJob(job.id);
            if (res.error) toast.error(res.error);
            else {
                toast.success('Job started!');
                onSuccess();
                onClose();
            }
        });
    };

    const handleMoveToPlanned = () => {
        startTransition(async () => {
            const res = await moveJobToPlanned(job.id);
            if (res.error) toast.error(res.error);
            else {
                toast.success('Job moved to planned');
                onSuccess();
                onClose();
            }
        });
    }

    const handleDeleteJob = () => {
        startTransition(async () => {
            const res = await deleteJob(job.id);
            if (res.error) toast.error(res.error);
            else {
                toast.success('Job deleted');
                setShowDeleteConfirm(false);
                onSuccess();
                onClose();
            }
        });
    }

    const handleFinishJob = () => {
        startTransition(async () => {
            const odometer = parseInt(newOdometer.replace(/,/g, ''));
            if (isNaN(odometer)) {
                toast.error("Invalid odometer reading");
                return;
            }
            const result = await completeJob(job.id, odometer);
            if (result.error) toast.error(result.error);
            else {
                toast.success("Job Completed");
                setShowFinishConfirm(false);
                onClose();
                onSuccess();
            }
        });
    };

    // --- Render Helpers ---

    // Combine wishlist and inventory for search, filtering by query
    const searchItems = [...wishlist, ...inventory];

    // Deduplicate by ID just in case? (Unlikely to overlap based on status, but safe)
    const uniqueItems = Array.from(new Map(searchItems.map(item => [item.id, item])).values());

    const filteredWishlist = uniqueItems.filter(p =>
        (p.master_part?.name || p.name || 'Unknown').toLowerCase().includes(partSearchQuery.toLowerCase())
    );

    const sortedTasks = [...localTasks].sort((a, b) => a.order_index - b.order_index);
    const tasksToRender = planView === 'teardown' ? sortedTasks : [...sortedTasks].reverse();

    const progressCount = planView === 'teardown'
        ? localTasks.filter(t => t.is_done_tear).length
        : localTasks.filter(t => t.is_done_build).length;
    const progressPercent = localTasks.length > 0 ? Math.round((progressCount / localTasks.length) * 100) : 0;

    return (
        <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <ModalContent className="sm:max-w-lg p-0 gap-0 overflow-hidden h-[85vh] flex flex-col">

                {/* Header */}
                <ModalHeader className="p-6 pb-2 border-b bg-muted/5 space-y-4">
                    <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1.5">
                            <ModalTitle className="flex items-center gap-2 text-xl">
                                <Wrench className="w-5 h-5 text-primary" />
                                {job.title}
                            </ModalTitle>
                            <ModalDescription>
                                {isPlanned ? 'Planned Job' : 'Work in Progress'} • {localTasks.length} Steps
                            </ModalDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant={isActive ? 'default' : 'secondary'} className="capitalize bg-background border-border text-foreground">
                                {job.status.replace('_', ' ')}
                            </Badge>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="w-4 h-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {isActive && <DropdownMenuItem onClick={handleMoveToPlanned}><ArrowLeft className="w-4 h-4 mr-2" /> Move to Planned</DropdownMenuItem>}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setShowDeleteConfirm(true)} className="text-destructive"><Trash2 className="w-4 h-4 mr-2" /> Delete Plan</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {isActive && (
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mt-2">
                            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                        </div>
                    )}
                </ModalHeader>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-6 border-b bg-muted/5">
                        <TabsList className="bg-transparent p-0 gap-6">
                            <TabsTrigger value="parts" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2 bg-transparent">
                                Parts & Supplies
                            </TabsTrigger>
                            <TabsTrigger value="plan" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2 bg-transparent">
                                Execution Plan
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* PARTS TAB */}
                    <TabsContent value="parts" className="flex-1 overflow-hidden p-0 m-0 data-[state=active]:flex flex-col">
                        <ScrollArea className="flex-1">
                            <div className="p-6 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-semibold flex items-center gap-2">
                                        <Package className="w-4 h-4" /> Required Parts
                                    </h4>
                                    {!showPartSearch && (
                                        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => setShowPartSearch(true)}>
                                            <Plus className="w-3.5 h-3.5" /> Add Part
                                        </Button>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    {job.parts?.map(part => (
                                        <div key={part.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/50 text-sm group">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                                                    <Package className="w-4 h-4 text-muted-foreground" />
                                                </div>
                                                <div className="truncate">
                                                    <div className="font-medium truncate">{part.name || part.master_part?.name || 'Unknown Part'}</div>
                                                    <div className="text-xs text-muted-foreground truncate">
                                                        {part.part_number || part.master_part?.part_number} • {part.category || 'Uncategorized'}
                                                    </div>
                                                </div>
                                            </div>
                                            <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all" onClick={() => handleRemovePart(part.id)}>
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    ))}
                                    {(!job.parts || job.parts.length === 0) && (
                                        <p className="text-xs text-muted-foreground italic">No parts linked.</p>
                                    )}
                                </div>

                                {showPartSearch && (
                                    <div className="p-4 rounded-xl border border-dashed bg-muted/30 space-y-4 animate-in fade-in zoom-in-95">
                                        <div className="flex items-center justify-between">
                                            <h5 className="text-sm font-medium">Add Part</h5>
                                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setShowPartSearch(false)}>
                                                <span className="sr-only">Close</span>
                                                <Plus className="w-4 h-4 rotate-45" />
                                            </Button>
                                        </div>

                                        {!isCustomPart ? (
                                            <div className="space-y-3">
                                                <div className="relative">
                                                    <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                                                    <Input
                                                        placeholder="Search wishlist & stock..."
                                                        className="pl-9"
                                                        value={partSearchQuery}
                                                        onChange={(e) => setPartSearchQuery(e.target.value)}
                                                        autoFocus
                                                    />
                                                </div>
                                                <div className="max-h-[160px] overflow-y-auto space-y-1">
                                                    {filteredWishlist.length === 0 ? (
                                                        <p className="text-xs text-muted-foreground p-2 text-center">No matching items.</p>
                                                    ) : (
                                                        filteredWishlist.map(p => (
                                                            <button
                                                                key={p.id}
                                                                className="w-full text-left flex items-center justify-between p-2 hover:bg-muted rounded-md text-sm transition-colors"
                                                                onClick={() => handleAddPart(p.id)}
                                                                disabled={isPending}
                                                            >
                                                                <div className="flex-1 truncate mr-2">
                                                                    <span className="font-medium">{p.name || p.master_part?.name}</span>
                                                                    {p.status === 'in_stock' && <Badge variant="outline" className="ml-2 text-[10px] h-4 px-1 py-0">In Stock</Badge>}
                                                                </div>
                                                                <Plus className="w-3 h-3 opacity-50" />
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                                <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setIsCustomPart(true)}>
                                                    or create new custom part
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {/* Expanded Custom Form */}
                                                <div className="space-y-2">
                                                    <Label className="text-xs">Part Name *</Label>
                                                    <Input
                                                        value={customFormData.name}
                                                        onChange={e => setCustomFormData({ ...customFormData, name: e.target.value })}
                                                        placeholder="e.g. Interstate Battery"
                                                        className="h-8 text-sm"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs">Category</Label>
                                                    <Select onValueChange={v => setCustomFormData({ ...customFormData, category: v })}>
                                                        <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="engine">Engine</SelectItem>
                                                            <SelectItem value="suspension">Suspension</SelectItem>
                                                            <SelectItem value="brakes">Brakes</SelectItem>
                                                            <SelectItem value="interior">Interior</SelectItem>
                                                            <SelectItem value="exterior">Exterior</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs">Part Number</Label>
                                                    <Input
                                                        value={customFormData.partNumber}
                                                        onChange={e => setCustomFormData({ ...customFormData, partNumber: e.target.value })}
                                                        placeholder="e.g. MTZ-34"
                                                        className="h-8 text-sm"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs">Vendor Link</Label>
                                                    <Input
                                                        value={customFormData.vendorLink}
                                                        onChange={e => setCustomFormData({ ...customFormData, vendorLink: e.target.value })}
                                                        placeholder="https://..."
                                                        className="h-8 text-sm"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">Date Installed</Label>
                                                        <Input
                                                            type="date"
                                                            value={customFormData.installedDate}
                                                            onChange={e => setCustomFormData({ ...customFormData, installedDate: e.target.value })}
                                                            className="h-8 text-sm"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">Mileage</Label>
                                                        <Input
                                                            type="number"
                                                            value={customFormData.installedMileage}
                                                            onChange={e => setCustomFormData({ ...customFormData, installedMileage: e.target.value })}
                                                            className="h-8 text-sm"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs">Purchase Cost ($)</Label>
                                                    <Input
                                                        type="number"
                                                        value={customFormData.cost}
                                                        onChange={e => setCustomFormData({ ...customFormData, cost: e.target.value })}
                                                        placeholder="0.00"
                                                        className="h-8 text-sm"
                                                    />
                                                </div>

                                                <div className="border-t pt-2 mt-2">
                                                    <Label className="text-xs font-semibold mb-2 block">Expected Lifespan</Label>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-1">
                                                            <Label className="text-[10px] text-muted-foreground">Miles</Label>
                                                            <Input
                                                                type="number"
                                                                value={customFormData.lifespanMiles}
                                                                onChange={e => setCustomFormData({ ...customFormData, lifespanMiles: e.target.value })}
                                                                placeholder="e.g. 50000"
                                                                className="h-8 text-sm"
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-[10px] text-muted-foreground">Months</Label>
                                                            <Input
                                                                type="number"
                                                                value={customFormData.lifespanMonths}
                                                                onChange={e => setCustomFormData({ ...customFormData, lifespanMonths: e.target.value })}
                                                                placeholder="e.g. 60"
                                                                className="h-8 text-sm"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 pt-2">
                                                    <Button variant="ghost" size="sm" className="flex-1" onClick={() => setIsCustomPart(false)}>Cancel</Button>
                                                    <Button size="sm" className="flex-1" onClick={handleCreateCustomPart} disabled={!customFormData.name}>Add Custom Part</Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    {/* PLAN TAB */}
                    <TabsContent value="plan" className="flex-1 overflow-hidden p-0 m-0 data-[state=active]:flex flex-col">
                        <div className="bg-muted/10 border-b flex items-center justify-between px-6 py-2">
                            <div className="text-xs font-medium text-muted-foreground">Work View</div>
                            <div className="flex bg-muted p-0.5 rounded-lg">
                                <button
                                    onClick={() => setPlanView('teardown')}
                                    className={cn("px-3 py-1 text-xs font-medium rounded-md transition-all", planView === 'teardown' ? "bg-background shadow-xs text-foreground" : "text-muted-foreground hover:text-foreground")}
                                >Teardown</button>
                                <button
                                    onClick={() => setPlanView('assembly')}
                                    className={cn("px-3 py-1 text-xs font-medium rounded-md transition-all", planView === 'assembly' ? "bg-background shadow-xs text-foreground" : "text-muted-foreground hover:text-foreground")}
                                >Assembly</button>
                            </div>
                        </div>

                        <ScrollArea className="flex-1">
                            <div className="p-6 space-y-4">
                                {tasksToRender.map((task) => {
                                    const isDone = planView === 'teardown' ? task.is_done_tear : task.is_done_build;

                                    if (isActive) {
                                        return (
                                            <div key={task.id} className={cn(
                                                "flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 group relative",
                                                isDone ? "bg-muted/30 border-border/50 opacity-60" : "bg-card border-border hover:border-primary/50"
                                            )}>
                                                <Checkbox
                                                    checked={isDone}
                                                    onCheckedChange={() => handleTaskToggle(task.id, isDone)}
                                                    className="mt-1"
                                                />
                                                <div className="flex-1 pt-0.5 pointer-events-none">
                                                    <p className={cn("text-base font-medium leading-normal", isDone && "line-through text-muted-foreground")}>
                                                        {task.instruction}
                                                    </p>
                                                </div>
                                                <span className="text-xs font-mono text-muted-foreground/50 tabular-nums">#{task.order_index}</span>
                                                {/* Remove task in active mode? Maybe restricted, but let's allow it via long press or explicit action if requested. 
                                                    User says "remove ... from the plan". Let's assume allowed. */}
                                                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveStep(task.id)}>
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        // Planned View (Editable)
                                        return (
                                            <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card text-sm group relative">
                                                <span className="text-xs font-mono text-muted-foreground mt-0.5 select-none">
                                                    {(task.order_index).toString().padStart(2, '0')}
                                                </span>
                                                <p className="leading-snug">{task.instruction}</p>
                                                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveStep(task.id)}>
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    }
                                })}

                                {/* Add Step */}
                                <form onSubmit={handleAddStep} className="flex gap-2 pt-2">
                                    <div className="w-8 flex justify-center shrink-0">
                                        <div className="w-6 h-6 rounded-full border border-dashed flex items-center justify-center border-muted-foreground/40">
                                            <Plus className="w-3 h-3 text-muted-foreground" />
                                        </div>
                                    </div>
                                    <Input
                                        placeholder="Add next step..."
                                        value={taskInput}
                                        onChange={(e) => setTaskInput(e.target.value)}
                                        className="flex-1 h-9 text-sm"
                                        disabled={isPending}
                                    />
                                </form>
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>

                {/* Footer */}
                <ModalFooter className="p-4 border-t bg-background">
                    <Button variant="outline" onClick={onClose} className="mr-auto">Close</Button>

                    {isPlanned && (
                        <Button onClick={handleStartJob} disabled={isPending} className="gap-2">
                            <Play className="w-4 h-4" /> Start Job
                        </Button>
                    )}

                    {isActive && (
                        <Button onClick={() => setShowFinishConfirm(true)} disabled={isPending} className="gap-2">
                            Finish Job <ArrowRight className="w-4 h-4" />
                        </Button>
                    )}
                </ModalFooter>

                {/* Confirm Overlays */}
                {showFinishConfirm && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                        <div className="bg-card border shadow-lg rounded-xl p-6 max-w-sm w-full space-y-4 animate-in fade-in zoom-in-95">
                            <div className="text-center space-y-2">
                                <div className="mx-auto w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <h3 className="font-semibold text-lg">Job Complete?</h3>
                                <p className="text-sm text-muted-foreground">Confirm final odometer to update history.</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Final Odometer</Label>
                                <Input
                                    value={newOdometer}
                                    onChange={e => setNewOdometer(e.target.value)}
                                    type="number"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1" onClick={() => setShowFinishConfirm(false)}>Cancel</Button>
                                <Button className="flex-1" onClick={handleFinishJob}>Confirm</Button>
                            </div>
                        </div>
                    </div>
                )}

                {showDeleteConfirm && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                        <div className="bg-card border shadow-lg rounded-xl p-6 max-w-sm w-full space-y-4 animate-in fade-in zoom-in-95">
                            <div className="text-center space-y-2">
                                <div className="mx-auto w-12 h-12 bg-destructive/10 text-destructive rounded-full flex items-center justify-center">
                                    <Trash2 className="w-6 h-6" />
                                </div>
                                <h3 className="font-semibold text-lg">Delete Job?</h3>
                                <p className="text-sm text-muted-foreground">This will remove the job plan. Linked parts will remain in your wishlist/inventory.</p>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <Button variant="outline" className="flex-1" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                                <Button variant="destructive" className="flex-1" onClick={handleDeleteJob}>Delete</Button>
                            </div>
                        </div>
                    </div>
                )}
            </ModalContent>
        </Modal>
    );
}
