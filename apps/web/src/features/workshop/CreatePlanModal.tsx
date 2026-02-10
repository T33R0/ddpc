'use client'

import React, { useState } from 'react'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@repo/ui/modal'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label' // Assuming Label exists, if not I'll just use a label tag or similar standard
import { createJob } from './actions' // Importing actions relative to where this file will be (features/workshop/components) or adjusted path
import { toast } from '@repo/ui/use-toast'
import { ClipboardList, Loader2 } from 'lucide-react'

import { Textarea } from '@repo/ui/textarea'

// Note: I will place this in basic components folder or alongside VehicleWorkshop?
// The file path requested was features/workshop/CreatePlanModal.tsx (or similar in plan)
// I will stick to features/workshop/components/CreatePlanModal.tsx for better org, or features/workshop/CreatePlanModal.tsx if simple.
// Let's go with features/workshop/CreatePlanModal.tsx to match previous patterns if implied, or better yet features/workshop/components/CreatePlanModal.tsx.
// Wait, JobExecutionModal is in features/workshop/JobExecutionModal.tsx. I will put it there for consistency.

interface CreatePlanModalProps {
    isOpen: boolean
    onClose: () => void
    vehicleId: string
    onSuccess: () => void
}

export function CreatePlanModal({ isOpen, onClose, vehicleId, onSuccess }: CreatePlanModalProps) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim()) return

        setIsSubmitting(true)
        try {
            const res = await createJob(vehicleId, title, description)
            if (res.error) {
                toast({
                    title: "Error",
                    description: res.error,
                    variant: "destructive"
                })
            } else {
                toast({
                    title: "Plan Created",
                    description: "Your new plan has been created successfully."
                })
                setTitle('')
                setDescription('')
                onSuccess()
                onClose()
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "An unexpected error occurred.",
                variant: "destructive"
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <ModalContent className="sm:max-w-lg p-0">
                <ModalHeader>
                    <ModalTitle className="flex items-center gap-2">
                        <ClipboardList className="h-5 w-5" />
                        Create New Plan
                    </ModalTitle>
                    <ModalDescription>
                        Start planning a new job/project for this vehicle.
                    </ModalDescription>
                </ModalHeader>

                <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Plan Title</Label>
                        <Input
                            id="title"
                            placeholder="e.g. Brake Service, Suspension Overhaul"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Plan Description (Optional)</Label>
                        <Textarea
                            id="description"
                            placeholder="Describe what needs to be done. E.g. 'Wait for parts to arrive, then replace both front rotors and pads.'"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="resize-none"
                            rows={4}
                        />
                    </div>

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
                            disabled={isSubmitting || !title.trim()}
                        >
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Plan
                        </Button>
                    </ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    )
}
