'use client'

import { useState, useEffect } from 'react'
import { Checkbox } from '@repo/ui/checkbox'
import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { Textarea } from '@repo/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '@repo/ui/dialog'
import { GripVertical, Pencil, Check, FileText, Trash2 } from 'lucide-react'

export interface JobStepData {
  id: string
  step_order: number
  description: string
  is_completed: boolean
  notes?: string | null
}

interface JobStepProps {
  step: JobStepData
  onToggleComplete: (stepId: string, completed: boolean) => void
  onUpdate: (stepId: string, description: string) => void
  onUpdateNotes: (stepId: string, notes: string) => void
  onDelete: (stepId: string) => void
  onDragStart: (e: React.DragEvent, stepId: string) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, stepId: string) => void
  isDragging: boolean
}

export function JobStep({
  step,
  onToggleComplete,
  onUpdate,
  onUpdateNotes,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
}: JobStepProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(step.description)
  const [isNotesOpen, setIsNotesOpen] = useState(false)
  const [notesValue, setNotesValue] = useState(step.notes || '')

  // Update edit value when step description changes externally
  useEffect(() => {
    if (!isEditing) {
      setEditValue(step.description)
    }
  }, [step.description, isEditing])

  // Update notes value when step notes change externally
  useEffect(() => {
    setNotesValue(step.notes || '')
  }, [step.notes])

  const handleSave = () => {
    if (editValue.trim() && editValue.trim() !== step.description) {
      onUpdate(step.id, editValue.trim())
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValue(step.description)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  const handleSaveNotes = () => {
    onUpdateNotes(step.id, notesValue)
    setIsNotesOpen(false)
  }

  const handleCancelNotes = () => {
    setNotesValue(step.notes || '')
    setIsNotesOpen(false)
  }

  return (
    <div
      draggable={!isEditing}
      onDragStart={(e) => !isEditing && onDragStart(e, step.id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, step.id)}
      className={`
        flex flex-col gap-2 p-3 rounded-lg border transition-all
        ${isDragging ? 'opacity-50' : ''}
        ${step.is_completed ? 'bg-black/20 border-white/10' : 'bg-black/30 border-white/20'}
      `}
    >
      <div className="flex items-center gap-3">
      {/* Drag Handle */}
      {!isEditing && (
        <div
          className="cursor-move text-gray-400 hover:text-white transition-colors"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-5 w-5" />
        </div>
      )}

      {/* Checkbox */}
      <Checkbox
        checked={step.is_completed}
        onCheckedChange={(checked) => onToggleComplete(step.id, checked === true)}
        className="border-white/30 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
        disabled={isEditing}
      />

      {/* Step Name or Edit Input */}
      {isEditing ? (
        <div className="flex-1 flex items-center gap-2">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-black/30 backdrop-blur-sm border-white/20 text-white placeholder-gray-400 focus:border-white/40 flex-1 h-8"
            autoFocus
          />
          <Button
            onClick={handleSave}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-3"
          >
            <Check className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <>
          <span
            className={`flex-1 transition-all ${
              step.is_completed 
                ? 'text-gray-400' 
                : 'text-white'
            }`}
            style={step.is_completed ? { 
              opacity: 0.6, 
              textDecoration: 'line-through',
              textDecorationThickness: '2px'
            } : { textDecoration: 'none' }}
          >
            {step.description}
          </span>
          <button
            onClick={() => setIsEditing(true)}
            className="text-gray-400 hover:text-white transition-colors p-1"
            type="button"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsNotesOpen(true)}
            className={`text-gray-400 hover:text-white transition-colors p-1 ${
              step.notes ? 'text-blue-400' : ''
            }`}
            type="button"
            title="Notes"
          >
            <FileText className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(step.id)}
            className="text-gray-400 hover:text-red-400 transition-colors p-1"
            type="button"
            title="Delete step"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </>
      )}
      </div>
      
      {/* Notes Display */}
      {step.notes && !isEditing && (
        <div className="text-sm text-gray-400 ml-[52px] truncate">
          {step.notes}
        </div>
      )}

      {/* Notes Dialog */}
      <Dialog open={isNotesOpen} onOpenChange={setIsNotesOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Step Notes</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Textarea
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              placeholder="Add notes for this step (e.g., torque specs, warnings, tool sizes)..."
              className="bg-black/30 backdrop-blur-sm border-white/20 text-white placeholder-gray-400 focus:border-white/40 min-h-[120px]"
              autoFocus
            />
          </DialogBody>
          <DialogFooter>
            <Button
              onClick={handleCancelNotes}
              variant="outline"
              className="border-white/20 text-gray-300 hover:bg-black/30"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveNotes}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

