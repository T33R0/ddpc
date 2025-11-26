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
  } | null
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
  initialPlannedLogs: PlannedServiceLog[]
  initialChecklistCategories: ServiceCategory[]
  initialChecklistItems: ServiceItem[]
}

export interface ServicePlanViewRef {
  refresh: () => void
}

export const ServicePlanView = forwardRef<ServicePlanViewRef, ServicePlanViewProps>(
  ({
    onMarkComplete,
    onAddToPlan,
    initialPlannedLogs,
    initialChecklistCategories,
    initialChecklistItems,
  }, ref) => {
    const router = useRouter()
    const params = useParams()
    const vehicleSlug = params.id as string
    const [plannedLogs, setPlannedLogs] = useState<PlannedServiceLog[]>(initialPlannedLogs)
    const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>(initialChecklistCategories)
    const [serviceItemsByCategory, setServiceItemsByCategory] = useState<Record<string, ServiceItem[]>>({})
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
      () => new Set(initialChecklistCategories.map(cat => cat.id))
    )

    useEffect(() => {
      setPlannedLogs(initialPlannedLogs)
    }, [initialPlannedLogs])

    useEffect(() => {
      setServiceCategories(initialChecklistCategories)
      const grouped: Record<string, ServiceItem[]> = {}
      initialChecklistItems.forEach((item) => {
        if (!grouped[item.category_id]) {
          grouped[item.category_id] = []
        }
        grouped[item.category_id]!.push(item)
      })
      setServiceItemsByCategory(grouped)
      setCollapsedCategories(new Set(initialChecklistCategories.map(cat => cat.id)))
    }, [initialChecklistCategories, initialChecklistItems])

    useImperativeHandle(ref, () => ({
      refresh: () => router.refresh(),
    }))

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

        setPlannedLogs(prev => prev.filter((log) => log.id !== logId))
        router.refresh()
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
          <h2 className="text-2xl font-semibold text-foreground">Your Active Plan</h2>

          {plannedLogs.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <p className="text-muted-foreground text-center">
                  You have no active service plans. Use the checklist below to add one.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {plannedLogs.map((log) => (
                <Card
                  key={log.id}
                  className="bg-card border-border cursor-pointer transition-all duration-300"
                  style={{
                    transition: 'all 0.3s ease-out',
                  }}
                  onClick={() => handleCardClick(log)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)'
                    e.currentTarget.style.borderColor = 'hsl(var(--primary))'
                    e.currentTarget.style.boxShadow = '0 0 30px hsl(var(--primary) / 0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.borderColor = ''
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground mb-1">
                          {log.service_item?.name || 'Service Entry'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Due: {formatDueDate(log)}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                        <Button
                          onClick={() => onMarkComplete(log)}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground"
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
                          className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:border-destructive"
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
          <h2 className="text-2xl font-semibold text-foreground">Suggested Service Checklist</h2>

          {serviceCategories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No checklist items available.</div>
          ) : (
            <div className="space-y-4">
              {serviceCategories.map((category) => {
                const items = serviceItemsByCategory[category.id] || []
                if (items.length === 0) return null

                const isCollapsed = collapsedCategories.has(category.id)

                return (
                  <Card
                    key={category.id}
                    className="bg-card border-border"
                  >
                    <CardHeader
                      className="cursor-pointer"
                      onClick={() => toggleCategory(category.id)}
                    >
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg text-foreground">{category.name}</CardTitle>
                        {isCollapsed ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </CardHeader>
                    {!isCollapsed && (
                      <CardContent>
                        <div className="space-y-2">
                          {items.map((item) => (
                            <div
                              key={item.id}
                              className="flex justify-between items-center py-2 border-b border-border last:border-0"
                            >
                              <span className="text-muted-foreground">{item.name}</span>
                              <Button
                                onClick={() => onAddToPlan(item.id)}
                                variant="outline"
                                size="sm"
                                className="border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
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

