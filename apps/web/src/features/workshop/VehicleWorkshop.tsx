'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Button } from '@repo/ui/button';
import { ScrollArea } from '@repo/ui/scroll-area';
import { Plus, Loader2, ArrowRightLeft, ShoppingBag, ClipboardList, Package, Wrench } from 'lucide-react';
import { Job, WorkshopDataResponse } from './types';
import { VehicleInstalledComponent } from '@/features/parts/types';
import { getWorkshopData, startJob, addPartToJob, createJob, markPartArrived } from './actions';

import { PartCard } from './components/PartCard';
import { JobCard } from './components/JobCard';
import { WishlistItemCard } from '../wishlist/components/WishlistItem';

import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@repo/ui/dialog';
import { Input } from '@repo/ui/input';
import { cn } from '@repo/ui/lib/utils';
import { CreatePlanModal } from './CreatePlanModal';
import { JobModal } from './JobModal';
import { SelectJobModal } from './SelectJobModal';
import { AddWishlistDialog } from '../wishlist/components/AddWishlistDialog';
import { useAuth } from '@/lib/auth';

interface VehicleWorkshopProps {
    vehicleId: string;
    odometer: number;
}

export default function VehicleWorkshop({ vehicleId, odometer }: VehicleWorkshopProps) {
    const [data, setData] = useState<WorkshopDataResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    // Modals
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [partToLink, setPartToLink] = useState<VehicleInstalledComponent | null>(null); // For "Add to Job"
    const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);

    // Edit Modal State
    const [editItem, setEditItem] = useState<any>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const handleEditItem = (item: any) => {
        setEditItem(item);
        setIsEditOpen(true);
    };

    const refreshData = async () => {
        const res = await getWorkshopData(vehicleId);
        if ('error' in res) {
            toast.error(res.error);
        } else {
            setData(res);
        }
        setLoading(false);
    };

    useEffect(() => {
        refreshData();
    }, [vehicleId]);

    // Sync selectedJob with fresh data when it changes (for instant modal updates)
    useEffect(() => {
        if (selectedJob && data) {
            const freshJob = data.jobs.find(j => j.id === selectedJob.id);
            if (freshJob) {
                // Only update if actually changed to avoid loops (though strict equality check on object ref might be enough if data is new ref)
                if (JSON.stringify(freshJob) !== JSON.stringify(selectedJob)) {
                    setSelectedJob(freshJob);
                }
            }
        }
    }, [data, selectedJob]);



    // Actions


    const handleStartJob = (id: string) => {
        startTransition(async () => {
            const res = await startJob(id);
            if (res.error) toast.error(res.error);
            else {
                toast.success("Job started!");
                refreshData();
            }
        });
    };

    const handleLinkPart = (jobId: string, qty: number = 1) => {
        if (!partToLink) return;
        startTransition(async () => {
            const res = await addPartToJob(jobId, partToLink.id, qty);
            if (res.error) toast.error(res.error);
            else {
                toast.success(qty < (partToLink.quantity || 1) ? `Added ${qty} items to job` : "Part added to job!");
                setPartToLink(null);
                refreshData();
            }
        });
    };

    const handleMarkArrived = (inventoryId: string) => {
        startTransition(async () => {
            const res = await markPartArrived(inventoryId);
            if (res.error) toast.error(res.error);
            else {
                toast.success("Marked as arrived!");
                refreshData();
            }
        });
    };

    const { profile } = useAuth();
    const hasAccess = ['pro', 'vanguard'].includes(profile?.plan || '') || profile?.role === 'admin';

    // Derived State
    const wishlist = data?.inventory.filter(i => i.status === 'wishlist' || i.status === 'ordered') || [];
    const inStock = data?.inventory.filter(i => i.status === 'in_stock') || [];
    const plannedJobs = data?.jobs.filter(j => j.status === 'planned') || [];
    const activeJobs = data?.jobs.filter(j => j.status === 'in_progress') || [];

    if (loading && !data) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!hasAccess) {
        return (
            <div className="relative h-[calc(100vh-140px)] min-h-[600px] overflow-hidden">
                {/* Blurred Content Overlay */}
                <div className="absolute inset-0 z-10 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center space-y-4 max-w-md p-6 bg-card border border-border rounded-xl shadow-2xl">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Wrench className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                            Workshop Access Required
                        </h2>
                        <p className="text-muted-foreground">
                            The Workshop is a professional-grade tool for managing builds, parts, and jobs. Upgrade to Pro or Vanguard to unlock this feature.
                        </p>
                        <Button className="w-full" asChild>
                            <a href="/pricing">View Plans</a>
                        </Button>
                    </div>
                </div>

                {/* Background Content (Blurred via overlay above, but actually rendering it gives the "peek" effect if we wanted, 
                    but here the overlay div handles the blur. If we want the CONTENT to be blurred, we apply blur to this container) 
                */}
                <div className="h-full flex flex-col gap-4 filter blur-sm pointer-events-none select-none opacity-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 grid-rows-2 gap-4 h-full">
                        {/* Mock Quadrants for visual texture */}
                        <Quadrant title="Sourcing" icon={ShoppingBag} badge={12}>
                            <div className="space-y-3">
                                <div className="h-24 bg-muted/40 rounded-lg animate-pulse" />
                                <div className="h-24 bg-muted/40 rounded-lg animate-pulse" />
                            </div>
                        </Quadrant>
                        <Quadrant title="Staging" icon={Package} badge={4}>
                            <div className="space-y-3">
                                <div className="h-24 bg-muted/40 rounded-lg animate-pulse" />
                            </div>
                        </Quadrant>
                        <Quadrant title="Planning" icon={ClipboardList} badge={2}>
                            <div className="space-y-3">
                                <div className="h-24 bg-muted/40 rounded-lg animate-pulse" />
                            </div>
                        </Quadrant>
                        <Quadrant title="Active" icon={Wrench} badge={1}>
                            <div className="space-y-3">
                                <div className="h-24 bg-muted/40 rounded-lg animate-pulse" />
                            </div>
                        </Quadrant>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-140px)] min-h-[600px] flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2">

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 grid-rows-2 gap-4 h-full">

                {/* Q1: Sourcing */}
                <Quadrant
                    title="Sourcing (Wishlist)"
                    icon={ShoppingBag}
                    badge={wishlist.length}
                    className="border-dashed border-border/60 bg-muted/20"
                    action={<Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { setEditItem(null); setIsEditOpen(true); }}><Plus className="w-4 h-4" /></Button>}
                >
                    <div className="space-y-3">
                        {wishlist.map(part => (
                            <WishlistItemCard
                                key={part.id}
                                item={{
                                    ...part,
                                    priority: 1, // Default priority as it might be missing in VehicleInstalledComponent type overlap
                                    purchase_price: part.purchase_price,
                                    purchase_url: part.purchase_url,
                                    vehicle_id: vehicleId,
                                    tracking_number: part.tracking_number, // Pass tracking info
                                    carrier: part.carrier
                                }}
                                onUpdate={refreshData}
                                onEdit={handleEditItem}
                                onMarkArrived={handleMarkArrived}
                            />
                        ))}
                        {wishlist.length === 0 && <EmptyState text="No items in wishlist" />}
                    </div>
                </Quadrant>

                {/* Q2: Staging */}
                <Quadrant
                    title="Staging (Inventory)"
                    icon={Package}
                    badge={inStock.length}
                >
                    <div className="space-y-3">
                        {inStock.map(part => (
                            <WishlistItemCard
                                key={part.id}
                                item={{
                                    ...part,
                                    priority: 1,
                                    purchase_price: part.purchase_price,
                                    purchase_url: part.purchase_url,
                                    vehicle_id: vehicleId
                                }}
                                onUpdate={refreshData}
                                onAddToJob={() => setPartToLink(part)}
                                onEdit={handleEditItem}
                            />
                        ))}
                        {inStock.length === 0 && <EmptyState text="No items in stock" />}
                    </div>
                </Quadrant>

                {/* Q3: Planning */}
                <Quadrant
                    title="Planning"
                    icon={ClipboardList}
                    badge={plannedJobs.length}
                    action={<Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setIsCreateJobOpen(true)}><Plus className="w-4 h-4" /></Button>}
                >
                    <div className="space-y-3">
                        {plannedJobs.map(job => (
                            <JobCard key={job.id} job={job} onStart={handleStartJob} onOpen={setSelectedJob} />
                        ))}
                        {plannedJobs.length === 0 && <EmptyState text="No planned jobs" />}
                    </div>
                </Quadrant>

                {/* Q4: Active */}
                <Quadrant
                    title="Active (Workbench)"
                    icon={Wrench}
                    badge={activeJobs.length}
                    className="bg-accent/5 border-secondary/50"
                >
                    <div className="space-y-3">
                        {activeJobs.map(job => (
                            <JobCard key={job.id} job={job} onOpen={setSelectedJob} className="border-secondary/50" />
                        ))}
                        {activeJobs.length === 0 && <EmptyState text="No active jobs" />}
                    </div>
                </Quadrant>
            </div>

            {/* Logic Modals */}

            {/* Unified Job Modal */}
            {selectedJob && (
                <JobModal
                    job={selectedJob}
                    isOpen={!!selectedJob}
                    onClose={() => { setSelectedJob(null); refreshData(); }}
                    currentOdometer={odometer}
                    vehicleId={vehicleId}
                    wishlist={wishlist}
                    inventory={inStock} // Pass inStock items
                    onSuccess={refreshData}
                />
            )}

            {/* Select Job Modal (for linking parts) */}
            <SelectJobModal
                isOpen={!!partToLink}
                onClose={() => setPartToLink(null)}
                activeJobs={activeJobs}
                plannedJobs={plannedJobs}
                onSelectJob={handleLinkPart}
                isPending={isPending}
                part={partToLink}
            />

            {/* Create Job Modal */}
            <CreatePlanModal
                isOpen={isCreateJobOpen}
                onClose={() => setIsCreateJobOpen(false)}
                vehicleId={vehicleId}
                onSuccess={refreshData}
            />

            <AddWishlistDialog
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                vehicleId={vehicleId}
                initialData={editItem}
                onSuccess={refreshData}
            />

        </div>
    );
}

function Quadrant({ title, icon: Icon, badge, children, className, action }: { title: string, icon: any, badge: number, children: React.ReactNode, className?: string, action?: React.ReactNode }) {
    return (
        <div className={cn("flex flex-col rounded-2xl border border-border bg-card overflow-hidden", className)}>
            <div className="flex items-center justify-between p-3 border-b border-border/50 bg-muted/30">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    {title}
                    <span className="bg-secondary px-2 py-1 rounded-md text-xs text-muted-foreground tabular-nums">
                        {badge} items
                    </span>
                </div>
                {action}
            </div>
            <ScrollArea className="flex-1">
                <div className="p-3">
                    {children}
                </div>
            </ScrollArea>
        </div>
    )
}

function EmptyState({ text }: { text: string }) {
    return (
        <div className="text-center py-8 text-muted-foreground/40 text-xs uppercase tracking-widest font-medium">
            {text}
        </div>
    )
}
