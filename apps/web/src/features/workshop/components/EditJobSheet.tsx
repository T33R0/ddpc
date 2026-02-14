'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerOverlay,
  DrawerPortal,
  DrawerClose
} from '@repo/ui/drawer';
import { Input } from '@repo/ui/input';
import { Button } from '@repo/ui/button';
import { Textarea } from '@repo/ui/textarea';
import { Label } from '@repo/ui/label';
import { ScrollArea } from '@repo/ui/scroll-area';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from '@repo/ui/modal';
import { toast } from 'react-hot-toast';

import { Job } from '../types';
import { updateJob } from '../actions';

const jobFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  date_completed: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date",
  }),
  odometer: z.coerce.number().min(0, 'Odometer must be positive'),
  cost_total: z.coerce.number().min(0, 'Cost must be positive'),
  notes: z.string().optional(),
});

type JobFormValues = z.infer<typeof jobFormSchema>;

interface EditJobSheetProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditJobSheet({ job, isOpen, onClose }: EditJobSheetProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // We only want to show the warning once per session/open
  useEffect(() => {
    if (isOpen) {
      setShowWarning(true);
    }
  }, [isOpen]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: '',
      date_completed: new Date().toISOString().split('T')[0],
      odometer: 0,
      cost_total: 0,
      notes: '',
    },
  });

  // Update form values when job changes
  useEffect(() => {
    if (job) {
      reset({
        title: job.title,
        date_completed: job.date_completed ? new Date(job.date_completed).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        odometer: job.odometer || 0,
        cost_total: job.cost_total || 0,
        notes: job.notes || '',
      });
    }
  }, [job, reset]);

  const onSubmit = async (data: JobFormValues) => {
    if (!job) return;

    setIsSubmitting(true);
    try {
      const result = await updateJob(job.id, {
        title: data.title,
        date_completed: new Date(data.date_completed).toISOString(),
        odometer: data.odometer,
        cost_total: data.cost_total,
        notes: data.notes,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Job updated successfully');
        onClose();
      }
    } catch (error) {
      toast.error('Failed to update job');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinueEditing = () => {
    setShowWarning(false);
  };

  const handleCancel = () => {
    setShowWarning(false);
    onClose();
  };

  return (
    <>
      {/* Warning Modal */}
      <Modal open={showWarning && isOpen} onOpenChange={setShowWarning}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle className="flex items-center gap-2 text-amber-500">
              <AlertTriangle className="h-5 w-5" />
              Edit Historical Record?
            </ModalTitle>
            <ModalDescription>
              You are about to edit a completed job record. Changing these details (like odometer or date) usually isn't recommended as it alters the vehicle's history.
              <br /><br />
              Are you sure you want to proceed?
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
            <Button onClick={handleContinueEditing} className="bg-warning hover:bg-warning/90">
              I understand, edit anyway
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Drawer (Right Sheet) */}
      <Drawer direction="right" open={isOpen && !showWarning} onOpenChange={(open) => !open && onClose()}>
        <DrawerPortal>
            <DrawerOverlay className="fixed inset-0 bg-black/40" />
            <DrawerContent className="bg-background flex flex-col fixed bottom-0 right-0 h-full w-full sm:max-w-lg mt-0 border-l rounded-none shadow-xl outline-none z-50 overflow-hidden">
                <DrawerHeader className="border-b px-6 py-4 bg-muted/10">
                    <div className="flex items-center justify-between">
                        <DrawerTitle>Edit Job Record</DrawerTitle>
                        <DrawerClose asChild>
                            <button className="rounded-full p-2 hover:bg-muted transition-colors">
                            <span className="sr-only">Close</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            </button>
                        </DrawerClose>
                    </div>
                    <DrawerDescription>
                        Update the details of this completed job.
                    </DrawerDescription>
                </DrawerHeader>

                <ScrollArea className="flex-1">
                    <div className="p-6">
                        <form id="edit-job-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            
                            <div className="space-y-2">
                                <Label htmlFor="title">Job Title</Label>
                                <Input id="title" {...register('title')} />
                                {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="date_completed">Date Completed</Label>
                                <Input type="date" id="date_completed" {...register('date_completed')} />
                                {errors.date_completed && <p className="text-sm text-destructive">{errors.date_completed.message}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="odometer">Odometer (mi)</Label>
                                    <Input type="number" id="odometer" {...register('odometer')} />
                                    {errors.odometer && <p className="text-sm text-destructive">{errors.odometer.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="cost_total">Total Cost ($)</Label>
                                    <Input type="number" step="0.01" id="cost_total" {...register('cost_total')} />
                                    {errors.cost_total && <p className="text-sm text-destructive">{errors.cost_total.message}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea 
                                    id="notes" 
                                    placeholder="Add details about the work performed..." 
                                    className="min-h-[100px]"
                                    {...register('notes')} 
                                />
                                {errors.notes && <p className="text-sm text-destructive">{errors.notes.message}</p>}
                            </div>
                        </form>
                    </div>
                </ScrollArea>

                <DrawerFooter className="border-t bg-muted/10 px-6 py-4">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
                    Cancel
                    </Button>
                    <Button type="submit" form="edit-job-form" disabled={isSubmitting} className="gap-2">
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save Changes
                    </Button>
                </DrawerFooter>
            </DrawerContent>
        </DrawerPortal>
      </Drawer>
    </>
  );
}
