'use client';

import React from 'react';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@repo/ui/modal';
import { Button } from '@repo/ui/button';
import { Wrench, ClipboardList } from 'lucide-react';
import { Job } from './types';

interface SelectJobModalProps {
    isOpen: boolean;
    onClose: () => void;
    activeJobs: Job[];
    plannedJobs: Job[];
    onSelectJob: (jobId: string) => void;
    isPending: boolean;
}

export function SelectJobModal({ isOpen, onClose, activeJobs, plannedJobs, onSelectJob, isPending }: SelectJobModalProps) {
    return (
        <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <ModalContent className="sm:max-w-lg p-0">
                <ModalHeader>
                    <ModalTitle className="flex items-center gap-2">
                        Add Part to Job
                    </ModalTitle>
                    <ModalDescription>
                        Select a job to link this part to.
                    </ModalDescription>
                </ModalHeader>

                <div className="p-6 pt-2 grid gap-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-2">Active Jobs</p>
                    {activeJobs.length === 0 && <p className="text-sm text-muted-foreground italic pl-2">No active jobs</p>}
                    {activeJobs.map(job => (
                        <Button key={job.id} variant="outline" className="justify-start h-auto py-3 bg-card hover:bg-muted" onClick={() => onSelectJob(job.id)} disabled={isPending}>
                            <Wrench className="w-4 h-4 mr-2 text-primary" />
                            <div className="flex flex-col items-start">
                                <span className="font-medium">{job.title}</span>
                            </div>
                        </Button>
                    ))}

                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4">Planned Jobs</p>
                    {plannedJobs.length === 0 && <p className="text-sm text-muted-foreground italic pl-2">No planned jobs</p>}
                    {plannedJobs.map(job => (
                        <Button key={job.id} variant="outline" className="justify-start h-auto py-3 bg-card hover:bg-muted" onClick={() => onSelectJob(job.id)} disabled={isPending}>
                            <ClipboardList className="w-4 h-4 mr-2 text-muted-foreground" />
                            <div className="flex flex-col items-start">
                                <span className="font-medium">{job.title}</span>
                            </div>
                        </Button>
                    ))}
                </div>

                <ModalFooter className="p-4 bg-muted/20">
                    <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
