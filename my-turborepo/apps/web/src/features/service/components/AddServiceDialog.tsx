'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Textarea } from '@repo/ui/textarea'
import { Card, CardContent } from '@repo/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@repo/ui/toggle-group'
import { Plus, Wrench, ArrowLeft } from 'lucide-react'
import { ServiceInterval } from '@repo/types'
import { logPlannedService, logFreeTextService } from '../actions'
import { ServiceLogInputs } from '../schema'
import { supabase } from '@/lib/supabase'

interface PlannedServiceLog {
  id: string
  event_date: string
  odometer: number | null
  service_item_id: string | null
  service_provider?: string | null
  cost?: number | null
  notes?: string | null
}

interface AddServiceDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  planItem?: ServiceInterval | null // Changed from initialData to planItem
  plannedLog?: PlannedServiceLog | null // Pre-fill from planned log
  vehicleId: string
  lockStatusToHistory?: boolean // Lock status to History (for marking complete)
  prefillServiceItemId?: string // Pre-fill with service item ID (for Add to Plan)
  prefillStatus?: 'History' | 'Plan' // Pre-fill status
}

interface ServiceCategory {
  id: string
  name: string
}

interface ServiceItem {
  id: string
  name: string
  description: string | null
  category_id: string
}

interface FormData {
  service_item_id: string
  status: 'History' | 'Plan'
  service_provider: string
  cost: string
  odometer: string
  event_date: string
  notes: string
  plan_item_id?: string | null
}

