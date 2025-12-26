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


  // ... (handlers omitted for brevity)

  // ... (drag and drop logic omitted)

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
