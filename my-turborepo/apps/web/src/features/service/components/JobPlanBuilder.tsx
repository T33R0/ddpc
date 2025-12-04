'use client'

import React, { useState, useEffect } from 'react'
import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { Plus, RotateCcw, Copy } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { JobStep, JobStepData } from './JobStep'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@repo/ui/dialog'
import { Label } from '@repo/ui/label'
import { useRouter } from 'next/navigation'
import {
  addJobStep,
  updateJobStep,
  deleteJobStep,
  reorderJobSteps,
  duplicateJobPlan
} from '../actions'

interface JobPlanBuilderProps {
  maintenanceLogId: string
  userId: string
  jobTitle: string
  initialJobPlan?: { id: string; name: string } | null
  initialSteps?: JobStepData[]
}

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

  // Sync steps with initialSteps if they change (e.g. on navigation if key wasn't enough)
  useEffect(() => {
    if (initialSteps) {
      setSteps(initialSteps)
    }
  }, [initialSteps])

  // Fetch steps when job plan is available
  useEffect(() => {
    if (jobPlanId && !initialSteps) {
      fetchSteps()
    }
  }, [jobPlanId, fetchSteps, initialSteps])

  // Fetch or create job plan if missing
  useEffect(() => {
    if (!jobPlanId && userId && maintenanceLogId) {
      fetchOrCreateJobPlan()
    }
  }, [jobPlanId, userId, maintenanceLogId, fetchOrCreateJobPlan])

  const handleAddStep = async () => {
    if (!stepInput.trim() || !jobPlanId) return

    const newStepOrder = steps.length > 0 ? Math.max(...steps.map(s => s.step_order)) + 1 : 1

    try {
      // Optimistic update
      const tempId = crypto.randomUUID()
      const newStep: JobStepData = {
        id: tempId,
        job_plan_id: jobPlanId,
        step_order: newStepOrder,
        description: stepInput.trim(),
        is_completed: false,
      } as any

      setSteps([...steps, newStep])
      setStepInput('')

      const data = await addJobStep(jobPlanId, stepInput.trim(), newStepOrder)

      // Update with real data
      setSteps(prev => prev.map(s => s.id === tempId ? data : s))
    } catch (error) {
      console.error('Error adding step:', error)
      fetchSteps()
    }
  }

  const handleToggleComplete = async (stepId: string, completed: boolean) => {
    try {
      // Optimistic update
      setSteps(steps.map(step =>
        step.id === stepId ? { ...step, is_completed: completed } : step
      ))

      await updateJobStep(stepId, { is_completed: completed })
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
      // Optimistic update
      const remainingSteps = steps.filter(s => s.id !== stepId)
      const reorderedSteps = remainingSteps.map((step, index) => ({
        ...step,
        step_order: index + 1,
      }))
      setSteps(reorderedSteps)

      await deleteJobStep(stepId)

      // Reorder remaining steps on server
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

  const handleDragStart = (e: React.DragEvent, stepId: string) => {
    setDraggedStepId(stepId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', stepId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, targetStepId: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (!draggedStepId || draggedStepId === targetStepId || !jobPlanId) {
      setDraggedStepId(null)
      return
    }

    const draggedStep = steps.find(s => s.id === draggedStepId)
    const targetStep = steps.find(s => s.id === targetStepId)

    if (!draggedStep || !targetStep) {
      setDraggedStepId(null)
      return
    }

    // Calculate new order
    const draggedIndex = steps.findIndex(s => s.id === draggedStepId)
    const targetIndex = steps.findIndex(s => s.id === targetStepId)

    // Create new ordered array
    const newSteps = [...steps]
    newSteps.splice(draggedIndex, 1)
    newSteps.splice(targetIndex, 0, draggedStep)

    // Update step_order for all affected steps
    const updates = newSteps.map((step, index) => ({
      id: step.id,
      step_order: index + 1,
    }))

    setSteps(newSteps.map((step, index) => ({
      ...step,
      step_order: index + 1,
    })))
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
    if (!jobPlanId) return

    const reversedSteps = [...steps].reverse()
    const newSteps = reversedSteps.map((step, index) => ({
      ...step,
      step_order: index + 1,
      is_completed: false,
    }))

    setSteps(newSteps)
    setIsReassemblyMode(!isReassemblyMode)

    try {
      const updates = newSteps.map(step => ({
        id: step.id,
        step_order: step.step_order
      }))

      await reorderJobSteps(updates)
    } catch (error) {
      console.error('Error reversing steps:', error)
      fetchSteps()
    }
  }

  const handleDuplicateJob = async () => {
    if (!jobPlanId || !duplicateName.trim()) return

    setIsDuplicating(true)
    try {
      const result = await duplicateJobPlan(jobPlanId, duplicateName, userId)
      if (result.success && result.data) {
        setIsDuplicateDialogOpen(false)
        // Redirect to the new job page
        const newSlug = encodeURIComponent(result.data.name)
        // Assuming we stay on the same vehicle
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

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={handleReassemblyMode}
          variant="outline"
          className="border-white/20 text-gray-300 hover:bg-black/30 hover:border-white/30"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          {isReassemblyMode ? 'Disassembly Mode' : 'Re-assembly Mode'}
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

      {/* Input Section */}
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Enter step"
          value={stepInput}
          onChange={(e) => setStepInput(e.target.value)}
          onKeyPress={handleKeyPress}
          className="bg-background backdrop-blur-sm border-border text-foreground placeholder-muted-foreground focus:border-accent"
        />
        <Button
          onClick={handleAddStep}
          disabled={!stepInput.trim()}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Step
        </Button>
      </div>

      {/* Steps List */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-400">Loading steps...</div>
      ) : steps.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          No steps yet. Add your first step above.
        </div>
      ) : (
        <div className="space-y-2">
          {steps.map((step) => (
            <JobStep
              key={step.id}
              step={step}
              onToggleComplete={handleToggleComplete}
              onUpdate={handleUpdateStep}
              onUpdateNotes={handleUpdateNotes}
              onDelete={handleDeleteStep}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              isDragging={draggedStepId === step.id}
            />
          ))}
        </div>
      )}

      {/* Duplicate Dialog */}
      <Dialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Job Plan</DialogTitle>
          </DialogHeader>
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
          <DialogFooter>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
