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
import { Briefcase, Plus, X } from 'lucide-react'
import { STANDARD_COMPONENTS, PartCategory } from '@/lib/constants/standard-components'

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

interface PartEntry {
    name: string
    category: PartCategory
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
    const [hasParts, setHasParts] = useState(false)
    const [parts, setParts] = useState<PartEntry[]>([{ name: '', category: 'engine' }])

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
            setHasParts(false)
            setParts([{ name: '', category: 'engine' }])
            setError(null)
        }
    }, [isOpen, currentOdometer])

    const handleInputChange = (field: keyof JobFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        if (error) setError(null)
    }

    const handlePartChange = (index: number, field: 'name' | 'category', value: string) => {
        setParts(prev => {
            const updated = [...prev]
            const currentPart = updated[index]
            if (!currentPart) return updated
            
            if (field === 'name') {
                updated[index] = { ...currentPart, name: value }
            } else {
                updated[index] = { ...currentPart, category: value as PartCategory }
            }
            return updated
        })
    }

    const addPart = () => {
        setParts(prev => [...prev, { name: '', category: 'engine' }])
    }

    const removePart = (index: number) => {
        setParts(prev => prev.filter((_, i) => i !== index))
    }

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault()
        setIsSubmitting(true)
        setError(null)

        // Validate parts if hasParts is true
        if (hasParts) {
            const invalidParts = parts.filter(p => !p.name.trim())
            if (invalidParts.length > 0) {
                setError('Please fill in all part names or remove empty parts')
                setIsSubmitting(false)
                return
            }
        }

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

            // Add parts data if applicable
            if (hasParts) {
                parts.forEach((part, index) => {
                    submitData.append(`parts[${index}][name]`, part.name)
                    submitData.append(`parts[${index}][category]`, part.category)
                })
            }

            const result = await logJobAction(submitData)

            if (result.success) {
                toast({
                    title: "Job Logged",
                    description: hasParts 
                        ? `Job and ${parts.length} part${parts.length > 1 ? 's' : ''} successfully recorded.`
                        : "The job has been successfully recorded.",
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

                    {/* Parts Section */}
                    <div className="space-y-3 pt-2 border-t border-border">
                        <Label>Any parts for this job?</Label>
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => setHasParts(false)}
                                className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                                    !hasParts
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-background border-input hover:bg-muted'
                                }`}
                            >
                                No
                            </button>
                            <button
                                type="button"
                                onClick={() => setHasParts(true)}
                                className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                                    hasParts
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-background border-input hover:bg-muted'
                                }`}
                            >
                                Yes
                            </button>
                        </div>

                        {hasParts && (
                            <div className="space-y-3 mt-4">
                                {parts.map((part, index) => (
                                    <div key={index} className="p-3 rounded-lg bg-muted/50 border border-border space-y-2">
                                        <div className="flex items-center justify-between mb-2">
                                            <Label className="text-xs font-semibold text-muted-foreground">Part {index + 1}</Label>
                                            {parts.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removePart(index)}
                                                    className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Input
                                                placeholder="Part name (e.g., Bosch Oil Filter)"
                                                value={part.name}
                                                onChange={(e) => handlePartChange(index, 'name', e.target.value)}
                                                className="bg-background"
                                            />
                                            <Select
                                                value={part.category}
                                                onValueChange={(value) => handlePartChange(index, 'category', value as PartCategory)}
                                            >
                                                <SelectTrigger className="bg-background">
                                                    <SelectValue placeholder="Select category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.keys(STANDARD_COMPONENTS).map((category) => (
                                                        <SelectItem key={category} value={category}>
                                                            {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={addPart}
                                    className="w-full border-dashed"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Another Part
                                </Button>
                            </div>
                        )}
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
