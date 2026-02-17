'use client';

import React, { useState, useTransition } from 'react';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@repo/ui/modal';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui/label';
import { Badge } from '@repo/ui/badge';
import { Checkbox } from '@repo/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select';
import { Plus, Trash2, Package, Wrench, SplitSquareVertical } from 'lucide-react';
import { VehicleInstalledComponent, Order } from '@/features/parts/types';
import { decomposeDeliveredOrder } from '../actions';
import { toast } from 'react-hot-toast';

interface DecomposeChild {
    name: string;
    category: string;
    partNumber: string;
    quantity: number;
    visibility: 'public' | 'hardware';
    parentIndex: number | null;
    isReusable: boolean;
}

interface DecomposeOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order;
    orderParts: VehicleInstalledComponent[];
    onSuccess: () => void;
}

export function DecomposeOrderModal({ isOpen, onClose, order, orderParts, onSuccess }: DecomposeOrderModalProps) {
    const [isPending, startTransition] = useTransition();
    const [decompositions, setDecompositions] = useState<
        Array<{
            sourceInventoryId: string;
            sourceName: string;
            children: DecomposeChild[];
        }>
    >(() =>
        orderParts.map(part => {
            const decomposition: {
                sourceInventoryId: string;
                sourceName: string;
                children: DecomposeChild[];
            } = {
                sourceInventoryId: part.id,
                sourceName: part.name,
                children: [{
                    name: part.name,
                    category: part.category || '',
                    partNumber: part.part_number || '',
                    quantity: part.quantity || 1,
                    visibility: 'public' as const,
                    parentIndex: null,
                    isReusable: false,
                }],
            };
            return decomposition;
        })
    );

    const addChild = (sourceIdx: number) => {
        setDecompositions(prev => {
            const next = [...prev];
            const source = next[sourceIdx];
            if (source) {
                next[sourceIdx] = {
                    sourceInventoryId: source.sourceInventoryId,
                    sourceName: source.sourceName,
                    children: [...source.children, {
                        name: '',
                        category: '',
                        partNumber: '',
                        quantity: 1,
                        visibility: 'public',
                        parentIndex: null,
                        isReusable: false,
                    }],
                };
            }
            return next;
        });
    };

    const removeChild = (sourceIdx: number, childIdx: number) => {
        setDecompositions(prev => {
            const next = [...prev];
            const source = next[sourceIdx];
            if (source) {
                next[sourceIdx] = {
                    sourceInventoryId: source.sourceInventoryId,
                    sourceName: source.sourceName,
                    children: source.children.filter((_, i) => i !== childIdx),
                };
            }
            return next;
        });
    };

    const updateChild = (sourceIdx: number, childIdx: number, field: keyof DecomposeChild, value: string | number | boolean | null) => {
        setDecompositions(prev => {
            const next = [...prev];
            const source = next[sourceIdx];
            if (source) {
                const children = [...source.children];
                const child = children[childIdx];
                if (child) {
                    children[childIdx] = { ...child, [field]: value };
                    next[sourceIdx] = {
                        sourceInventoryId: source.sourceInventoryId,
                        sourceName: source.sourceName,
                        children,
                    };
                }
            }
            return next;
        });
    };

    const handleSubmit = () => {
        startTransition(async () => {
            const payload = decompositions
                .filter(d => d.children.length > 0)
                .map(d => ({
                    sourceInventoryId: d.sourceInventoryId,
                    children: d.children.map(c => ({
                        name: c.name,
                        category: c.category || undefined,
                        partNumber: c.partNumber || undefined,
                        quantity: c.quantity,
                        visibility: c.visibility,
                        parentIndex: c.parentIndex ?? undefined,
                        isReusable: c.isReusable,
                    })),
                }));

            const result = await decomposeDeliveredOrder(order.id, payload);
            if ('error' in result) {
                toast.error(result.error || 'Failed to decompose order');
            } else {
                toast.success(`Broke down ${payload.length} item(s) into ${result.createdIds.length} parts`);
                onSuccess();
                onClose();
            }
        });
    };

    return (
        <Modal open={isOpen} onOpenChange={onClose}>
            <ModalContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <ModalHeader>
                    <ModalTitle className="flex items-center gap-2">
                        <SplitSquareVertical className="w-5 h-5 text-primary" />
                        Break Down Delivered Order
                    </ModalTitle>
                    <ModalDescription>
                        Split order items into individual installable parts. Tag hardware (bolts, gaskets) and assign them to their parent part.
                    </ModalDescription>
                </ModalHeader>

                <div className="space-y-6 px-6 pb-4">
                    {decompositions.map((source, sIdx) => (
                        <div key={source.sourceInventoryId} className="border border-border rounded-lg p-4 space-y-3">
                            <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium text-sm">{source.sourceName}</span>
                                <Badge variant="outline" className="text-[10px]">Original Item</Badge>
                            </div>

                            {source.children.map((child, cIdx) => (
                                <div key={cIdx} className="ml-4 border-l-2 border-muted pl-3 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Input
                                            placeholder="Part name"
                                            value={child.name}
                                            onChange={e => updateChild(sIdx, cIdx, 'name', e.target.value)}
                                            className="flex-1 h-8 text-sm"
                                        />
                                        <Input
                                            placeholder="Qty"
                                            type="number"
                                            min={1}
                                            value={child.quantity}
                                            onChange={e => updateChild(sIdx, cIdx, 'quantity', parseInt(e.target.value) || 1)}
                                            className="w-16 h-8 text-sm"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => removeChild(sIdx, cIdx)}
                                        >
                                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                        </Button>
                                    </div>

                                    <div className="flex items-center gap-3 text-xs">
                                        <div className="flex items-center gap-1.5">
                                            <Checkbox
                                                id={`hw-${sIdx}-${cIdx}`}
                                                checked={child.visibility === 'hardware'}
                                                onCheckedChange={(checked) => {
                                                    updateChild(sIdx, cIdx, 'visibility', checked ? 'hardware' : 'public');
                                                }}
                                            />
                                            <Label htmlFor={`hw-${sIdx}-${cIdx}`} className="text-xs text-muted-foreground cursor-pointer">
                                                Hardware
                                            </Label>
                                        </div>

                                        {child.visibility === 'hardware' && (
                                            <>
                                                <div className="flex items-center gap-1.5">
                                                    <Checkbox
                                                        id={`reuse-${sIdx}-${cIdx}`}
                                                        checked={child.isReusable}
                                                        onCheckedChange={(checked) => updateChild(sIdx, cIdx, 'isReusable', !!checked)}
                                                    />
                                                    <Label htmlFor={`reuse-${sIdx}-${cIdx}`} className="text-xs text-muted-foreground cursor-pointer">
                                                        Reusable
                                                    </Label>
                                                </div>

                                                <Select
                                                    value={child.parentIndex?.toString() ?? ''}
                                                    onValueChange={(val) => updateChild(sIdx, cIdx, 'parentIndex', val ? parseInt(val) : null)}
                                                >
                                                    <SelectTrigger className="h-7 text-xs w-40">
                                                        <SelectValue placeholder="Attach to..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {source.children
                                                            .map((sibling, sibIdx) => ({ sibling, sibIdx }))
                                                            .filter(({ sibling, sibIdx }) => sibling.visibility === 'public' && sibIdx !== cIdx)
                                                            .map(({ sibling, sibIdx }) => (
                                                                <SelectItem key={sibIdx} value={sibIdx.toString()}>
                                                                    {sibling.name || `Part ${sibIdx + 1}`}
                                                                </SelectItem>
                                                            ))}
                                                    </SelectContent>
                                                </Select>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}

                            <div className="ml-4 flex gap-2">
                                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => addChild(sIdx)}>
                                    <Plus className="w-3 h-3" /> Add Part
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => {
                                    addChild(sIdx);
                                    const sourceItem = decompositions[sIdx];
                                    if (sourceItem) {
                                        const lastIdx = sourceItem.children.length;
                                        // Will be set to hardware on next render via the checkbox
                                        setTimeout(() => updateChild(sIdx, lastIdx, 'visibility', 'hardware'), 0);
                                    }
                                }}>
                                    <Wrench className="w-3 h-3" /> Add Hardware
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                <ModalFooter>
                    <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isPending}>
                        {isPending ? 'Breaking Down...' : 'Confirm Breakdown'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