export function AddServiceDialog({
  isOpen,
  onClose,
  onSuccess,
  planItem,
  plannedLog,
  vehicleId,
  lockStatusToHistory = false,
  prefillServiceItemId,
  prefillStatus = 'History'
}: AddServiceDialogProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([])
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null)
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [isLoadingItems, setIsLoadingItems] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    service_item_id: '',
    status: 'History',
    service_provider: '',
    cost: '',
    odometer: '',
    event_date: new Date().toISOString().split('T')[0]!,
    notes: '',
    plan_item_id: null,
  })

  // Fetch service categories on mount
  useEffect(() => {
    if (isOpen && currentStep === 1 && !prefillServiceItemId && !plannedLog) {
      console.log('Modal opened, fetching service categories...')
      fetchServiceCategories()
    }
  }, [isOpen, currentStep, prefillServiceItemId, plannedLog])

  // Fetch service items when category is selected
  useEffect(() => {
    if (selectedCategory && currentStep === 2) {
      fetchServiceItems(selectedCategory.id)
    }
  }, [selectedCategory, currentStep])

  // Pre-fill form when modal opens with plannedLog or prefillServiceItemId
  useEffect(() => {
    const initialize = async () => {
      if (isOpen) {
        if (plannedLog) {
          setIsInitializing(true)
          try {
            // Pre-fill from planned log (for Mark as Completed)
            setFormData({
              service_item_id: plannedLog.service_item_id || '',
              status: 'History', // Always History when marking complete
              service_provider: plannedLog.service_provider || '',
              cost: plannedLog.cost?.toString() || '',
              odometer: plannedLog.odometer?.toString() || '',
              event_date: plannedLog.event_date ? new Date(plannedLog.event_date).toISOString().split('T')[0]! : new Date().toISOString().split('T')[0]!,
              notes: plannedLog.notes || '',
              plan_item_id: null,
            })
            // Skip to step 2 and fetch the service item's category
            if (plannedLog.service_item_id) {
              await fetchServiceItemAndCategory(plannedLog.service_item_id)
            } else {
              setCurrentStep(2)
            }
          } finally {
            setIsInitializing(false)
          }
        } else if (prefillServiceItemId) {
          setIsInitializing(true)
          try {
            // Pre-fill with service item ID (for Add to Plan)
            setFormData({
              service_item_id: prefillServiceItemId,
              status: prefillStatus,
              service_provider: '',
              cost: '',
              odometer: '',
              event_date: new Date().toISOString().split('T')[0]!,
              notes: '',
              plan_item_id: null,
            })
            // Skip to step 2 and fetch the service item's category
            await fetchServiceItemAndCategory(prefillServiceItemId)
          } finally {
            setIsInitializing(false)
          }
        } else if (planItem) {
          // Pre-populate form for "guided" mode (planned service from service_intervals)
          setFormData({
            service_item_id: '',
            status: 'History',
            service_provider: '',
            cost: '',
            odometer: '',
            event_date: new Date().toISOString().split('T')[0]!,
            notes: planItem.description || '',
            plan_item_id: planItem.id,
          })
          setCurrentStep(1)
        } else {
          // Reset form for "free-text" mode
          setCurrentStep(1)
          setSelectedCategory(null)
          setFormData({
            service_item_id: '',
            status: 'History',
            service_provider: '',
            cost: '',
            odometer: '',
            event_date: new Date().toISOString().split('T')[0]!,
            notes: '',
            plan_item_id: null,
          })
        }
        setError(null)
      } else {
        // Reset when closing
        setCurrentStep(1)
        setSelectedCategory(null)
        setFormData({
          service_item_id: '',
          status: 'History',
          service_provider: '',
          cost: '',
          odometer: '',
          event_date: new Date().toISOString().split('T')[0]!,
          notes: '',
          plan_item_id: null,
        })
        setError(null)
        setIsInitializing(false)
      }
    }

    initialize()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, plannedLog, prefillServiceItemId, prefillStatus, planItem])

  const fetchServiceItemAndCategory = async (serviceItemId: string) => {
    try {
      // Fetch the service item to get its category
      const { data: item, error: itemError } = await supabase
        .from('service_items')
        .select('id, name, category_id, service_categories!inner(id, name)')
        .eq('id', serviceItemId)
        .single()

      if (itemError) throw itemError

      if (item && item.category_id) {
        // Fetch all items for this category
        await fetchServiceItems(item.category_id)
        // Fetch the category separately to get its details
        const { data: categoryData, error: categoryError } = await supabase
          .from('service_categories')
          .select('id, name')
          .eq('id', item.category_id)
          .single()

        if (!categoryError && categoryData) {
          setSelectedCategory(categoryData as ServiceCategory)
          setCurrentStep(2)
        }
      }
    } catch (err) {
      console.error('Error fetching service item:', err)
      setError('Failed to load service item details')
    }
  }

  const fetchServiceCategories = async () => {
    setIsLoadingCategories(true)
    setError(null) // Clear any previous errors
    try {
      const { data, error } = await supabase
        .from('service_categories')
        .select('id, name')
        .order('name', { ascending: true })

      if (error) {
        console.error('Supabase error fetching service categories:', error)
        throw error
      }

      console.log('Fetched service categories:', data)
      setServiceCategories(data || [])

      if (!data || data.length === 0) {
        console.warn('No service categories found in database')
      }
    } catch (err) {
      console.error('Error fetching service categories:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load service categories'
      setError(`Failed to load service categories: ${errorMessage}`)
      setServiceCategories([]) // Ensure empty array on error
    } finally {
      setIsLoadingCategories(false)
    }
  }

  const fetchServiceItems = async (categoryId: string) => {
    setIsLoadingItems(true)
    try {
      const { data, error } = await supabase
        .from('service_items')
        .select('id, name, description, category_id')
        .eq('category_id', categoryId)
        .order('name', { ascending: true })

      if (error) throw error
      setServiceItems(data || [])
    } catch (err) {
      console.error('Error fetching service items:', err)
      setError('Failed to load service items')
    } finally {
      setIsLoadingItems(false)
    }
  }

  const handleCategorySelect = (category: ServiceCategory) => {
    setSelectedCategory(category)
    setCurrentStep(2)
    setError(null)
  }

  const handleBackToStep1 = () => {
    setCurrentStep(1)
    setSelectedCategory(null)
    setServiceItems([])
    setFormData(prev => ({ ...prev, service_item_id: '' }))
    setError(null)
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError(null)
  }

  const handleStatusChange = (value: string) => {
    if (value === 'History' || value === 'Plan') {
      setFormData(prev => ({ ...prev, status: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Validate required fields
      if (!formData.service_item_id) {
        throw new Error('Please select a service job')
      }
      if (!formData.event_date) {
        throw new Error('Date is required')
      }

      // Get the selected service item to use its name as description
      const selectedItem = serviceItems.find(item => item.id === formData.service_item_id)
      if (!selectedItem) {
        throw new Error('Selected service item not found')
      }

      // If we're marking a planned log as complete, update it instead of creating new
      if (plannedLog) {
        const { error: updateError } = await supabase
          .from('maintenance_log')
          .update({
            status: 'History',
            event_date: formData.event_date,
            ...(formData.service_provider?.trim() && { service_provider: formData.service_provider.trim() }),
            ...(formData.cost && formData.cost.trim() && !isNaN(parseFloat(formData.cost)) && { cost: parseFloat(formData.cost) }),
            ...(formData.odometer && formData.odometer.trim() && !isNaN(parseFloat(formData.odometer)) && { odometer: parseFloat(formData.odometer) }),
            ...(formData.notes?.trim() && { notes: formData.notes.trim() }),
          })
          .eq('id', plannedLog.id)

        if (updateError) {
          throw new Error(`Failed to update service log: ${updateError.message}`)
        }
      } else {
        // Prepare the data matching ServiceLogSchema
        const serviceLogData: ServiceLogInputs = {
          user_vehicle_id: vehicleId,
          event_date: formData.event_date,
          ...(formData.service_provider?.trim() && { service_provider: formData.service_provider.trim() }),
          ...(formData.cost && formData.cost.trim() && !isNaN(parseFloat(formData.cost)) && { cost: parseFloat(formData.cost) }),
          ...(formData.odometer && formData.odometer.trim() && !isNaN(parseFloat(formData.odometer)) && { odometer: parseFloat(formData.odometer) }),
          ...(formData.notes?.trim() && { notes: formData.notes.trim() }),
          ...(formData.plan_item_id && formData.plan_item_id.trim() && { plan_item_id: formData.plan_item_id }),
          service_item_id: formData.service_item_id,
          status: formData.status,
        }

        // Call the appropriate action based on whether it's a planned service
        let result
        if (planItem) {
          // "Guided" mode - two-write operation
          result = await logPlannedService(serviceLogData)
        } else {
          // "Free-text" mode - single-write operation
          result = await logFreeTextService(serviceLogData)
        }

        if (result.error) {
          if (result.details && Array.isArray(result.details)) {
            const errorMessages = result.details.map((err: { message?: string; path?: (string | number)[] }) => {
              const field = err.path?.map(String).join('.') || 'field'
              return `${field}: ${err.message || 'Invalid value'}`
            }).join(', ')
            throw new Error(`${result.error} ${errorMessages}`)
          }
          throw new Error(result.error)
        }

        if (!result.success) {
          throw new Error('Failed to log service')
        }
      }

      // Success - reset form and close dialog
      setCurrentStep(1)
      setSelectedCategory(null)
      setFormData({
        service_item_id: '',
        status: 'History',
        service_provider: '',
        cost: '',
        odometer: '',
        event_date: new Date().toISOString().split('T')[0]!,
        notes: '',
        plan_item_id: null,
      })

      onClose()
      onSuccess?.()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0">
        {isInitializing ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-muted-foreground text-sm">Loading service details...</p>
          </div>
        ) : (
          <>
            {/* Step 1: Category Selection */}
            {currentStep === 1 && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    Add Service Entry
                  </DialogTitle>
                  <DialogDescription>
                    What system did you service?
                  </DialogDescription>
                </DialogHeader>

                <div className="px-6 pb-6">
                  {error && (
                    <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-3 mb-4">
                      <p className="text-destructive text-sm">{error}</p>
                    </div>
                  )}

                  {isLoadingCategories ? (
                    <div className="text-center py-8 text-muted-foreground">Loading categories...</div>
                  ) : serviceCategories.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">No service categories found.</p>
                      <p className="text-muted-foreground text-sm">Please ensure service categories are set up in the database.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {serviceCategories.map((category) => (
                        <Card
                          key={category.id}
                          onClick={() => handleCategorySelect(category)}
                          className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          <CardContent className="p-4">
                            <p className="font-medium text-sm">{category.name}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  <DialogFooter className="gap-2 pt-4 mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                    >
                      Cancel
                    </Button>
                  </DialogFooter>
                </div>
              </>
            )}

            {/* Step 2: Job Selection & Form */}
            {currentStep === 2 && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    Log: {selectedCategory?.name || 'Service'}
                  </DialogTitle>
                  <DialogDescription>
                    Select the service job and fill in the details.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
                  {error && (
                    <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-3">
                      <p className="text-destructive text-sm">{error}</p>
                    </div>
                  )}

                  {/* Service Job Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="service_item_id">
                      Service Job *
                    </Label>
                    {isLoadingItems ? (
                      <div className="text-muted-foreground text-sm py-2">Loading jobs...</div>
                    ) : (
                      <select
                        id="service_item_id"
                        value={formData.service_item_id}
                        onChange={(e) => handleInputChange('service_item_id', e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        required
                      >
                        <option value="">Select a service job</option>
                        {serviceItems.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <ToggleGroup
                      type="single"
                      value={formData.status}
                      onValueChange={handleStatusChange}
                      className="justify-start"
                      disabled={lockStatusToHistory}
                    >
                      <ToggleGroupItem
                        value="History"
                        disabled={lockStatusToHistory}
                      >
                        History
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value="Plan"
                        disabled={lockStatusToHistory}
                      >
                        Plan
                      </ToggleGroupItem>
                    </ToggleGroup>
                    {lockStatusToHistory && (
                      <p className="text-xs text-muted-foreground">Status is locked to History when marking a plan as completed.</p>
                    )}
                  </div>

                  {/* Date */}
                  <div className="space-y-2">
                    <Label htmlFor="event_date">
                      {formData.status === 'Plan' ? 'Planned Date' : 'Date'} *
                    </Label>
                    <Input
                      id="event_date"
                      type="date"
                      value={formData.event_date}
                      onChange={(e) => handleInputChange('event_date', e.target.value)}
                      required
                    />
                  </div>

                  {/* Odometer */}
                  <div className="space-y-2">
                    <Label htmlFor="odometer">
                      {formData.status === 'Plan' ? 'Planned Odometer' : 'Odometer'}
                    </Label>
                    <Input
                      id="odometer"
                      type="number"
                      value={formData.odometer}
                      onChange={(e) => handleInputChange('odometer', e.target.value)}
                      placeholder="Current mileage"
                    />
                  </div>

                  {/* Cost */}
                  <div className="space-y-2">
                    <Label htmlFor="cost">
                      Total Cost
                    </Label>
                    <Input
                      id="cost"
                      type="number"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => handleInputChange('cost', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">
                      Notes
                    </Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="e.g., Used Liqui Moly 5W-40, DIY job, Shop: The M Shop..."
                      className="min-h-[80px]"
                    />
                  </div>

                  <DialogFooter className="gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBackToStep1}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        'Saving...'
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Save Log
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

