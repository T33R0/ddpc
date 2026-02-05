'use client'

import React, { useState, useEffect } from 'react'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@repo/ui/modal'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Package, Loader2 } from 'lucide-react'
import { PartSlot, PartFormData } from '../types'
import { addPartToVehicle } from '../actions'
import { useRouter } from 'next/navigation'
import { toast } from '@repo/ui/use-toast'
import { BasePartFields } from './forms/BasePartFields'
import { PartTypeSelector } from './forms/PartTypeSelector'
import { getFieldsComponentForType } from './forms/type-specific'

interface AddPartModalProps {
  isOpen: boolean
  onClose: () => void
  slot: PartSlot | null
  vehicleId: string
  defaultCategory?: string
  onSuccess?: () => void
}

export const AddPartModal = ({ isOpen, onClose, slot, vehicleId, defaultCategory, onSuccess }: AddPartModalProps) => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Determine initial part type
  const getInitialPartType = () => {
    if (slot && slot.name.toLowerCase().includes('tire')) return 'tires'
    return 'default'
  }

  // Controlled State
  const [formData, setFormData] = useState<PartFormData>({
    partName: '',
    category: defaultCategory || '',
    variant: '',
    partNumber: '',
    vendorLink: '',
    installedDate: '',
    installedMileage: '',
    purchaseCost: '',
    customLifespanMiles: '',
    customLifespanMonths: '',
    partType: getInitialPartType(),
  })

  // Dynamic Specs State (for both React components and legacy schema)
  const [specs, setSpecs] = useState<Record<string, any>>({})

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        partName: '',
        category: defaultCategory || '',
        variant: '',
        partNumber: '',
        vendorLink: '',
        installedDate: '',
        installedMileage: '',
        purchaseCost: '',
        customLifespanMiles: '',
        customLifespanMonths: '',
        partType: getInitialPartType(),
      })
      setSpecs({})
      setError(null)
    }
  }, [isOpen, defaultCategory, slot])

  const handleInputChange = (field: keyof PartFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError(null)
  }

  const handleSpecChange = (key: string, value: any) => {
    setSpecs(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (actionType: 'plan' | 'install') => {

    // Basic Validation
    if (!formData.partName) {
      setError("Part Name is required")
      return
    }

    setLoading(true)
    setError(null)

    const status = actionType === 'plan' ? 'planned' : 'installed'

    try {
      const result = await addPartToVehicle(vehicleId, slot?.id || null, {
        name: formData.partName,
        partNumber: formData.partNumber || undefined,
        variant: formData.variant || undefined,
        vendorLink: formData.vendorLink || undefined,
        installedDate: formData.installedDate || undefined,
        installedMileage: formData.installedMileage ? parseInt(formData.installedMileage, 10) : undefined,
        purchaseCost: formData.purchaseCost ? parseFloat(formData.purchaseCost) : undefined,
        customLifespanMiles: formData.customLifespanMiles ? parseInt(formData.customLifespanMiles, 10) : undefined,
        customLifespanMonths: formData.customLifespanMonths ? parseInt(formData.customLifespanMonths, 10) : undefined,
        category: formData.category || undefined,
        status,
        specs, // Includes both type-specific data and legacy specs
      })

      if ('error' in result) {
        setError(result.error)
      } else {
        toast({
          title: actionType === 'plan' ? "Part Planned" : "Part Installed",
          description: `Successfully added ${formData.partName}${slot ? ` to ${slot.name}` : ''}.`,
        })

        onClose()
        if (onSuccess) {
          onSuccess()
        } else {
          router.refresh()
        }
      }
    } catch (err) {
      console.error('Error adding part:', err)
      setError('Failed to add part. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Get type specific component
  const TypeSpecificFields = getFieldsComponentForType(formData.partType || 'default')

  return (
    <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalContent className="sm:max-w-lg p-0 max-h-[90vh] flex flex-col">
        <ModalHeader className="flex-none">
          <ModalTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {slot ? `Add Part: ${slot.name}` : 'Add New Part'}
          </ModalTitle>
          <ModalDescription>
            Add a part to track in this component slot.
          </ModalDescription>
        </ModalHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="space-y-4">
            {error && (
              <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-3">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}

            <BasePartFields 
              formData={formData}
              onFieldChange={handleInputChange}
              slot={slot}
            />

            {!slot && (
              <PartTypeSelector 
                value={formData.partType || 'default'}
                onChange={(val) => handleInputChange('partType', val)}
              />
            )}

            {/* Type Specific Fields Registry */}
            <TypeSpecificFields 
              data={specs}
              onChange={handleSpecChange}
            />

            {/* Legacy Dynamic Spec Fields (from DB schema) */}
            {slot?.spec_schema?.fields && slot.spec_schema.fields.length > 0 && (
              <div className="border-t pt-4 space-y-4">
                <h3 className="text-sm font-semibold">Additional Specs</h3>
                <div className="grid grid-cols-2 gap-4">
                  {slot.spec_schema.fields.map((field: any) => (
                    <div key={field.key} className="space-y-2">
                      <Label htmlFor={`spec-${field.key}`}>
                        {field.label || field.key}
                        {field.unit && <span className="text-xs text-muted-foreground ml-1">({field.unit})</span>}
                        {field.required && <span className="text-destructive ml-1">*</span>}
                      </Label>

                      {field.type === 'select' && field.options ? (
                        <Select
                          value={specs[field.key] || ''}
                          onValueChange={(val) => handleSpecChange(field.key, val)}
                          required={field.required}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options.map((opt: string) => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id={`spec-${field.key}`}
                          type={field.type === 'number' ? 'number' : 'text'}
                          value={specs[field.key] || ''}
                          onChange={(e) => handleSpecChange(field.key, field.type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                          required={field.required}
                          step={field.type === 'number' ? 'any' : undefined}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <ModalFooter className="flex-none gap-2 pt-4 px-6 pb-6 bg-background border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          {slot && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleSubmit('plan')}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add as Plan'}
            </Button>
          )}
          <Button
            type="button"
            onClick={() => handleSubmit('install')}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Installed Part'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
