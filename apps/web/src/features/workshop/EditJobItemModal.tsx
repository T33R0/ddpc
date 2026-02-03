'use client';

import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter } from '@repo/ui/modal';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui/label';
import { Loader2, Pencil } from 'lucide-react';

export type EditItemType = 'tool' | 'spec' | 'step';

export interface EditItemData {
    id: string;
    // For tools
    name?: string;
    // For specs
    item?: string;
    value?: string;
    // For steps
    instruction?: string;
}

interface EditJobItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: EditItemType;
    initialData: EditItemData | null;
    onSave: (id: string, data: Partial<EditItemData>) => Promise<void>;
}

export function EditJobItemModal({ isOpen, onClose, type, initialData, onSave }: EditJobItemModalProps) {
    const [formData, setFormData] = useState<Partial<EditItemData>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData({});
        }
    }, [initialData, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!initialData?.id) return;

        setIsSubmitting(true);
        try {
            await onSave(initialData.id, formData);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getTitle = () => {
        switch (type) {
            case 'tool': return 'Edit Tool';
            case 'spec': return 'Edit Specification';
            case 'step': return 'Edit Plan Step';
            default: return 'Edit Item';
        }
    };

    if (!isOpen || !initialData) return null;

    return (
        <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <ModalContent className="sm:max-w-md p-0">
                <ModalHeader>
                    <ModalTitle className="flex items-center gap-2">
                        <Pencil className="h-4 w-4" />
                        {getTitle()}
                    </ModalTitle>
                </ModalHeader>

                <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
                    {type === 'tool' && (
                        <div className="space-y-2">
                            <Label htmlFor="tool-name">Tool Name</Label>
                            <Input
                                id="tool-name"
                                value={formData.name || ''}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                autoFocus
                            />
                        </div>
                    )}

                    {type === 'spec' && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="spec-item">Item Name</Label>
                                <Input
                                    id="spec-item"
                                    value={formData.item || ''}
                                    onChange={e => setFormData({ ...formData, item: e.target.value })}
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="spec-value">Value</Label>
                                <Input
                                    id="spec-value"
                                    value={formData.value || ''}
                                    onChange={e => setFormData({ ...formData, value: e.target.value })}
                                />
                            </div>
                        </>
                    )}

                    {type === 'step' && (
                        <div className="space-y-2">
                            <Label htmlFor="step-instruction">Instruction</Label>
                            <Input
                                id="step-instruction"
                                value={formData.instruction || ''}
                                onChange={e => setFormData({ ...formData, instruction: e.target.value })}
                                autoFocus
                            />
                        </div>
                    )}

                    <ModalFooter className="gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    );
}
