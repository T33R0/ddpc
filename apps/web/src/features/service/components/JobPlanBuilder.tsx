'use client'

import React, { useState, useEffect } from 'react'
import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { Plus, RotateCcw, Copy, GripVertical } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { JobStep, JobStepData } from './JobStep'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter } from '@repo/ui/modal'
import { Label } from '@repo/ui/label'
import { useRouter } from 'next/navigation'
import {
  addJobStep,
  updateJobStep,
  deleteJobStep,
  reorderJobSteps,
  duplicateJobPlan,
  duplicateJobStep
} from '../actions'
import { usePaywall } from '@/lib/hooks/usePaywall'

interface JobPlanBuilderProps {
  maintenanceLogId: string
  userId: string
  jobTitle: string
  initialJobPlan?: { id: string; name: string } | null
  initialSteps?: JobStepData[]
}

// Special ID for the input row when dragging
const INPUT_ROW_ID = 'NEW_INPUT_ROW'

export function JobPlanBuilder({
  maintenanceLogId,
  userId,
  jobTitle,
  initialJobPlan,
  initialSteps,
}: JobPlanBuilderProps) {
  const router = useRouter()
  const [steps, setSteps] = useState<JobStepData[]>(initialSteps || [])
  const [isLoading, setIsLoading] = useState(false)
  const [stepInput, setStepInput] = useState('')
  const [draggedStepId, setDraggedStepId] = useState<string | null>(null)
  const [jobPlanId, setJobPlanId] = useState<string | null>(initialJobPlan?.id || null)
  const [isReassemblyMode, setIsReassemblyMode] = useState(false)

  // Duplication State
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false)
  const [duplicateName, setDuplicateName] = useState('')
  const [isDuplicating, setIsDuplicating] = useState(false)

  const { isPro, triggerPaywall, isLoading: isAuthLoading } = usePaywall()

  // Update jobPlanId if initialJobPlan changes
  useEffect(() => {
    if (initialJobPlan?.id) {
      setJobPlanId(initialJobPlan.id)
    }
  }, [initialJobPlan])

  const fetchOrCreateJobPlan = React.useCallback(async () => {
    try {
      // First, try to find existing job plan for this maintenance log
      const { data: existingPlan } = await supabase
        .from('job_plans')
        .select('id')
        .eq('maintenance_log_id', maintenanceLogId)
        .eq('user_id', userId)
        .single()

      if (existingPlan) {
        setJobPlanId(existingPlan.id)
        return
      }

      // If no plan exists, create one
      const { data: newPlan, error: createError } = await supabase
        .from('job_plans')
        .insert({
          user_id: userId,
          maintenance_log_id: maintenanceLogId,
          name: jobTitle,
        })
        .select('id')
        .single()

      if (createError) throw createError
      if (newPlan) {
        setJobPlanId(newPlan.id)
      }
    } catch (error) {
      console.error('Error fetching/creating job plan:', error)
    }
  }, [maintenanceLogId, userId, jobTitle])

  const fetchSteps = React.useCallback(async () => {
    if (!jobPlanId) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('job_steps')
        .select('*')
        .eq('job_plan_id', jobPlanId)
        .order('step_order', { ascending: true })

      if (error) throw error
      setSteps(data || [])
    } catch (error) {
      console.error('Error fetching steps:', error)
    } finally {
      setIsLoading(false)
    }
  }, [jobPlanId])

  // Sync steps with initialSteps if they change
  useEffect(() => {
    if (initialSteps) {
      setSteps(initialSteps)
    }
  }, [initialSteps])

  // Fetch steps when job plan is available and no initial steps provided
  useEffect(() => {
    if (jobPlanId && !initialSteps) {
      fetchSteps()
    }
  }, [jobPlanId, fetchSteps, initialSteps])

  // Fetch or create job plan if missing
  useEffect(() => {
    if (!jobPlanId && userId && maintenanceLogId) {
      // Wait for auth loading to complete before making decisions
      if (isAuthLoading) return;

      // If user is NOT pro and plan doesn't exist, we must GATE creation.
      if (!isPro && !initialJobPlan?.id) {
        // Prevent creation for free users
        return
      }
      fetchOrCreateJobPlan()
    }
  }, [jobPlanId, userId, maintenanceLogId, fetchOrCreateJobPlan, isPro, initialJobPlan, isAuthLoading])


  // --- Handlers ---

  const handleAddStep = async () => {
    if (!stepInput.trim() || !jobPlanId) return

    // If input row is at a specific position, insert there. Otherwise append.
    // For now, simpler to always append to the bottom of the "logical" list
    // If in reassembly mode (reversed view), adding a step logically appends to the END of the disassembly list (which is the top of reassembly list?)
    // Actually, usually you add steps during planning (disassembly order).
    // Let's assume adds always go to the end of the disassembly sequence (highest step_order).

    const maxOrder = steps.length > 0 ? Math.max(...steps.map(s => s.step_order)) : 0
    const newStepOrder = maxOrder + 1

    try {
      const tempId = crypto.randomUUID()
      const newStep: JobStepData = {
        id: tempId,
        job_plan_id: jobPlanId,
        step_order: newStepOrder,
        description: stepInput.trim(),
        is_completed: false,
        is_completed_reassembly: false,
      } as any

      setSteps(prev => [...prev, newStep])
      setStepInput('')

      const data = await addJobStep(jobPlanId, stepInput.trim(), newStepOrder)

      setSteps(prev => prev.map(s => s.id === tempId ? data : s))
    } catch (error) {
      console.error('Error adding step:', error)
      fetchSteps()
    }
  }

  const handleToggleComplete = async (stepId: string, completed: boolean) => {
    try {
      // Optimistic update
      setSteps(steps.map(step => {
        if (step.id !== stepId) return step
        return isReassemblyMode
          ? { ...step, is_completed_reassembly: completed }
          : { ...step, is_completed: completed }
      }))

      if (isReassemblyMode) {
        await updateJobStep(stepId, { is_completed_reassembly: completed })
      } else {
        await updateJobStep(stepId, { is_completed: completed })
      }
    } catch (error) {
      console.error('Error updating step:', error)
      fetchSteps()
    }
  }

  const handleUpdateStep = async (stepId: string, description: string) => {
    try {
      setSteps(steps.map(step =>
        step.id === stepId ? { ...step, description } : step
      ))

      await updateJobStep(stepId, { description })
    } catch (error) {
      console.error('Error updating step description:', error)
      fetchSteps()
    }
  }

  const handleUpdateNotes = async (stepId: string, notes: string) => {
    try {
      setSteps(steps.map(step =>
        step.id === stepId ? { ...step, notes: notes.trim() || null } : step
      ))

      await updateJobStep(stepId, { notes: notes.trim() || null })
    } catch (error) {
      console.error('Error updating step notes:', error)
      fetchSteps()
    }
  }

  const handleDeleteStep = async (stepId: string) => {
    if (!jobPlanId) return

    try {
      const remainingSteps = steps.filter(s => s.id !== stepId)
      // Re-index locally
      const reorderedSteps = remainingSteps.map((step, index) => ({
        ...step,
        step_order: index + 1,
      }))
      setSteps(reorderedSteps)

      await deleteJobStep(stepId)

      // Reorder on server
      const updates = reorderedSteps.map(step => ({
        id: step.id,
        step_order: step.step_order
      }))
      if (updates.length > 0) {
        await reorderJobSteps(updates)
      }
    } catch (error) {
      console.error('Error deleting step:', error)
      fetchSteps()
    }
  }

  const handleDuplicateStep = async (stepId: string) => {
    if (!jobPlanId) return
    try {
      const result = await duplicateJobStep(stepId)
      if (result.success && result.data) {
        const newStep = result.data
        // Insert locally
        const sourceIndex = steps.findIndex(s => s.id === stepId)
        if (sourceIndex !== -1) {
          const newSteps = [...steps]
          // Shift local orders
          for (let i = sourceIndex + 1; i < newSteps.length; i++) {
            const stepToUpdate = newSteps[i]
            if (stepToUpdate) {
              stepToUpdate.step_order++
            }
          }
          newSteps.splice(sourceIndex + 1, 0, newStep)
          setSteps(newSteps)
        } else {
          fetchSteps()
        }
      }
    } catch (error) {
      console.error('Error duplicating step:', error)
      fetchSteps()
    }
  }

  // --- Drag and Drop Logic ---

  const handleDragStart = (e: React.DragEvent, stepId: string) => {
    setDraggedStepId(stepId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', stepId)
  }

  const handleInputDragStart = (e: React.DragEvent) => {
    setDraggedStepId(INPUT_ROW_ID)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', INPUT_ROW_ID)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, targetStepId: string | 'INPUT') => {
    e.preventDefault()
    e.stopPropagation()

    if (!draggedStepId || !jobPlanId) {
      setDraggedStepId(null)
      return
    }

    if (draggedStepId === INPUT_ROW_ID) {
      // Moving the input row has no effect on data until we submit,
      // but conceptually you asked for it to be draggable.
      // However, usually the input row appends.
      // If the user drags the input row to position X, does that mean the NEXT added item goes to position X?
      // That complicates the "append" logic significantly.
      // For now, I will interpret "draggable input field" as strictly visual if it doesn't create data immediately.
      // Or, better: The input field is always at the bottom. Dragging items AROUND it works.
      // If I drag the input field, it just snaps back because it's the footer.
      // Let's implement dragging *Items* effectively.
      setDraggedStepId(null)
      return
    }

    if (targetStepId === 'INPUT') {
      // Dropped an item onto the input row (bottom)
      // Move item to end
      const draggedIndex = steps.findIndex(s => s.id === draggedStepId)
      if (draggedIndex === -1) return

      const draggedStep = steps[draggedIndex]
      if (!draggedStep) return

      const newSteps = [...steps]
      newSteps.splice(draggedIndex, 1)
      newSteps.push(draggedStep)

      const updates = newSteps.map((step, index) => ({
        id: step.id,
        step_order: index + 1,
      }))

      const reorderedSteps = updates.map((u, i) => {
        const step = newSteps[i];
        // Ensure step exists and assert it is a JobStepData to satisfy TS
        if (!step) throw new Error("Step missing during reorder");
        return { ...step, step_order: u.step_order };
      });

      setSteps(reorderedSteps)
      setDraggedStepId(null)
      await reorderJobSteps(updates)
      return
    }

    if (draggedStepId === targetStepId) {
      setDraggedStepId(null)
      return
    }

    const draggedStep = steps.find(s => s.id === draggedStepId)
    if (!draggedStep) {
      setDraggedStepId(null)
      return
    }

    // Calculate new order
    // Note: If isReassemblyMode is true, the visual list is reversed.
    // The underlying steps array is likely sorted by step_order ASC usually.
    // We should operate on the sorted array.

    // Let's work with the current visual order to determine index, then map back to step_order
    const currentVisualList = isReassemblyMode ? [...steps].reverse() : [...steps]

    const fromIndex = currentVisualList.findIndex(s => s.id === draggedStepId)
    const toIndex = currentVisualList.findIndex(s => s.id === targetStepId)

    if (fromIndex === -1 || toIndex === -1) return

    const newVisualList = [...currentVisualList]
    newVisualList.splice(fromIndex, 1)
    newVisualList.splice(toIndex, 0, draggedStep)

    // Now re-assign step_order based on the NEW visual list
    // If Reassembly Mode (Reverse), the first item in visual list is the LAST item in step_order (highest number)
    // Actually, Reassembly is just reverse order.
    // If I move Item A to top in Reassembly, it should be the LAST step in Disassembly.
    // So we assign orders:
    // If Normal: 0 -> order 1, 1 -> order 2
    // If Reassembly: 0 -> order N, 1 -> order N-1

    const updates = newVisualList.map((step, index) => {
      let newOrder
      if (isReassemblyMode) {
        newOrder = newVisualList.length - index
      } else {
        newOrder = index + 1
      }
      return {
        id: step.id,
        step_order: newOrder
      }
    })

    // Update local state (we need to sort it back to ASC for consistent state management)
    const updatedSteps = newVisualList.map(s => {
      const update = updates.find(u => u.id === s.id)
      return { ...s, step_order: update!.step_order }
    }).sort((a, b) => a.step_order - b.step_order)

    setSteps(updatedSteps)
    setDraggedStepId(null)

    try {
      await reorderJobSteps(updates)
    } catch (error) {
      console.error('Error reordering steps:', error)
      fetchSteps()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddStep()
    }
  }

  const handleReassemblyMode = async () => {
    setIsReassemblyMode(!isReassemblyMode)
  }

  const handleDuplicateJob = async () => {
    if (!jobPlanId || !duplicateName.trim()) return

    if (!isPro) {
      triggerPaywall()
      return
    }

    setIsDuplicating(true)
    try {
      const result = await duplicateJobPlan(jobPlanId, duplicateName, userId)
      if (result.success && result.data) {
        setIsDuplicateDialogOpen(false)
        const newSlug = encodeURIComponent(result.data.name)
        const currentPath = window.location.pathname
        const vehiclePart = currentPath.split('/service')[0]
        router.push(`${vehiclePart}/service/${newSlug}`)
      } else {
        alert(result.error || 'Failed to duplicate job')
      }
    } catch (error) {
      console.error('Error duplicating job:', error)
      alert('Failed to duplicate job')
    } finally {
      setIsDuplicating(false)
    }
  }

  // Derived state for rendering
  const visibleSteps = isReassemblyMode ? [...steps].reverse() : steps

  // If loading auth state, show a loading placeholder
  if (isAuthLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 py-24 border border-dashed border-border rounded-lg bg-muted/20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground text-sm">Loading plan access...</p>
      </div>
    )
  }

  // If no plan exists and user is not Pro, show Locked State
  if (!jobPlanId && !isPro) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border border-dashed border-border rounded-lg bg-muted/20">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
          {/* Lucide Lock icon */}
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
        </div>
        <h3 className="text-xl font-bold mb-2">Service Planning is a Pro Feature</h3>
        <p className="text-muted-foreground text-center max-w-sm mb-6">
          Upgrade to Pro to create detailed job plans, track steps, and manage your maintenance.
        </p>
        <Button
          onClick={triggerPaywall}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold"
        >
          Unlock Service Planning
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={handleReassemblyMode}
          variant="outline"
          className={`border-white/20 hover:bg-black/30 hover:border-white/30 ${isReassemblyMode ? 'bg-primary/20 text-primary border-primary/50' : 'text-gray-300'}`}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          {isReassemblyMode ? 'Re-assembly Mode (Active)' : 'Switch to Re-assembly Mode'}
        </Button>
        <Button
          onClick={() => {
            setDuplicateName(`${initialJobPlan?.name || jobTitle} (Copy)`)
            setIsDuplicateDialogOpen(true)
          }}
          disabled={!jobPlanId}
          variant="outline"
          className="border-white/20 text-gray-300 hover:bg-black/30 hover:border-white/30"
        >
          <Copy className="h-4 w-4 mr-2" />
          Duplicate Job
        </Button>
      </div>

      {/* Steps List */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-400">Loading steps...</div>
      ) : (
        <div className="space-y-2">
          {visibleSteps.map((step) => (
            <JobStep
              key={step.id}
              step={step}
              onToggleComplete={handleToggleComplete}
              onUpdate={handleUpdateStep}
              onUpdateNotes={handleUpdateNotes}
              onDelete={handleDeleteStep}
              onDuplicate={handleDuplicateStep}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              isDragging={draggedStepId === step.id}
              isReassemblyMode={isReassemblyMode}
            />
          ))}

          {/* Input Row - Always at the bottom of the list visually */}
          <div
            className="flex gap-2 items-center p-3 rounded-lg border border-dashed border-border/50 bg-background/50"
            draggable
            onDragStart={handleInputDragStart}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'INPUT')}
          >
            <div className="cursor-move text-muted-foreground/50">
              <GripVertical className="h-5 w-5" />
            </div>
            <Input
              type="text"
              placeholder="Add next step..."
              value={stepInput}
              onChange={(e) => setStepInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="bg-transparent border-none shadow-none focus-visible:ring-0 px-0 h-auto placeholder:text-muted-foreground/70"
            />
            <Button
              onClick={handleAddStep}
              disabled={!stepInput.trim()}
              size="sm"
              variant="ghost"
              className="hover:bg-primary/20 hover:text-primary"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Duplicate Dialog */}
      <Modal open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Duplicate Job Plan</ModalTitle>
          </ModalHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="duplicate-name">New Job Name</Label>
              <Input
                id="duplicate-name"
                value={duplicateName}
                onChange={(e) => setDuplicateName(e.target.value)}
                placeholder="e.g. Front Right Axle"
              />
            </div>
          </div>
          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => setIsDuplicateDialogOpen(false)}
              disabled={isDuplicating}
            >
              Cancel
            </Button>
            <Button onClick={handleDuplicateJob} disabled={isDuplicating || !duplicateName.trim()}>
              {isDuplicating ? 'Duplicating...' : 'Duplicate'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}
