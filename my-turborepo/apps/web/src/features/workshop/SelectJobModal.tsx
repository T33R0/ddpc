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
    onSelectJob: (jobId: string, qty: number) => void;
    isPending: boolean;
}

export function SelectJobModal({ isOpen, onClose, activeJobs, plannedJobs, onSelectJob, isPending, part }: SelectJobModalProps & { part: any | null }) {
    const [step, setStep] = React.useState<'select-job' | 'select-qty'>('select-job');
    const [selectedJobId, setSelectedJobId] = React.useState<string | null>(null);
    const [quantity, setQuantity] = React.useState<number>(1);

    // Reset state when modal opens/closes
    React.useEffect(() => {
        if (!isOpen) {
            setStep('select-job');
            setSelectedJobId(null);
            setQuantity(1);
        }
    }, [isOpen]);

    const handleJobSelect = (jobId: string) => {
        if (part && part.quantity && part.quantity > 1) {
            setSelectedJobId(jobId);
            setStep('select-qty');
        } else {
            onSelectJob(jobId, 1);
        }
    };

    const handleConfirmQty = () => {
        if (selectedJobId) {
            onSelectJob(selectedJobId, quantity);
        }
    };

    return (
        <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <ModalContent className="sm:max-w-lg p-0">
                <ModalHeader>
                    <ModalTitle className="flex items-center gap-2">
                        {step === 'select-job' ? 'Add Part to Job' : 'Select Quantity'}
                    </ModalTitle>
                    <ModalDescription>
                        {step === 'select-job' ? 'Select a job to link this part to.' : `How many ${part?.name} to use?`}
                    </ModalDescription>
                </ModalHeader>

                <div className="p-6 pt-2">
                    {step === 'select-job' ? (
                        <div className="grid gap-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-2">Active Jobs</p>
                            {activeJobs.length === 0 && <p className="text-sm text-muted-foreground italic pl-2">No active jobs</p>}
                            {activeJobs.map(job => (
                                <Button key={job.id} variant="outline" className="justify-start h-auto py-3 bg-card hover:bg-muted" onClick={() => handleJobSelect(job.id)} disabled={isPending}>
                                    <Wrench className="w-4 h-4 mr-2 text-primary" />
                                    <div className="flex flex-col items-start">
                                        <span className="font-medium">{job.title}</span>
                                    </div>
                                </Button>
                            ))}

                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4">Planned Jobs</p>
                            {plannedJobs.length === 0 && <p className="text-sm text-muted-foreground italic pl-2">No planned jobs</p>}
                            {plannedJobs.map(job => (
                                <Button key={job.id} variant="outline" className="justify-start h-auto py-3 bg-card hover:bg-muted" onClick={() => handleJobSelect(job.id)} disabled={isPending}>
                                    <ClipboardList className="w-4 h-4 mr-2 text-muted-foreground" />
                                    <div className="flex flex-col items-start">
                                        <span className="font-medium">{job.title}</span>
                                    </div>
                                </Button>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Quantity (Available: {part?.quantity})</label>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</Button>
                                    <div className="w-16 text-center font-mono text-lg">{quantity}</div>
                                    <Button variant="outline" size="icon" onClick={() => setQuantity(Math.min(part?.quantity || 1, quantity + 1))}>+</Button>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max={part?.quantity || 1}
                                    value={quantity}
                                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                                    className="w-full"
                                />
                            </div>
                            <Button className="w-full" onClick={handleConfirmQty} disabled={isPending}>
                                Confirm Usage
                            </Button>
                        </div>
                    )}
                </div>

                <ModalFooter className="p-4 bg-muted/20">
                    <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
