'use client';

import React, { useState, useTransition, useEffect, useRef } from 'react';
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
import { ClipboardList, Plus, Trash2, Package, Search, Play, Wrench, CheckCircle2, ArrowRight, ArrowLeft, MoreHorizontal, Bolt, Hammer, Gauge, Zap, Maximize2, Minimize2, Loader2, ListTodo } from 'lucide-react';
import { Job, JobTask, JobTool, JobSpec } from './types';
import {
    createJobTask, addPartToJob, startJob, updateJobTask, completeJob, addCustomPartToJob,
    removePartFromJob, removeJobTask, deleteJob, moveJobToPlanned,
    createJobTool, updateJobTool, deleteJobTool,
    createJobSpec, updateJobSpec, deleteJobSpec,
    generateMissionPlan, addToolToUserInventory
} from './actions';
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

interface JobModalProps {
    isOpen: boolean;
    onClose: () => void;
    job: Job | null;
    vehicleId: string;
    wishlist: VehicleInstalledComponent[];
    inventory: VehicleInstalledComponent[];
    onSuccess: () => void;
    currentOdometer?: number;
}

export function JobModal({ isOpen, onClose, job, vehicleId, wishlist, inventory, onSuccess, currentOdometer }: JobModalProps) {
    const [isPending, startTransition] = useTransition();
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Tab State
    const [activeTab, setActiveTab] = useState<'setup' | 'plan'>('setup');
    const [planView, setPlanView] = useState<'teardown' | 'assembly'>('teardown');

    // Local Data State (to avoid jitter while revalidating)
    const [localTools, setLocalTools] = useState<JobTool[]>([]);
    const [localSpecs, setLocalSpecs] = useState<JobSpec[]>([]);
    const [localTasks, setLocalTasks] = useState<JobTask[]>([]);

    // Inputs
    const [toolInput, setToolInput] = useState('');
    const [specItemInput, setSpecItemInput] = useState('');
    const [specValueInput, setSpecValueInput] = useState('');
    const [taskInput, setTaskInput] = useState('');

    // Parts Search
    const [showPartSearch, setShowPartSearch] = useState(false);
    const [partSearchQuery, setPartSearchQuery] = useState('');

    // AI Generation
    const [isGenerating, setIsGenerating] = useState(false);
    const [showGenConfirm, setShowGenConfirm] = useState(false);

    // Custom Part Form
    const [isCustomPart, setIsCustomPart] = useState(false);
    const [customFormData, setCustomFormData] = useState({
        name: '', category: '', partNumber: '', vendorLink: '', cost: '', qty: '1', installedDate: '', installedMileage: '', lifespanMiles: '', lifespanMonths: ''
    });

    // Finish Job State
    const [showFinishConfirm, setShowFinishConfirm] = useState(false);
    const [newOdometer, setNewOdometer] = useState<string>(currentOdometer?.toString() || '');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (job) {
            console.log('[JobModal] Updated job:', job.id, 'Tasks:', job.tasks?.length);
            setLocalTools(job.tools || []);
            setLocalSpecs(job.specs || []);
            setLocalTasks(job.tasks || []);
        }
    }, [job]);

    if (!job) return null;

    const isPlanned = job.status === 'planned';
    const isActive = job.status === 'in_progress';

    // --- Computed ---
    const progressCount = planView === 'teardown'
        ? localTasks.filter(t => t.is_done_tear).length
        : localTasks.filter(t => t.is_done_build).length;
    const progressPercent = localTasks.length > 0 ? Math.round((progressCount / localTasks.length) * 100) : 0;

    // --- Actions ---

    const handleGeneratePlan = async () => {
        setShowGenConfirm(false);
        setIsGenerating(true);
        try {
            // Extract parts list
            const partsList = job.parts?.map(p => p.name || p.master_part?.name || "Unknown Part") || [];

            const res = await generateMissionPlan(job.id, partsList);
            if (res.error) toast.error(res.error);
            else {
                toast.success("Mission Plan Generated!");
                onSuccess();
                setActiveTab('plan');
            }
        } catch (e) {
            toast.error("Failed to generate plan");
        } finally {
            setIsGenerating(false);
        }
    };

    // Tools
    const handleAddTool = (e: React.FormEvent) => {
        e.preventDefault();
        if (!toolInput.trim()) return;
        startTransition(async () => {
            const res = await createJobTool(job.id, toolInput);
            if (res.error) toast.error(res.error);
            else {
                setToolInput('');
                onSuccess();
            }
        });
    };

    const handleToggleTool = (toolId: string, current: boolean, toolName: string) => {
        // Optimistic UI update
        setLocalTools(prev => prev.map(t => t.id === toolId ? { ...t, is_acquired: !current } : t));
        startTransition(async () => {
            await updateJobTool(toolId, { is_acquired: !current });
            // If marking as acquired, sync to user's personal inventory
            if (!current) {
                await addToolToUserInventory(toolName);
            }
            onSuccess();
        });
    };

    const handleDeleteTool = (toolId: string) => {
        setLocalTools(prev => prev.filter(t => t.id !== toolId));
        startTransition(async () => {
            await deleteJobTool(toolId);
            onSuccess();
        });
    }

    // Specs
    const handleAddSpec = () => {
        if (!specItemInput.trim() || !specValueInput.trim()) return;
        startTransition(async () => {
            const res = await createJobSpec(job.id, specItemInput, specValueInput);
            if (res.error) toast.error(res.error);
            else {
                setSpecItemInput('');
                setSpecValueInput('');
                onSuccess();
            }
        });
    };

    const handleDeleteSpec = (specId: string) => {
        setLocalSpecs(prev => prev.filter(s => s.id !== specId));
        startTransition(async () => {
            await deleteJobSpec(specId);
            onSuccess();
        });
    }

    // Tasks (Steps)
    const handleAddStep = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!taskInput.trim()) return;
        startTransition(async () => {
            const res = await createJobTask(job.id, taskInput, planView);
            if (res.error) toast.error(res.error);
            else {
                setTaskInput('');
                onSuccess();
            }
        });
    };

    const handleTaskToggle = (taskId: string, currentVal: boolean, phase: 'teardown' | 'assembly') => {
        const field = phase === 'teardown' ? 'is_done_tear' : 'is_done_build';
        setLocalTasks(prev => prev.map(t => t.id === taskId ? { ...t, [field]: !currentVal } : t));
        startTransition(async () => {
            await updateJobTask(taskId, field, !currentVal);
            onSuccess();
        });
    };

    const handleRemoveStep = (taskId: string) => {
        setLocalTasks(prev => prev.filter(t => t.id !== taskId));
        startTransition(async () => {
            await removeJobTask(taskId);
            onSuccess();
        });
    }

    // Job Lifecycle
    const handleStartJob = () => {
        startTransition(async () => {
            const res = await startJob(job.id);
            if (res.error) toast.error(res.error);
            else {
                toast.success('Mission Started');
                setActiveTab('plan');
                onSuccess();
            }
        });
    };

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
                toast.success("Mission Accomplished");
                setShowFinishConfirm(false);
                onClose();
                onSuccess();
            }
        });
    };

    // Parts
    const handleAddPart = (inventoryId: string) => {
        startTransition(async () => {
            const res = await addPartToJob(job.id, inventoryId);
            if (res.error) toast.error(res.error);
            else {
                toast.success('Part added to mission');
                onSuccess();
                setShowPartSearch(false);
            }
        });
    };

    const handleRemovePart = (inventoryId: string) => {
        startTransition(async () => {
            const res = await removePartFromJob(job.id, inventoryId);
            if (res.error) toast.error(res.error);
            else onSuccess();
        });
    }

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

    // Render Helpers
    const searchItems = [...wishlist, ...inventory];
    const uniqueItems = Array.from(new Map(searchItems.map(item => [item.id, item])).values());
    const filteredWishlist = uniqueItems.filter(p => (p.master_part?.name || p.name || 'Unknown').toLowerCase().includes(partSearchQuery.toLowerCase()));

    const renderSetupTab = () => (
        <ScrollArea className="flex-1">
            <div className="p-6 space-y-8">
                {/* 1. Generate Section */}
                {(!job.tools?.length && !job.specs?.length && !job.tasks?.length) && (
                    <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-center justify-between">
                        <div>
                            <h4 className="font-semibold flex items-center gap-2">
                                <Zap className="w-4 h-4 text-primary" />
                                AI Mission Planner
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1">
                                Auto-generate tools, specs, and execution steps.
                            </p>
                        </div>
                        <Button
                            onClick={() => setShowGenConfirm(true)}
                            disabled={isGenerating || isPending}
                            className="gap-2"
                            size="sm"
                        >
                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bolt className="w-4 h-4" />}
                            Generate Plan
                        </Button>
                    </div>
                )}

                {/* 2. Parts & Loadout Grid */}
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Parts */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                <Package className="w-4 h-4" /> Required Parts
                            </h4>
                            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => setShowPartSearch(true)}>
                                <Plus className="w-3.5 h-3.5" /> Add
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {job.parts?.map(part => (
                                <div key={part.id} className="flex items-center justify-between p-2.5 rounded-lg border bg-card/50 text-sm group">
                                    <div className="flex-1 truncate mr-2">
                                        <div className="font-medium truncate">{part.name || part.master_part?.name}</div>
                                        <div className="text-[0.625rem] text-muted-foreground">{part.part_number || part.master_part?.part_number}</div>
                                    </div>
                                    <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => handleRemovePart(part.id)}>
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                            ))}
                            {(!job.parts || job.parts.length === 0) && <p className="text-xs text-muted-foreground italic">No parts linked.</p>}
                        </div>
                    </div>

                    {/* Tools Loadout */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                            <Hammer className="w-4 h-4" /> Tool Loadout
                        </h4>
                        <form onSubmit={handleAddTool} className="flex gap-2">
                            <Input
                                placeholder="Add tool (e.g. 10mm Socket)..."
                                value={toolInput}
                                onChange={e => setToolInput(e.target.value)}
                                className="h-8 text-sm bg-muted/30"
                            />
                            <Button size="sm" type="submit" variant="secondary" className="h-8 px-3" disabled={!toolInput.trim()}>
                                <Plus className="w-4 h-4" />
                            </Button>
                        </form>
                        <div className="space-y-1">
                            {[...localTools].sort((a, b) => {
                                // Checked items go to bottom
                                if (a.is_acquired !== b.is_acquired) return a.is_acquired ? 1 : -1;
                                return (a.name || '').localeCompare(b.name || '');
                            }).map(tool => (
                                <div key={tool.id} className={cn("flex items-center gap-3 p-2 rounded-md transition-all duration-300", tool.is_acquired ? "bg-muted/30" : "hover:bg-muted/50 group")}>
                                    <Checkbox
                                        checked={tool.is_acquired}
                                        onCheckedChange={() => handleToggleTool(tool.id, !!tool.is_acquired, tool.name)}
                                        className="rounded-sm w-4 h-4"
                                    />
                                    <span className={cn("flex-1 text-sm transition-all", tool.is_acquired && "text-muted-foreground line-through opacity-60")}>{tool.name}</span>
                                    <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteTool(tool.id)}>
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                            ))}
                            {localTools.length === 0 && <p className="text-xs text-muted-foreground italic">No tools specified.</p>}
                        </div>
                    </div>
                </div>

                {/* 3. Specs HUD */}
                <div className="space-y-4">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Gauge className="w-4 h-4" /> Technical Specs (HUD)
                    </h4>

                    <div className="flex gap-2 items-end">
                        <div className="flex-1 space-y-1">
                            <Label className="text-[0.625rem] text-muted-foreground">Item</Label>
                            <Input
                                placeholder="e.g. Axle Nut Torque"
                                value={specItemInput}
                                onChange={e => setSpecItemInput(e.target.value)}
                                className="h-8 text-sm"
                            />
                        </div>
                        <div className="w-1/3 space-y-1">
                            <Label className="text-[0.625rem] text-muted-foreground">Value</Label>
                            <Input
                                placeholder="e.g. 210 Nm"
                                value={specValueInput}
                                onChange={e => setSpecValueInput(e.target.value)}
                                className="h-8 text-sm"
                            />
                        </div>
                        <Button size="sm" variant="secondary" className="h-8 px-3" onClick={handleAddSpec} disabled={!specItemInput.trim()}>
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {localSpecs.map(spec => (
                            <div key={spec.id} className="bg-muted/30 border p-2.5 rounded-lg flex flex-col relative group">
                                <span className="text-[0.625rem] text-muted-foreground uppercase tracking-wider">{spec.item}</span>
                                <span className="font-mono font-medium text-lg">{spec.value}</span>
                                <button className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteSpec(spec.id)}>
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                        {localSpecs.length === 0 && <p className="text-xs text-muted-foreground italic col-span-full">No specs added.</p>}
                    </div>
                </div>
            </div>

            {/* Part Search Overlay */}
            {showPartSearch && (
                <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-10 p-6 flex flex-col animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between mb-4">
                        <h5 className="font-semibold">Add Part to Mission</h5>
                        <Button size="sm" variant="ghost" onClick={() => setShowPartSearch(false)}>Close</Button>
                    </div>
                    <Input
                        placeholder="Search wishlist & stock..."
                        value={partSearchQuery}
                        onChange={(e) => setPartSearchQuery(e.target.value)}
                        autoFocus
                        className="mb-4"
                    />
                    <div className="flex-1 overflow-y-auto space-y-1">
                        {filteredWishlist.map(p => (
                            <button
                                key={p.id}
                                className="w-full text-left flex items-center justify-between p-3 hover:bg-muted rounded-md border border-transparent hover:border-border transition-all"
                                onClick={() => handleAddPart(p.id)}
                            >
                                <div className="flex-1 truncate mr-2">
                                    <span className="font-medium block">{p.name || p.master_part?.name}</span>
                                    {p.status === 'in_stock' && <Badge variant="outline" className="text-[0.625rem]">In Stock</Badge>}
                                </div>
                                <Plus className="w-4 h-4 text-muted-foreground" />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </ScrollArea>
    );

    const renderPlanTab = () => {
        const teardownTasks = localTasks.filter(t => t.phase === 'teardown').sort((a, b) => a.order_index - b.order_index);
        const assemblyTasks = localTasks.filter(t => t.phase === 'assembly').sort((a, b) => a.order_index - b.order_index);
        const currentTasks = planView === 'teardown' ? teardownTasks : assemblyTasks;
        const isDoneField = planView === 'teardown' ? 'is_done_tear' : 'is_done_build';

        return (
            <React.Fragment>
                <div className="bg-muted/10 border-b flex items-center justify-between px-6 py-2">
                    <div className="text-xs font-medium text-muted-foreground">Execution Flow</div>
                    <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
                        <button
                            onClick={() => setPlanView('teardown')}
                            className={cn(
                                'px-3 py-1 text-xs font-medium rounded-md transition-all',
                                planView === 'teardown' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            Teardown ({teardownTasks.length})
                        </button>
                        <button
                            onClick={() => setPlanView('assembly')}
                            className={cn(
                                'px-3 py-1 text-xs font-medium rounded-md transition-all',
                                planView === 'assembly' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            Assembly ({assemblyTasks.length})
                        </button>
                    </div>
                </div>
                <div className="flex-1 w-full overflow-y-auto min-h-0">
                    <div className="p-6 space-y-4">
                        {/* Step Editor */}
                        <div className="space-y-2">
                            {currentTasks.map((task) => (
                                <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card text-sm group relative">
                                    <Checkbox
                                        checked={planView === 'teardown' ? task.is_done_tear : task.is_done_build}
                                        onCheckedChange={() => handleTaskToggle(task.id, planView === 'teardown' ? task.is_done_tear : task.is_done_build, planView)}
                                        className="mt-0.5"
                                    />
                                    <div className={cn("flex-1 leading-snug", (planView === 'teardown' ? task.is_done_tear : task.is_done_build) && "line-through text-muted-foreground opacity-60")}>
                                        {task.instruction}
                                    </div>
                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 absolute right-2 top-2" onClick={() => handleRemoveStep(task.id)}>
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                            ))}
                            {currentTasks.length === 0 && <p className="text-muted-foreground italic text-sm">No {planView} steps generated yet.</p>}
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t bg-background mt-auto">
                    <form onSubmit={handleAddStep} className="flex gap-2">
                        <div className="w-8 flex justify-center shrink-0">
                            <div className="w-6 h-6 rounded-full border border-dashed flex items-center justify-center border-muted-foreground/40">
                                <Plus className="w-3 h-3 text-muted-foreground" />
                            </div>
                        </div>
                        <Input
                            placeholder={`Add ${planView} step...`}
                            value={taskInput}
                            onChange={(e) => setTaskInput(e.target.value)}
                            className="flex-1 h-9 text-sm"
                            disabled={isPending}
                        />
                    </form>
                </div>
            </React.Fragment>
        );
    };



    return (
        <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <ModalContent className={cn(
                "p-0 gap-0 overflow-hidden flex flex-col transition-all duration-300",
                isFullscreen ? "w-screen h-dvh max-w-none rounded-none m-0" : "w-full sm:max-w-5xl h-[85vh] rounded-xl" // Increased max-w to 5xl for desktop full-width feel
            )}>
                {/* Header */}
                <ModalHeader className="p-4 px-6 border-b bg-muted/5 flex-shrink-0">
                    <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                            <ModalTitle className="flex items-center gap-2 text-xl">
                                <Wrench className="w-5 h-5 text-primary" />
                                {job.title}
                            </ModalTitle>
                            <ModalDescription className="text-xs">
                                {isPlanned ? 'Planned Mission' : 'Active Operation'} • {localTasks.length} Steps
                            </ModalDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hidden md:flex" onClick={() => setIsFullscreen(!isFullscreen)}>
                                {isFullscreen ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                            </Button>
                            <Badge variant={isActive ? 'default' : 'secondary'} className="capitalize">
                                {job.status.replace('_', ' ')}
                            </Badge>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="w-4 h-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {isActive && <DropdownMenuItem onClick={handleMoveToPlanned}><ArrowLeft className="w-4 h-4 mr-2" /> Move to Planned</DropdownMenuItem>}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setShowDeleteConfirm(true)} className="text-destructive"><Trash2 className="w-4 h-4 mr-2" /> Delete Mission</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </ModalHeader>

                {/* Tabs & Content */}
                {/* Tabs & Content */}
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-6 border-b bg-muted/5 flex-shrink-0">
                        <TabsList className="bg-transparent p-0 gap-6 w-full justify-start h-auto">
                            <TabsTrigger value="setup" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-3 bg-transparent text-muted-foreground data-[state=active]:text-foreground">
                                Setup
                            </TabsTrigger>
                            <TabsTrigger value="plan" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-3 bg-transparent text-muted-foreground data-[state=active]:text-foreground">
                                Plan
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="setup" className="flex-1 min-h-0 data-[state=active]:flex flex-col">
                        {renderSetupTab()}
                    </TabsContent>

                    <TabsContent value="plan" className="flex-1 min-h-0 data-[state=active]:flex flex-col">
                        {renderPlanTab()}
                    </TabsContent>
                </Tabs>

                {/* Footer */}
                <ModalFooter className="p-4 border-t bg-background flex-shrink-0 sm:justify-end">
                    <Button variant="outline" onClick={onClose} className="mr-auto hidden sm:flex">Close</Button>

                    {activeTab !== 'plan' && (
                        <div className="flex gap-2 w-full sm:w-auto">
                            {/* Nav Helpers */}
                            {activeTab === 'setup' && <Button className="w-full sm:w-auto" onClick={() => setActiveTab('plan')}>Next: Plan <ArrowRight className="ml-2 w-4 h-4" /></Button>}
                        </div>
                    )}

                    {isPlanned && activeTab === 'plan' && (
                        <Button onClick={handleStartJob} disabled={isPending} className="w-full sm:w-auto gap-2 text-lg h-10 px-6">
                            <Play className="w-4 h-4" /> Start Job
                        </Button>
                    )}

                    {isActive && activeTab === 'plan' && (
                        <Button onClick={() => setShowFinishConfirm(true)} disabled={isPending} className="w-full sm:w-auto gap-2 bg-success hover:bg-success/90 text-success-foreground">
                            Complete Mission <CheckCircle2 className="w-4 h-4" />
                        </Button>
                    )}
                </ModalFooter>

                {/* Confirm Dialogs */}
                {showFinishConfirm && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                        <div className="bg-card border shadow-lg rounded-xl p-6 max-w-sm w-full space-y-4 animate-in fade-in zoom-in-95">
                            <div className="text-center space-y-2">
                                <div className="mx-auto w-12 h-12 bg-success/10 text-success rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <h3 className="font-semibold text-lg">Mission Accomplished?</h3>
                                <p className="text-sm text-muted-foreground">Confirm final odometer to update vehicle history.</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Final Odometer</Label>
                                <Input value={newOdometer} onChange={e => setNewOdometer(e.target.value)} type="number" />
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
                                <h3 className="font-semibold text-lg">Abort Mission?</h3>
                                <p className="text-sm text-muted-foreground">Deleting this plan will remove all steps and loadout data.</p>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <Button variant="outline" className="flex-1" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                                <Button variant="destructive" className="flex-1" onClick={() => { deleteJob(job.id); onClose(); }}>Delete</Button>
                            </div>
                        </div>
                    </div>
                )}
                {showGenConfirm && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                        <div className="bg-card border shadow-lg rounded-xl p-6 max-w-sm w-full space-y-4 animate-in fade-in zoom-in-95">
                            <div className="text-center space-y-2">
                                <div className="mx-auto w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                                    <ListTodo className="w-6 h-6" />
                                </div>
                                <h3 className="font-semibold text-lg">Ready to Plan?</h3>
                                <p className="text-sm text-muted-foreground">
                                    The AI plan is accurate if specific parts are linked.
                                    <br />
                                    <strong>{(job.parts || []).length} parts linked.</strong>
                                </p>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <Button variant="outline" className="flex-1" onClick={() => setShowGenConfirm(false)}>Back to Job</Button>
                                <Button className="flex-1" onClick={handleGeneratePlan}>Generate</Button>
                            </div>
                        </div>
                    </div>
                )}
            </ModalContent>
        </Modal>
    );
}
