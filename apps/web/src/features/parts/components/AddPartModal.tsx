'use client'

import React, { useState, useEffect } from 'react'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@repo/ui/modal'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Package, Loader2 } from 'lucide-react'
import { PartSlot } from '../types'
import { addPartToVehicle } from '../actions'
import { useRouter } from 'next/navigation'
import { toast } from '@repo/ui/use-toast'

interface AddPartModalProps {
  isOpen: boolean
  onClose: () => void
  slot: PartSlot | null
  vehicleId: string
  defaultCategory?: string
  onSuccess?: () => void
}

interface PartFormData {
  partName: string
  category: string
  variant: string
  partNumber: string
  vendorLink: string
  installedDate: string
  installedMileage: string
  purchaseCost: string
  customLifespanMiles: string
  customLifespanMonths: string
}

export const AddPartModal = ({ isOpen, onClose, slot, vehicleId, defaultCategory, onSuccess }: AddPartModalProps) => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
  })

  // Dynamic Specs State
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
      })
      setSpecs({})
      setError(null)
    }
  }, [isOpen, defaultCategory])

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
        specs,
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

  return (
    <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalContent className="sm:max-w-lg p-0">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {slot ? `Add Part: ${slot.name}` : 'Add New Part'}
          </ModalTitle>
          <ModalDescription>
            Add a part to track in this component slot.
          </ModalDescription>
        </ModalHeader>

        <div className="px-6 pb-6 space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-3">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="partName">Part Name *</Label>
            <Input
              id="partName"
              value={formData.partName}
              onChange={(e) => handleInputChange('partName', e.target.value)}
              placeholder="e.g. Interstate Battery"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(val) => handleInputChange('category', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="engine">Engine</SelectItem>
                <SelectItem value="suspension">Suspension</SelectItem>
                <SelectItem value="brakes">Braking</SelectItem>
                <SelectItem value="wheels_tires">Wheels & Tires</SelectItem>
                <SelectItem value="interior">Interior</SelectItem>
                <SelectItem value="exterior">Exterior</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="partNumber">Part Number</Label>
              <Input
                id="partNumber"
                value={formData.partNumber}
                onChange={(e) => handleInputChange('partNumber', e.target.value)}
                placeholder="e.g. MTZ-34"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="variant">Variant</Label>
              <Select
                value={formData.variant}
                onValueChange={(val) => handleInputChange('variant', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Variant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stock">Stock</SelectItem>
                  <SelectItem value="upgrade">Upgrade</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendorLink">Vendor Link</Label>
            <Input
              id="vendorLink"
              type="url"
              value={formData.vendorLink}
              onChange={(e) => handleInputChange('vendorLink', e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="installedDate">Date Installed</Label>
              <Input
                id="installedDate"
                type="date"
                value={formData.installedDate}
                onChange={(e) => handleInputChange('installedDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="installedMileage">Mileage Installed</Label>
              <Input
                id="installedMileage"
                type="number"
                inputMode="numeric"
                value={formData.installedMileage}
                onChange={(e) => handleInputChange('installedMileage', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchaseCost">Purchase Cost ($)</Label>
            <Input
              id="purchaseCost"
              type="number"
              step="0.01"
              inputMode="decimal"
              value={formData.purchaseCost}
              onChange={(e) => handleInputChange('purchaseCost', e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="border-t pt-4 space-y-4">
            <h3 className="text-sm font-semibold mb-1">Expected Lifespan</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customLifespanMiles">
                  Miles
                  {slot?.default_lifespan_miles && (
                    <span className="text-xs text-muted-foreground ml-1">
                      (Def: {slot.default_lifespan_miles.toLocaleString()})
                    </span>
                  )}
                </Label>
                <Input
                  id="customLifespanMiles"
                  type="number"
                  inputMode="numeric"
                  value={formData.customLifespanMiles}
                  onChange={(e) => handleInputChange('customLifespanMiles', e.target.value)}
                  placeholder="e.g. 50000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customLifespanMonths">
                  Months
                  {slot?.default_lifespan_months && (
                    <span className="text-xs text-muted-foreground ml-1">
                      (Def: {slot.default_lifespan_months})
                    </span>
                  )}
                </Label>
                <Input
                  id="customLifespanMonths"
                  type="number"
                  inputMode="numeric"
                  value={formData.customLifespanMonths}
                  onChange={(e) => handleInputChange('customLifespanMonths', e.target.value)}
                  placeholder="e.g. 60"
                />
              </div>
            </div>
          </div>

          {/* Dynamic Spec Fields */}
          {slot?.spec_schema?.fields && slot.spec_schema.fields.length > 0 && (
            <div className="border-t pt-4 space-y-4">
              <h3 className="text-sm font-semibold">Specifications</h3>
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

          <ModalFooter className="gap-2 pt-4">
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
        </div>
      </ModalContent>
    </Modal>
  )
}
