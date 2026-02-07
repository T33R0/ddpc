'use client';

import React, { useState } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
  DrawerOverlay,
  DrawerPortal,
  DrawerFooter,
} from '@repo/ui/drawer';
import { ScrollArea } from '@repo/ui/scroll-area';
import { Badge } from '@repo/ui/badge';
import { Checkbox } from '@repo/ui/checkbox';
import { Button } from '@repo/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@repo/ui/tabs';
import { Wrench, ClipboardList, Database, Box, Pencil } from 'lucide-react';
import { Job } from '../types';
import { format } from 'date-fns';
import { EditJobSheet } from './EditJobSheet';

interface CompletedJobDrawerProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CompletedJobDrawer({ job, isOpen, onClose }: CompletedJobDrawerProps) {
  const [activeTab, setActiveTab] = useState<'teardown' | 'assembly'>('teardown');
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);

  if (!job) return null;

  // Filter tasks based on active phase
  const visibleTasks = job.tasks?.filter(t => t.phase === activeTab) || [];

  return (
    <>
        <Drawer direction="right" open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerPortal>
            <DrawerOverlay className="fixed inset-0 bg-black/40" />
            <DrawerContent className="bg-background flex flex-col fixed bottom-0 right-0 h-full w-full sm:max-w-lg mt-0 border-l rounded-none shadow-xl outline-none z-50 overflow-hidden">
            
            {/* Header */}
            <DrawerHeader className="border-b px-6 py-4 bg-muted/10">
                <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                    <DrawerTitle className="text-xl font-bold">{job.title}</DrawerTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 capitalize">
                            {job.status}
                        </Badge>
                    <span>{job.date_completed ? format(new Date(job.date_completed), 'PPP') : 'Date unknown'}</span>
                    </div>
                </div>
                <DrawerClose asChild>
                    <button className="rounded-full p-2 hover:bg-muted transition-colors">
                    <span className="sr-only">Close</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    </button>
                </DrawerClose>
                </div>
                <DrawerDescription className="mt-2 line-clamp-3">
                {job.notes || 'No notes provided for this job.'}
                </DrawerDescription>
            </DrawerHeader>

            {/* Content */}
            <ScrollArea className="flex-1">
                <div className="p-6 space-y-8">

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-muted/20 rounded-lg border">
                        <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Cost</div>
                        <div className="text-lg font-mono font-medium">
                            {job.cost_total ? `$${job.cost_total.toLocaleString()}` : '-'}
                        </div>
                    </div>
                    <div className="p-3 bg-muted/20 rounded-lg border">
                        <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Odometer</div>
                        <div className="text-lg font-mono font-medium">
                            {job.odometer ? `${job.odometer.toLocaleString()} mi` : '-'}
                        </div>
                    </div>
                </div>

                {/* Tasks with Phase Toggle */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                            <ClipboardList className="w-4 h-4" />
                            Tasks Completed
                        </h3>
                    </div>

                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="teardown">Teardown</TabsTrigger>
                            <TabsTrigger value="assembly">Reassembly</TabsTrigger>
                        </TabsList>
                        
                        <div className="space-y-2">
                             {visibleTasks.length > 0 ? (
                                visibleTasks.map((task: any) => (
                                    <div key={task.id} className="flex items-start gap-2 text-sm p-2 rounded hover:bg-muted/50 transition-colors">
                                        <Checkbox checked disabled className="mt-0.5 opacity-70" />
                                        {/* Fixed: Use instruction instead of description */}
                                        <span className="text-foreground/90 leading-tight">{task.instruction}</span> 
                                    </div>
                                ))
                             ) : (
                                 <div className="text-sm text-muted-foreground text-center py-4 italic">
                                     No tasks recorded for this phase.
                                 </div>
                             )}
                        </div>
                    </Tabs>
                </div>

                {/* Parts */}
                {job.parts && job.parts.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                            <Box className="w-4 h-4" />
                            Parts Installed
                        </h3>
                        <div className="border rounded-lg bg-card overflow-hidden">
                            {job.parts.map((part: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-3 border-b last:border-0 hover:bg-muted/10 transition-colors">
                                    <div className="space-y-0.5">
                                        <div className="font-medium text-sm">
                                            {part.master_part?.name || part.name || 'Unknown Part'}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {part.master_part?.part_number || part.part_number || ''}
                                        </div>
                                    </div>
                                    <div className="text-sm font-mono text-muted-foreground">
                                        {part.quantity || 1}x
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tools */}
                {job.tools && job.tools.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                            <Wrench className="w-4 h-4" />
                            Tools Used
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {job.tools.map((tool: any) => (
                                <Badge key={tool.id} variant="secondary" className="font-normal">
                                    {tool.name}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Specs */}
                {job.specs && job.specs.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                            <Database className="w-4 h-4" />
                            Tech Specs
                        </h3>
                        <div className="border rounded-lg bg-card overflow-hidden">
                            {job.specs.map((spec: any) => (
                                <div key={spec.id} className="flex items-center justify-between p-3 border-b last:border-0">
                                    <span className="text-sm font-medium text-muted-foreground">{spec.label || spec.item}</span>
                                    <span className="text-sm font-mono">{spec.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                </div>
            </ScrollArea>
            
            <DrawerFooter className="border-t bg-muted/10 px-6 py-4">
               <Button onClick={() => setIsEditSheetOpen(true)} variant="outline" className="w-full gap-2">
                   <Pencil className="w-4 h-4" />
                   Edit Record
               </Button>
            </DrawerFooter>
            </DrawerContent>
        </DrawerPortal>
        </Drawer>

        <EditJobSheet 
            job={job} 
            isOpen={isEditSheetOpen} 
            onClose={() => setIsEditSheetOpen(false)} 
        />
    </>
  );
}
