'use client'

import React, { useState, useEffect } from 'react'
import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { Plus, RotateCcw, Copy, GripVertical } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ModStep } from './ModStep'
import { ModStepData } from '../types'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter } from '@repo/ui/modal'
import { Label } from '@repo/ui/label'
import { useRouter } from 'next/navigation'
import {
  addModStep,
  updateModStep,
  deleteModStep,
  reorderModSteps,
  duplicateModPlan,
  duplicateModStep,
  fetchOrCreateModPlanAction
} from '../actions'

interface ModPlanBuilderProps {
  modLogId: string // mod id
  userId: string
  modTitle: string
  initialModPlan?: { id: string; name: string } | null
  initialSteps?: ModStepData[]
}

// Special ID for the input row when dragging
const INPUT_ROW_ID = 'NEW_INPUT_ROW'

export function ModPlanBuilder({
  modLogId,
  userId,
  modTitle,
  initialModPlan,
  initialSteps,
}: ModPlanBuilderProps) {
  const router = useRouter()
  const [steps, setSteps] = useState<ModStepData[]>(initialSteps || [])
  const [isLoading, setIsLoading] = useState(false)
  const [stepInput, setStepInput] = useState('')
  const [draggedStepId, setDraggedStepId] = useState<string | null>(null)
  const [modPlanId, setModPlanId] = useState<string | null>(initialModPlan?.id || null)
  const [isReassemblyMode, setIsReassemblyMode] = useState(false)
  const [isAdding, setIsAdding] = useState(false)

  // Duplication State
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false)
  const [duplicateName, setDuplicateName] = useState('')
  const [isDuplicating, setIsDuplicating] = useState(false)

  // Update modPlanId if initialModPlan changes
  useEffect(() => {
    if (initialModPlan?.id) {
      setModPlanId(initialModPlan.id)
    }
  }, [initialModPlan])

  const fetchOrCreateModPlan = React.useCallback(async () => {
    try {
      console.log('Fetching or creating mod plan...', { modLogId, userId })
      const { id, error } = await fetchOrCreateModPlanAction(modLogId, userId, modTitle)

      if (error) {
        console.error('Error from server action:', error)
        return
      }

      if (id) {
        console.log('Mod plan ID acquired:', id)
        setModPlanId(id)
      } else {
        console.error('No ID returned from fetchOrCreateModPlanAction')
      }
    } catch (error) {
      console.error('Error fetching/creating mod plan:', error)
    }
  }, [modLogId, userId, modTitle])

  const fetchSteps = React.useCallback(async () => {
    if (!modPlanId) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('mod_steps')
        .select('*')
        .eq('mod_plan_id', modPlanId)
        .order('step_order', { ascending: true })

      if (error) throw error
      setSteps(data || [])
    } catch (error) {
      console.error('Error fetching mod steps:', error)
    } finally {
      setIsLoading(false)
    }
  }, [modPlanId])

  // Sync steps with initialSteps if they change
  useEffect(() => {
    if (initialSteps) {
      setSteps(initialSteps)
    }
  }, [initialSteps])

  // Fetch steps when mod plan is available and no initial steps provided
  useEffect(() => {
    if (modPlanId && !initialSteps) {
      fetchSteps()
    }
  }, [modPlanId, fetchSteps, initialSteps])

  // Fetch or create mod plan if missing
  useEffect(() => {
    if (!modPlanId && userId && modLogId) {
      fetchOrCreateModPlan()
    }
  }, [modPlanId, userId, modLogId, fetchOrCreateModPlan])

  const handleAddStep = async () => {
    if (!stepInput.trim() || !modPlanId || isAdding) return

    setIsAdding(true)
    const maxOrder = steps.length > 0 ? Math.max(...steps.map(s => s.step_order)) : 0
    const newStepOrder = maxOrder + 1

    try {
      const tempId = crypto.randomUUID()
      const currentInput = stepInput.trim() // Capture input
      const newStep: ModStepData = {
        id: tempId,
        mod_plan_id: modPlanId,
        step_order: newStepOrder,
        description: currentInput,
        is_completed: false,
        is_completed_reassembly: false,
      } as any

      setSteps(prev => [...prev, newStep])
      setStepInput('')

      const data = await addModStep(modPlanId, currentInput, newStepOrder)

      setSteps(prev => prev.map(s => s.id === tempId ? data : s))
    } catch (error) {
      console.error('Error adding mod step:', error)
      fetchSteps()
    } finally {
      setIsAdding(false)
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
        await updateModStep(stepId, { is_completed_reassembly: completed })
      } else {
        await updateModStep(stepId, { is_completed: completed })
      }
    } catch (error) {
      console.error('Error updating mod step:', error)
      fetchSteps()
    }
  }

  const handleUpdateStep = async (stepId: string, description: string) => {
    try {
      setSteps(steps.map(step =>
        step.id === stepId ? { ...step, description } : step
      ))

      await updateModStep(stepId, { description })
    } catch (error) {
      console.error('Error updating mod step description:', error)
      fetchSteps()
    }
  }

  const handleUpdateNotes = async (stepId: string, notes: string) => {
    try {
      setSteps(steps.map(step =>
        step.id === stepId ? { ...step, notes: notes.trim() || null } : step
      ))

      await updateModStep(stepId, { notes: notes.trim() || null })
    } catch (error) {
      console.error('Error updating mod step notes:', error)
      fetchSteps()
    }
  }

  const handleDeleteStep = async (stepId: string) => {
    if (!modPlanId) return

    try {
      const remainingSteps = steps.filter(s => s.id !== stepId)
      // Re-index locally
      const reorderedSteps = remainingSteps.map((step, index) => ({
        ...step,
        step_order: index + 1,
      }))
      setSteps(reorderedSteps)

      await deleteModStep(stepId)

      // Reorder on server
      const updates = reorderedSteps.map(step => ({
        id: step.id,
        step_order: step.step_order
      }))
      if (updates.length > 0) {
        await reorderModSteps(updates)
      }
    } catch (error) {
      console.error('Error deleting mod step:', error)
      fetchSteps()
    }
  }

  const handleDuplicateStep = async (stepId: string) => {
    if (!modPlanId) return
    try {
      const result = await duplicateModStep(stepId)
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
      console.error('Error duplicating mod step:', error)
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

    if (!draggedStepId || !modPlanId) {
      setDraggedStepId(null)
      return
    }

    if (draggedStepId === INPUT_ROW_ID) {
      setDraggedStepId(null)
      return
    }

    if (targetStepId === 'INPUT') {
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
         if (!step) throw new Error("Step missing during reorder");
         return { ...step, step_order: u.step_order };
      });

      setSteps(reorderedSteps)
      setDraggedStepId(null)
      await reorderModSteps(updates)
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

    const currentVisualList = isReassemblyMode ? [...steps].reverse() : [...steps]

    const fromIndex = currentVisualList.findIndex(s => s.id === draggedStepId)
    const toIndex = currentVisualList.findIndex(s => s.id === targetStepId)

    if (fromIndex === -1 || toIndex === -1) return

    const newVisualList = [...currentVisualList]
    newVisualList.splice(fromIndex, 1)
    newVisualList.splice(toIndex, 0, draggedStep)

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

    const updatedSteps = newVisualList.map(s => {
      const update = updates.find(u => u.id === s.id)
      return { ...s, step_order: update!.step_order }
    }).sort((a, b) => a.step_order - b.step_order)

    setSteps(updatedSteps)
    setDraggedStepId(null)

    try {
      await reorderModSteps(updates)
    } catch (error) {
      console.error('Error reordering mod steps:', error)
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

  const handleDuplicateMod = async () => {
    if (!modPlanId || !duplicateName.trim()) return

    setIsDuplicating(true)
    try {
      const result = await duplicateModPlan(modPlanId, duplicateName, userId, modLogId)
      if (result.success && result.data) {
        setIsDuplicateDialogOpen(false)
        // Redirect to new mod page
        const newModId = result.data.modId
        const currentPath = window.location.pathname
        // Extract vehicle path: /vehicle/[id]/
        const match = currentPath.match(/\/vehicle\/[^/]+/)
        if (match) {
             const vehiclePart = match[0]
             router.push(`${vehiclePart}/mods/${newModId}`)
        }
      } else {
        alert(result.error || 'Failed to duplicate mod plan')
      }
    } catch (error) {
      console.error('Error duplicating mod plan:', error)
      alert('Failed to duplicate mod plan')
    } finally {
      setIsDuplicating(false)
    }
  }

  // Derived state for rendering
  const visibleSteps = isReassemblyMode ? [...steps].reverse() : steps

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
            setDuplicateName(`${initialModPlan?.name || modTitle} (Copy)`)
            setIsDuplicateDialogOpen(true)
          }}
          disabled={!modPlanId}
          variant="outline"
          className="border-white/20 text-gray-300 hover:bg-black/30 hover:border-white/30"
        >
          <Copy className="h-4 w-4 mr-2" />
          Duplicate Plan
        </Button>
      </div>

      {/* Steps List */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-400">Loading steps...</div>
      ) : (
        <div className="space-y-2">
          {visibleSteps.map((step) => (
            <ModStep
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
              disabled={isAdding || !modPlanId}
              className="bg-transparent border-none shadow-none focus-visible:ring-0 px-0 h-auto placeholder:text-muted-foreground/70"
            />
            <Button
              onClick={handleAddStep}
              disabled={!stepInput.trim() || !modPlanId || isAdding}
              size="sm"
              variant="ghost"
              className="hover:bg-primary/20 hover:text-primary"
            >
               {isLoading || !modPlanId || isAdding ? (
                 <span className="w-5 h-5 block border-2 border-t-transparent border-primary rounded-full animate-spin"></span>
               ) : (
                 <Plus className="h-5 w-5" />
               )}
            </Button>
          </div>
        </div>
      )}

      {/* Duplicate Dialog */}
      <Modal open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Duplicate Mod Plan</ModalTitle>
          </ModalHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="duplicate-name">New Plan Name</Label>
              <Input
                id="duplicate-name"
                value={duplicateName}
                onChange={(e) => setDuplicateName(e.target.value)}
                placeholder="e.g. Turbo Kit Install (Copy)"
              />
            </div>
            <div className="text-sm text-muted-foreground">
                This will create a new planned modification with this plan.
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
            <Button onClick={handleDuplicateMod} disabled={isDuplicating || !duplicateName.trim()}>
              {isDuplicating ? 'Duplicating...' : 'Duplicate'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}
