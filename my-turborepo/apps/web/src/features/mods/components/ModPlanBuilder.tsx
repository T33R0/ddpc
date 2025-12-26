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
import { usePaywall } from '@/lib/hooks/usePaywall'

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

  const { isPro, triggerPaywall, isLoading: isAuthLoading } = usePaywall()

  // Update modPlanId if initialModPlan changes
  useEffect(() => {
    if (initialModPlan?.id) {
      setModPlanId(initialModPlan.id)
    }
  }, [initialModPlan])

  const fetchOrCreateModPlan = React.useCallback(async () => {
    try {
      // console.log('Fetching or creating mod plan...', { modLogId, userId })
      const { id, error } = await fetchOrCreateModPlanAction(modLogId, userId, modTitle)

      if (error) {
        console.error('Error from server action:', error)
        return
      }

      if (id) {
        // console.log('Mod plan ID acquired:', id)
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
      // Wait for auth loading to complete before making decisions
      if (isAuthLoading) return;

      // If user is NOT pro and plan doesn't exist, we must GATE creation.
      if (!isPro && !initialModPlan?.id) {
        // This is where we catch the "Create" attempt for free users navigating here
        // We can't easily trigger the modal from useEffect without causing loops or rendering issues sometimes
        // But we can just NOT call fetchOrCreate, and maybe show a locked state?
        // Actually, triggerPaywall() updates context state, so it's safe if deduplicated.
        // Let's rely on the UI rendering a lock if modPlanId is null and !isPro
        return
      }
      fetchOrCreateModPlan()
    }
  }, [modPlanId, userId, modLogId, fetchOrCreateModPlan, isPro, initialModPlan, isAuthLoading])


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

    if (!isPro) {
      triggerPaywall()
      return
    }

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
  if (!modPlanId && !isPro) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border border-dashed border-border rounded-lg bg-muted/20">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
          {/* Lucide Lock icon */}
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
        </div>
        <h3 className="text-xl font-bold mb-2">Mod Planning is a Pro Feature</h3>
        <p className="text-muted-foreground text-center max-w-sm mb-6">
          Upgrade to Pro to create detailed modification plans, track steps, and manage your build.
        </p>
        <Button
          onClick={triggerPaywall}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold"
        >
          Unlock Mod Planning
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
