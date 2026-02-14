'use client'

import React, { useState, useEffect } from 'react'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@repo/ui/modal'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Package, Loader2 } from 'lucide-react'
import { PartSlot, PartFormData } from '../types'
import { addPartToVehicle, installComplexPart, updatePartInstallation } from '../actions'
import { useRouter } from 'next/navigation'
import { toast } from '@repo/ui/use-toast'
import { BasePartFields } from './forms/BasePartFields'
import { PartTypeSelector } from './forms/PartTypeSelector'
import { getFieldsComponentForType } from './forms/type-specific'
import { VehicleInstalledComponent } from '../types'
import { format } from 'date-fns'

interface AddPartModalProps {
  isOpen: boolean
  onClose: () => void
  slot: PartSlot | null
  vehicleId: string
  defaultCategory?: string
  onSuccess?: (newPartId?: string) => void
  existingPart?: VehicleInstalledComponent | null // For installing/converting existing parts
}

export const AddPartModal = ({ isOpen, onClose, slot, vehicleId, defaultCategory, onSuccess, existingPart }: AddPartModalProps) => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'single' | 'kit'>('single')

  // Determine initial part type
  const getInitialPartType = () => {
    if (existingPart?.category === 'tires' || (slot && slot.name.toLowerCase().includes('tire'))) return 'tires'
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
    partType: 'default',
  })

  // Dynamic Specs State
  const [specs, setSpecs] = useState<Record<string, any>>({})

  // Kit State
  type HardwareItem = { id: string; name: string; qty: number }
  type ChildPartItem = { id: string; name: string; partNumber: string; qty: number; hardware: HardwareItem[] }
  
  const [childParts, setChildParts] = useState<ChildPartItem[]>([])

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (existingPart) {
        // Pre-fill from existing part
        setFormData({
          partName: existingPart.name,
          category: existingPart.category || defaultCategory || '',
          variant: existingPart.variant || '',
          partNumber: existingPart.part_number || '',
          vendorLink: existingPart.purchase_url || '',
          installedDate: existingPart.installed_at ? format(new Date(existingPart.installed_at), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
          installedMileage: existingPart.install_miles?.toString() || '',
          purchaseCost: existingPart.purchase_price?.toString() || '',
          customLifespanMiles: existingPart.lifespan_miles?.toString() || '',
          customLifespanMonths: existingPart.lifespan_months?.toString() || '',
          partType: getInitialPartType(),
        })
        setSpecs(existingPart.specs || {})
      } else {
        // Fresh start
        setFormData({
          partName: '',
          category: defaultCategory || '',
          variant: '',
          partNumber: '',
          vendorLink: '',
          installedDate: format(new Date(), 'yyyy-MM-dd'),
          installedMileage: '',
          purchaseCost: '',
          customLifespanMiles: '',
          customLifespanMonths: '',
          partType: getInitialPartType(),
        })
        setSpecs({})
      }
      setChildParts([])
      setMode('single')
      setError(null)
    }
  }, [isOpen, defaultCategory, slot, existingPart])

  const handleInputChange = (field: keyof PartFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError(null)
  }

  const handleSpecChange = (key: string, value: any) => {
    setSpecs(prev => ({ ...prev, [key]: value }))
  }

  // Kit Management Helpers
  const addChildPart = () => {
    setChildParts(prev => [...prev, { 
      id: crypto.randomUUID(), 
      name: '', 
      partNumber: '', 
      qty: 1, 
      hardware: [] 
    }])
  }

  const updateChildPart = (id: string, field: keyof ChildPartItem, value: any) => {
    setChildParts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))
  }

  const removeChildPart = (id: string) => {
    setChildParts(prev => prev.filter(p => p.id !== id))
  }

  const addHardware = (partId: string) => {
    setChildParts(prev => prev.map(p => {
      if (p.id !== partId) return p
      return {
        ...p,
        hardware: [...p.hardware, { id: crypto.randomUUID(), name: 'Mounting Hardware', qty: 1 }]
      }
    }))
  }

  const updateHardware = (partId: string, hwId: string, field: keyof HardwareItem, value: any) => {
    setChildParts(prev => prev.map(p => {
      if (p.id !== partId) return p
      return {
        ...p,
        hardware: p.hardware.map(h => h.id === hwId ? { ...h, [field]: value } : h)
      }
    }))
  }

  const removeHardware = (partId: string, hwId: string) => {
    setChildParts(prev => prev.map(p => {
      if (p.id !== partId) return p
      return {
        ...p,
        hardware: p.hardware.filter(h => h.id !== hwId)
      }
    }))
  }

  const handleSubmit = async (actionType: 'plan' | 'install') => {
    if (!formData.partName.trim()) {
      setError("Part Name is required")
      return
    }

    // Numeric validation — no negative values
    const mileage = formData.installedMileage ? parseInt(formData.installedMileage, 10) : null
    const cost = formData.purchaseCost ? parseFloat(formData.purchaseCost) : null
    const lifespanMi = formData.customLifespanMiles ? parseInt(formData.customLifespanMiles, 10) : null
    const lifespanMo = formData.customLifespanMonths ? parseInt(formData.customLifespanMonths, 10) : null

    if (mileage !== null && mileage < 0) {
      setError("Installed mileage cannot be negative")
      return
    }
    if (cost !== null && cost < 0) {
      setError("Purchase cost cannot be negative")
      return
    }
    if (lifespanMi !== null && lifespanMi <= 0) {
      setError("Lifespan miles must be greater than zero")
      return
    }
    if (lifespanMo !== null && lifespanMo <= 0) {
      setError("Lifespan months must be greater than zero")
      return
    }

    // Date validation — no future install dates for installed parts
    if (actionType === 'install' && formData.installedDate) {
      const installDate = new Date(formData.installedDate)
      const today = new Date()
      today.setHours(23, 59, 59, 999) // Allow today
      if (installDate > today) {
        setError("Install date cannot be in the future")
        return
      }
    }

    setLoading(true)
    setError(null)

    try {
      // Merge acquisitionType into specs for persistence
      const mergedSpecs = {
        ...specs,
        ...(formData.acquisitionType && formData.acquisitionType !== 'purchase'
          ? { acquisition_type: formData.acquisitionType }
          : {}),
      }

      if (mode === 'kit' && actionType === 'install') {
        const result = await installComplexPart(
          vehicleId,
          {
            name: formData.partName,
            partNumber: formData.partNumber || undefined,
            vendorLink: formData.vendorLink || undefined,
            installedDate: formData.installedDate || undefined,
            installedMileage: formData.installedMileage ? parseInt(formData.installedMileage, 10) : undefined,
            purchaseCost: formData.purchaseCost ? parseFloat(formData.purchaseCost) : undefined,
            category: formData.category || undefined,
            lifespanMiles: formData.customLifespanMiles ? parseInt(formData.customLifespanMiles, 10) : undefined,
            lifespanMonths: formData.customLifespanMonths ? parseInt(formData.customLifespanMonths, 10) : undefined,
            specs: Object.keys(mergedSpecs).length > 0 ? mergedSpecs : undefined,
          },
          childParts.map(p => ({
            name: p.name,
            partNumber: p.partNumber,
            qty: p.qty,
            hardware: p.hardware.map(h => ({ name: h.name, qty: h.qty }))
          })),
          existingPart?.id // Pass existing ID if converting
        )

        if ('error' in result) {
          setError(result.error)
        } else {
          toast({ title: "Kit Installed", description: `Successfully installed ${formData.partName} and its components.` })
          if (onSuccess) {
            onSuccess((result as any).id)
          } else {
            router.refresh()
          }
          onClose()
        }
      } else {
        // Single Part Flow
        const status = actionType === 'plan' ? 'planned' : 'installed'

        if (existingPart && actionType === 'install') {
          // UPDATE existing part to installed
           const result = await updatePartInstallation(existingPart.id, vehicleId, {
            partName: formData.partName,
            partNumber: formData.partNumber || undefined,
            variant: formData.variant || undefined,
            vendorLink: formData.vendorLink || undefined,
            installedDate: formData.installedDate || undefined,
            installedMileage: formData.installedMileage ? parseInt(formData.installedMileage, 10) : undefined,
            purchaseCost: formData.purchaseCost ? parseFloat(formData.purchaseCost) : undefined,
            customLifespanMiles: formData.customLifespanMiles ? parseInt(formData.customLifespanMiles, 10) : undefined,
            customLifespanMonths: formData.customLifespanMonths ? parseInt(formData.customLifespanMonths, 10) : undefined,
            category: formData.category || undefined,
            status: 'installed',
            specs: Object.keys(mergedSpecs).length > 0 ? mergedSpecs : undefined,
          })

          if ('error' in result) {
            setError(result.error)
          } else {
            toast({ title: "Part Installed", description: `Successfully installed ${formData.partName}.` })
            onSuccess ? onSuccess() : router.refresh()
            onClose()
          }
        } else {
          // Create NEW part
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
            specs: Object.keys(mergedSpecs).length > 0 ? mergedSpecs : undefined,
          })

          if ('error' in result) {
            setError(result.error)
          } else {
            toast({
              title: actionType === 'plan' ? "Part Planned" : "Part Installed",
              description: `Successfully added ${formData.partName}.`,
            })
            onSuccess ? onSuccess() : router.refresh()
            onClose()
          }
        }
      }
    } catch (err) {
      console.error('Error adding part:', err)
      setError('Failed to add part. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const TypeSpecificFields = getFieldsComponentForType(formData.partType || 'default')

  return (
    <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalContent className="sm:max-w-xl p-0 max-h-[90vh] flex flex-col">
        <ModalHeader className="flex-none pb-0">
          <ModalTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {mode === 'kit' 
              ? (existingPart ? 'Decompose Kit / Bundle' : 'Install Kit / Bundle')
              : (existingPart ? 'Install Part' : (slot ? `Add Part: ${slot.name}` : 'Add New Part'))
            }
          </ModalTitle>
          <ModalDescription>
            {mode === 'kit' 
              ? 'Define a kit and its individual components.' 
              : 'Record installation details for this part.'}
          </ModalDescription>
          
          {/* Mode Switcher */}
          <div className="flex gap-2 p-1 bg-muted/50 rounded-lg w-fit mt-2">
            <button 
              onClick={() => setMode('single')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${mode === 'single' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Single Part
            </button>
            <button 
              onClick={() => setMode('kit')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${mode === 'kit' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Kit / Bundle
            </button>
          </div>
        </ModalHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            {error && (
              <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-3">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}

            {/* Main Fields (Shared) */}
            <BasePartFields 
              formData={formData}
              onFieldChange={handleInputChange}
              slot={slot}
            />

            {/* Kit Contents Section */}
            {mode === 'kit' && (
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Kit Contents</h3>
                  <Button size="sm" variant="outline" onClick={addChildPart} type="button">
                    + Add Component
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {childParts.map((part, idx) => (
                    <div key={part.id} className="border rounded-lg p-3 bg-muted/10 space-y-3">
                      <div className="flex gap-2">
                         <div className="flex-1 space-y-1">
                           <Label className="text-xs text-muted-foreground">Component Name</Label>
                           <Input 
                             value={part.name} 
                             onChange={e => updateChildPart(part.id, 'name', e.target.value)}
                             placeholder="e.g. Front Left Coilover"
                             className="h-8 text-sm"
                           />
                         </div>
                         <div className="w-24 space-y-1">
                           <Label className="text-xs text-muted-foreground">Qty</Label>
                           <Input 
                             type="number"
                             value={part.qty} 
                             onChange={e => updateChildPart(part.id, 'qty', parseInt(e.target.value))}
                             className="h-8 text-sm"
                           />
                         </div>
                         <Button variant="ghost" size="icon" className="h-8 w-8 mt-6 text-destructive" onClick={() => removeChildPart(part.id)}>
                           <Package className="w-4 h-4" /> {/* Fallback icon, logic implies delete */}
                         </Button>
                      </div>

                      {/* Hardware for this part */}
                      <div className="pl-4 border-l-2 border-muted space-y-2">
                        <div className="flex items-center gap-2">
                           <Label className="text-[10px] uppercase text-muted-foreground font-semibold">Attached Hardware</Label>
                           <button onClick={() => addHardware(part.id)} className="text-[10px] text-primary hover:underline">+ Add Bolt/Nut</button>
                        </div>
                        {part.hardware.map(hw => (
                          <div key={hw.id} className="flex gap-2 items-center">
                            <Input 
                              value={hw.name} 
                              onChange={e => updateHardware(part.id, hw.id, 'name', e.target.value)}
                              placeholder="e.g. M12 Bolt"
                              className="h-7 text-xs flex-1"
                            />
                            <Input 
                              type="number"
                              value={hw.qty} 
                              onChange={e => updateHardware(part.id, hw.id, 'qty', parseInt(e.target.value))}
                              className="h-7 text-xs w-16"
                            />
                            <button onClick={() => removeHardware(part.id, hw.id)} className="text-destructive hover:text-destructive/80">
                               &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {childParts.length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                      No components added to this kit yet.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Existing Spec Fields (Single Mode only) */}
            {mode === 'single' && !slot && (
              <PartTypeSelector 
                value={formData.partType || 'default'}
                onChange={(val) => handleInputChange('partType', val)}
              />
            )}

            {mode === 'single' && (
              <React.Fragment>
                <TypeSpecificFields data={specs} onChange={handleSpecChange} />
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
                              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
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
              </React.Fragment>
            )}

          </div>
        </div>

        <ModalFooter className="flex-none gap-2 pt-4 px-6 pb-6 bg-background border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          {!existingPart && slot && mode === 'single' && (
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
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (mode === 'kit' ? 'Install Kit' : (existingPart ? 'Install Part' : 'Add Installed Part'))}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
