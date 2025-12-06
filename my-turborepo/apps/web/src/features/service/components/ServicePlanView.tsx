'use client'

import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Plus, CheckCircle2, Trash2, ChevronDown, ChevronUp, Archive, ArchiveRestore } from 'lucide-react'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalFooter,
} from '@repo/ui/modal'
import { archiveJobPlan, restoreJobPlan, permanentDeleteJobPlan } from '../actions'

interface PlannedServiceLog {
  id: string
  event_date: string
  odometer: number | null
  service_item_id: string | null
  notes?: string | null
  service_provider?: string | null
  cost?: number | null
  status?: string // 'Plan' | 'Archive' | 'History'
  service_item?: {
    id: string
    name: string
  } | null
  job_plans?: {
    id: string
    name: string
  }[] | null
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

    // UI State
    const [isActionLoading, setIsActionLoading] = useState<string | null>(null)
    const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
      () => new Set(initialChecklistCategories.map(cat => cat.id))
    )
    const [showArchived, setShowArchived] = useState(false)

    // Delete Confirmation State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [planToDelete, setPlanToDelete] = useState<PlannedServiceLog | null>(null)
    const [deleteConfirmationName, setDeleteConfirmationName] = useState('')

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

    const handleArchivePlan = async (logId: string, jobPlanId: string) => {
      setIsActionLoading(logId)
      try {
        const result = await archiveJobPlan(jobPlanId)
        if (result.error) throw new Error(result.error)
        router.refresh()
      } catch (err) {
        console.error('Error archiving plan:', err)
        alert('Failed to archive plan.')
      } finally {
        setIsActionLoading(null)
      }
    }

    const handleRestorePlan = async (logId: string, jobPlanId: string) => {
      setIsActionLoading(logId)
      try {
        const result = await restoreJobPlan(jobPlanId)
        if (result.error) throw new Error(result.error)
        router.refresh()
      } catch (err) {
        console.error('Error restoring plan:', err)
        alert('Failed to restore plan.')
      } finally {
        setIsActionLoading(null)
      }
    }

    const initiateDelete = (log: PlannedServiceLog) => {
      setPlanToDelete(log)
      setDeleteConfirmationName('')
      setDeleteModalOpen(true)
    }

    const handleConfirmDelete = async () => {
      if (!planToDelete || !planToDelete.job_plans?.[0]?.id) return

      const jobPlanId = planToDelete.job_plans[0].id
      setIsActionLoading(planToDelete.id) // Show loading on the item in background potentially

      try {
        const result = await permanentDeleteJobPlan(jobPlanId, deleteConfirmationName)
        if (!result.success) {
           alert(result.error || 'Failed to delete plan. Check the name matches exactly.')
           setIsActionLoading(null)
           return
        }

        setDeleteModalOpen(false)
        setPlanToDelete(null)
        router.refresh()
      } catch (err) {
        console.error('Error deleting plan:', err)
        alert('An unexpected error occurred.')
      } finally {
        setIsActionLoading(null)
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
      const jobName = log.job_plans?.[0]?.name || log.service_item?.name
      if (jobName) {
        const jobTitle = encodeURIComponent(jobName)
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

    // Filter logs
    const activeLogs = plannedLogs.filter(l => l.status === 'Plan')
    const archivedLogs = plannedLogs.filter(l => l.status === 'Archive')

    return (
      <div className="space-y-8 mt-4">
        {/* Section 1: Active Plans */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
             <h2 className="text-2xl font-semibold text-foreground">Active Plans</h2>
             {archivedLogs.length > 0 && (
               <Button variant="ghost" onClick={() => setShowArchived(!showArchived)}>
                 {showArchived ? 'Hide Archived' : 'Show Archived'}
               </Button>
             )}
          </div>

          {activeLogs.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <p className="text-muted-foreground text-center">
                  You have no active service plans. Use the checklist below to add one.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeLogs.map((log) => (
                <Card
                  key={log.id}
                  className="bg-card border-border cursor-pointer transition-all duration-300"
                  onClick={() => handleCardClick(log)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)'
                    e.currentTarget.style.borderColor = 'hsl(var(--primary))'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.borderColor = ''
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground mb-1">
                          {log.job_plans?.[0]?.name || log.service_item?.name || 'Service Entry'}
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
                          Complete
                        </Button>
                        {log.job_plans?.[0]?.id && (
                          <Button
                            onClick={() => {
                              const planId = log.job_plans?.[0]?.id
                              if (planId) handleArchivePlan(log.id, planId)
                            }}
                            variant="outline"
                            size="sm"
                            disabled={isActionLoading === log.id}
                            className="border-warning/50 text-warning hover:bg-warning/10 hover:border-warning"
                          >
                             <Archive className="h-4 w-4 mr-2" />
                             {isActionLoading === log.id ? 'Archiving...' : 'Archive'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Archived Plans */}
        {showArchived && archivedLogs.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-border">
             <h2 className="text-2xl font-semibold text-muted-foreground">Archived Plans</h2>
             <div className="space-y-3 opacity-80">
                {archivedLogs.map((log) => (
                  <Card key={log.id} className="bg-muted/30 border-dashed border-border">
                     <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                           <div>
                              <h3 className="font-medium text-muted-foreground">
                                {log.job_plans?.[0]?.name || log.service_item?.name}
                              </h3>
                              <p className="text-xs text-muted-foreground">Archived</p>
                           </div>
                           <div className="flex gap-2">
                              {log.job_plans?.[0]?.id && (
                                <>
                                  <Button
                                    onClick={() => {
                                      const planId = log.job_plans?.[0]?.id
                                      if (planId) handleRestorePlan(log.id, planId)
                                    }}
                                    variant="outline"
                                    size="sm"
                                    disabled={isActionLoading === log.id}
                                  >
                                    <ArchiveRestore className="h-4 w-4 mr-2" />
                                    Restore
                                  </Button>
                                  <Button
                                    onClick={() => initiateDelete(log)}
                                    variant="destructive"
                                    size="sm"
                                    disabled={isActionLoading === log.id}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </Button>
                                </>
                              )}
                           </div>
                        </div>
                     </CardContent>
                  </Card>
                ))}
             </div>
          </div>
        )}

        {/* Section 3: Suggested Service Checklist */}
        <div className="space-y-4 pt-4">
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

        {/* Delete Confirmation Modal */}
        <Modal open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
          <ModalContent>
             <ModalHeader>
                <ModalTitle>Permanently Delete Plan</ModalTitle>
             </ModalHeader>
             <div className="py-4 space-y-4">
                <p className="text-sm text-muted-foreground">
                   To confirm deletion, please type the name of the plan: <span className="font-bold text-foreground">{planToDelete?.job_plans?.[0]?.name}</span>
                </p>
                <div className="space-y-2">
                   <Label>Plan Name</Label>
                   <Input
                      value={deleteConfirmationName}
                      onChange={(e) => setDeleteConfirmationName(e.target.value)}
                      placeholder="Type plan name here..."
                   />
                </div>
                <p className="text-xs text-destructive">
                   This action cannot be undone.
                </p>
             </div>
             <ModalFooter>
                <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
                <Button
                   variant="destructive"
                   onClick={handleConfirmDelete}
                   disabled={deleteConfirmationName !== planToDelete?.job_plans?.[0]?.name || isActionLoading === planToDelete?.id}
                >
                   {isActionLoading === planToDelete?.id ? 'Deleting...' : 'Delete Permanently'}
                </Button>
             </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    )
  })

ServicePlanView.displayName = 'ServicePlanView'
