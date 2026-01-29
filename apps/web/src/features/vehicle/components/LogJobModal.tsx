'use client'

import React, { useState, useEffect } from 'react'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@repo/ui/modal'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Textarea } from '@repo/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { logJobAction } from '../actions'
import { toast } from '@repo/ui/use-toast'
import { Briefcase } from 'lucide-react'

const JOB_TYPES = [
    { value: 'service', label: 'Service' },
    { value: 'mod', label: 'Modification' },
    { value: 'repair', label: 'Repair' },
    { value: 'inspection', label: 'Inspection' },
]

interface LogJobModalProps {
    isOpen: boolean;
    onClose: () => void;
    vehicleId: string;
    currentOdometer: number;
}

interface JobFormData {
    type: string
    title: string
    date: string
    odometer: string
    cost: string
    vendor: string
    notes: string
}

export function LogJobModal({ isOpen, onClose, vehicleId, currentOdometer }: LogJobModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formData, setFormData] = useState<JobFormData>({
        type: 'service',
        title: '',
        date: new Date().toISOString().split('T')[0] || '',
        odometer: currentOdometer?.toString() || '',
        cost: '',
        vendor: '',
        notes: ''
    })

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setFormData({
                type: 'service',
                title: '',
                date: new Date().toISOString().split('T')[0] || '',
                odometer: currentOdometer?.toString() || '',
                cost: '',
                vendor: '',
                notes: ''
            })
            setError(null)
        }
    }, [isOpen, currentOdometer])

    const handleInputChange = (field: keyof JobFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        if (error) setError(null)
    }

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault()
        setIsSubmitting(true)
        setError(null)

        try {
            // Create FormData object to match expected server action input
            const submitData = new FormData()
            submitData.append('vehicleId', vehicleId)
            submitData.append('type', formData.type)
            submitData.append('title', formData.title)
            submitData.append('date', formData.date)
            submitData.append('odometer', formData.odometer)
            submitData.append('cost', formData.cost)
            submitData.append('vendor', formData.vendor)
            submitData.append('notes', formData.notes)

            const result = await logJobAction(submitData)

            if (result.success) {
                toast({
                    title: "Job Logged",
                    description: "The job has been successfully recorded.",
                })
                onClose()
            } else {
                console.error(result.error)
                setError(result.error || "Failed to log job. Please try again.")
            }
        } catch (err) {
            setError('An unexpected error occurred')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <ModalContent className="sm:max-w-lg p-0">
                <ModalHeader>
                    <ModalTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5" />
                        Log Job
                    </ModalTitle>
                    <ModalDescription>
                        Record a service, repair, or modification for this vehicle.
                    </ModalDescription>
                </ModalHeader>

                <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
                    {error && (
                        <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-3">
                            <p className="text-destructive text-sm">{error}</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="type">Job Type *</Label>
                        <Select
                            value={formData.type}
                            onValueChange={(value) => handleInputChange('type', value)}
                        >
                            <SelectTrigger id="type">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                {JOB_TYPES.map(type => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            placeholder="e.g. Oil Change"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="date">Date *</Label>
                        <Input
                            id="date"
                            type="date"
                            value={formData.date}
                            onChange={(e) => handleInputChange('date', e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="odometer">Odometer (miles) *</Label>
                        <Input
                            id="odometer"
                            type="number"
                            value={formData.odometer}
                            onChange={(e) => handleInputChange('odometer', e.target.value)}
                            placeholder="e.g. 60500"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="cost">Cost ($) *</Label>
                        <Input
                            id="cost"
                            type="number"
                            step="0.01"
                            value={formData.cost}
                            onChange={(e) => handleInputChange('cost', e.target.value)}
                            placeholder="0.00"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="vendor">Vendor/Shop *</Label>
                        <Input
                            id="vendor"
                            value={formData.vendor}
                            onChange={(e) => handleInputChange('vendor', e.target.value)}
                            placeholder="e.g. DIY or Shop Name"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => handleInputChange('notes', e.target.value)}
                            placeholder="Details about parts used, observations, etc."
                            className="resize-none"
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
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : 'Save Job'}
                        </Button>
                    </ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    )
}
