'use client';

import React, { useState, useTransition } from 'react';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@repo/ui/modal';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select';
import { Droplets } from 'lucide-react';
import { addFluid } from '../actions';
import type { FluidType } from '../types';
import { toast } from 'react-hot-toast';

const fluidTypes: Array<{ value: FluidType; label: string }> = [
    { value: 'engine_oil', label: 'Engine Oil' },
    { value: 'coolant', label: 'Coolant' },
    { value: 'brake_fluid', label: 'Brake Fluid' },
    { value: 'transmission', label: 'Transmission Fluid' },
    { value: 'differential', label: 'Differential Fluid' },
    { value: 'power_steering', label: 'Power Steering Fluid' },
    { value: 'transfer_case', label: 'Transfer Case Fluid' },
    { value: 'custom', label: 'Custom' },
];

interface AddFluidModalProps {
    isOpen: boolean;
    onClose: () => void;
    vehicleId: string;
    onSuccess: () => void;
}

export function AddFluidModal({ isOpen, onClose, vehicleId, onSuccess }: AddFluidModalProps) {
    const [isPending, startTransition] = useTransition();
    const [name, setName] = useState('');
    const [fluidType, setFluidType] = useState<FluidType>('engine_oil');
    const [specification, setSpecification] = useState('');
    const [capacity, setCapacity] = useState('');
    const [lifespanMiles, setLifespanMiles] = useState('');
    const [lifespanMonths, setLifespanMonths] = useState('');
    const [lastChangedAt, setLastChangedAt] = useState('');
    const [lastChangedMiles, setLastChangedMiles] = useState('');

    const resetForm = () => {
        setName('');
        setFluidType('engine_oil');
        setSpecification('');
        setCapacity('');
        setLifespanMiles('');
        setLifespanMonths('');
        setLastChangedAt('');
        setLastChangedMiles('');
    };

    const handleSubmit = () => {
        if (!name.trim()) {
            toast.error('Fluid name is required');
            return;
        }

        startTransition(async () => {
            const result = await addFluid(vehicleId, {
                name: name.trim(),
                fluidType,
                specification: specification.trim() || undefined,
                capacity: capacity.trim() || undefined,
                lifespanMiles: lifespanMiles ? parseInt(lifespanMiles) : undefined,
                lifespanMonths: lifespanMonths ? parseInt(lifespanMonths) : undefined,
                lastChangedAt: lastChangedAt || undefined,
                lastChangedMiles: lastChangedMiles ? parseInt(lastChangedMiles) : undefined,
            });

            if ('error' in result) {
                toast.error(result.error);
            } else {
                toast.success(`Added ${name}`);
                resetForm();
                onSuccess();
                onClose();
            }
        });
    };

    return (
        <Modal open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <ModalContent className="max-w-md">
                <ModalHeader>
                    <ModalTitle className="flex items-center gap-2">
                        <Droplets className="w-5 h-5 text-primary" />
                        Add Fluid
                    </ModalTitle>
                    <ModalDescription>
                        Track a fluid on your vehicle with replacement intervals.
                    </ModalDescription>
                </ModalHeader>

                <div className="space-y-4 px-6 pb-4">
                    <div className="space-y-2">
                        <Label htmlFor="fluid-name">Name</Label>
                        <Input
                            id="fluid-name"
                            placeholder="e.g. Rear Differential Fluid"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Type</Label>
                        <Select value={fluidType} onValueChange={(v) => setFluidType(v as FluidType)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {fluidTypes.map(t => (
                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="fluid-spec">Specification</Label>
                            <Input
                                id="fluid-spec"
                                placeholder="e.g. 75W-90 GL-5"
                                value={specification}
                                onChange={e => setSpecification(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fluid-capacity">Capacity</Label>
                            <Input
                                id="fluid-capacity"
                                placeholder="e.g. 2.75 quarts"
                                value={capacity}
                                onChange={e => setCapacity(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="fluid-lifespan-miles">Lifespan (miles)</Label>
                            <Input
                                id="fluid-lifespan-miles"
                                type="number"
                                placeholder="e.g. 30000"
                                value={lifespanMiles}
                                onChange={e => setLifespanMiles(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fluid-lifespan-months">Lifespan (months)</Label>
                            <Input
                                id="fluid-lifespan-months"
                                type="number"
                                placeholder="e.g. 24"
                                value={lifespanMonths}
                                onChange={e => setLifespanMonths(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="fluid-last-changed">Last Changed</Label>
                            <Input
                                id="fluid-last-changed"
                                type="date"
                                value={lastChangedAt}
                                onChange={e => setLastChangedAt(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fluid-last-miles">At Mileage</Label>
                            <Input
                                id="fluid-last-miles"
                                type="number"
                                placeholder="e.g. 85000"
                                value={lastChangedMiles}
                                onChange={e => setLastChangedMiles(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <ModalFooter>
                    <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isPending}>
                        {isPending ? 'Adding...' : 'Add Fluid'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
