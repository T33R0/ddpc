'use client'

import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { Button } from '@repo/ui/button'
import { Plus, CheckCircle2, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface PlannedServiceLog {
  id: string
  event_date: string
  odometer: number | null
  service_item_id: string | null
  notes?: string | null
  service_provider?: string | null
  cost?: number | null
  service_item?: {
    id: string
    name: string
  }
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

interface ServicePlanViewProps {
  vehicleId: string
  onMarkComplete: (log: PlannedServiceLog) => void
  onAddToPlan: (serviceItemId: string) => void
}

export interface ServicePlanViewRef {
  refresh: () => void
}

export const ServicePlanView = forwardRef<ServicePlanViewRef, ServicePlanViewProps>(
  ({ vehicleId, onMarkComplete, onAddToPlan }, ref) => {
  const router = useRouter()
  const params = useParams()
  const vehicleSlug = params.id as string
  const [plannedLogs, setPlannedLogs] = useState<PlannedServiceLog[]>([])
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([])
  const [serviceItemsByCategory, setServiceItemsByCategory] = useState<Record<string, ServiceItem[]>>({})
  const [isLoadingPlanned, setIsLoadingPlanned] = useState(false)
  const [isLoadingChecklist, setIsLoadingChecklist] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  // Default all categories to collapsed
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(() => {
    // We'll initialize this after categories are loaded
    return new Set()
  })

  const fetchPlannedLogs = async () => {
    setIsLoadingPlanned(true)
    try {
      const { data, error } = await supabase
        .from('maintenance_log')
        .select(`
          id,
          event_date,
          odometer,
          service_item_id,
          service_item:service_items (
            id,
            name
          )
        `)
        .eq('user_vehicle_id', vehicleId)
        .eq('status', 'Plan')
        .order('event_date', { ascending: true })

      if (error) throw error

      // Transform the data to match the interface
      // PostgREST returns service_item as an array, but we need a single object
      const transformedData = (data || []).map((log: any) => ({
        ...log,
        service_item: Array.isArray(log.service_item) 
          ? log.service_item[0] || null 
          : log.service_item || null
      })) as PlannedServiceLog[]

      setPlannedLogs(transformedData)
    } catch (err) {
      console.error('Error fetching planned logs:', err)
    } finally {
      setIsLoadingPlanned(false)
    }
  }

  // Expose refresh function to parent
  useImperativeHandle(ref, () => ({
    refresh: fetchPlannedLogs
  }))

  // Fetch planned service logs
  useEffect(() => {
    fetchPlannedLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId])

  // Fetch service categories and items for checklist
  useEffect(() => {
    fetchServiceChecklist()
  }, [])

  const fetchServiceChecklist = async () => {
    setIsLoadingChecklist(true)
    try {
      // Fetch categories
      const { data: categories, error: categoriesError } = await supabase
        .from('service_categories')
        .select('id, name')
        .order('name', { ascending: true })

      if (categoriesError) throw categoriesError

      setServiceCategories(categories || [])
      
      // Default all categories to collapsed
      if (categories && categories.length > 0) {
        setCollapsedCategories(new Set(categories.map(cat => cat.id)))
      }

      // Fetch all service items
      const { data: items, error: itemsError } = await supabase
        .from('service_items')
        .select('id, name, description, category_id')
        .order('name', { ascending: true })

      if (itemsError) throw itemsError

      // Group items by category
      const grouped: Record<string, ServiceItem[]> = {}
      ;(items || []).forEach((item) => {
        if (!grouped[item.category_id]) {
          grouped[item.category_id] = []
        }
        // TypeScript doesn't narrow after the check, so we use non-null assertion
        // since we know it exists after the check above
        grouped[item.category_id]!.push(item)
      })

      setServiceItemsByCategory(grouped)
    } catch (err) {
      console.error('Error fetching service checklist:', err)
    } finally {
      setIsLoadingChecklist(false)
    }
  }

  const handleDeletePlan = async (logId: string) => {
    if (!confirm('Are you sure you want to delete this planned service?')) {
      return
    }

    setDeletingId(logId)
    try {
      const { error } = await supabase
        .from('maintenance_log')
        .delete()
        .eq('id', logId)

      if (error) throw error

      // Refresh the list
      await fetchPlannedLogs()
    } catch (err) {
      console.error('Error deleting planned log:', err)
      alert('Failed to delete planned service. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const formatDueDate = (log: PlannedServiceLog) => {
    if (log.event_date) {
      const date = new Date(log.event_date)
      return date.toLocaleDateString()
    }
    if (log.odometer) {
      return `${log.odometer.toLocaleString()} miles`
    }
    return 'Not specified'
  }

  const handleCardClick = (log: PlannedServiceLog) => {
    if (log.service_item?.name) {
      const jobTitle = encodeURIComponent(log.service_item.name)
      router.push(`/vehicle/${encodeURIComponent(vehicleSlug)}/service/${jobTitle}`)
    }
  }

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  return (
    <div className="space-y-8 mt-4">
      {/* Section 1: Your Active Plan */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Your Active Plan</h2>

        {isLoadingPlanned ? (
          <div className="text-center py-8 text-gray-400">Loading planned services...</div>
        ) : plannedLogs.length === 0 ? (
          <Card className="bg-black/30 backdrop-blur-sm border-white/20">
            <CardContent className="p-6">
              <p className="text-gray-400 text-center">
                You have no active service plans. Use the checklist below to add one.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {plannedLogs.map((log) => (
              <Card
                key={log.id}
                className="bg-black/30 backdrop-blur-sm border-white/20 cursor-pointer transition-all duration-300"
                style={{
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  transition: 'all 0.3s ease-out',
                }}
                onClick={() => handleCardClick(log)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)'
                  e.currentTarget.style.border = '1px solid rgb(132, 204, 22)'
                  e.currentTarget.style.boxShadow = '0 0 30px rgba(132, 204, 22, 0.6)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.3)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-white mb-1">
                        {log.service_item?.name || 'Service Entry'}
                      </h3>
                      <p className="text-sm text-gray-400">
                        Due: {formatDueDate(log)}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                      <Button
                        onClick={() => onMarkComplete(log)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Mark as Completed
                      </Button>
                      <Button
                        onClick={() => handleDeletePlan(log.id)}
                        variant="outline"
                        size="sm"
                        disabled={deletingId === log.id}
                        className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {deletingId === log.id ? 'Deleting...' : 'Delete Plan'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Suggested Service Checklist */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Suggested Service Checklist</h2>

        {isLoadingChecklist ? (
          <div className="text-center py-8 text-gray-400">Loading checklist...</div>
        ) : (
          <div className="space-y-4">
            {serviceCategories.map((category) => {
              const items = serviceItemsByCategory[category.id] || []
              if (items.length === 0) return null

              const isCollapsed = collapsedCategories.has(category.id)

              return (
                <Card
                  key={category.id}
                  className="bg-black/30 backdrop-blur-sm border-white/20"
                >
                  <CardHeader
                    className="cursor-pointer"
                    onClick={() => toggleCategory(category.id)}
                  >
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-white">{category.name}</CardTitle>
                      {isCollapsed ? (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </CardHeader>
                  {!isCollapsed && (
                    <CardContent>
                      <div className="space-y-2">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-center py-2 border-b border-white/10 last:border-0"
                          >
                            <span className="text-gray-300">{item.name}</span>
                            <Button
                              onClick={() => onAddToPlan(item.id)}
                              variant="outline"
                              size="sm"
                              className="border-white/20 text-gray-300 hover:bg-black/40 hover:border-white/30"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
})

ServicePlanView.displayName = 'ServicePlanView'

