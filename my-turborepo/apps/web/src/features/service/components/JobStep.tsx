'use client'

import { useState, useEffect } from 'react'
import { Checkbox } from '@repo/ui/checkbox'
import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { GripVertical, Pencil, Check } from 'lucide-react'

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
  onDragStart: (e: React.DragEvent, stepId: string) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, stepId: string) => void
  isDragging: boolean
}

export function JobStep({
  step,
  onToggleComplete,
  onUpdate,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
}: JobStepProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(step.description)

  // Update edit value when step description changes externally
  useEffect(() => {
    if (!isEditing) {
      setEditValue(step.description)
    }
  }, [step.description, isEditing])

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

  return (
    <div
      draggable={!isEditing}
      onDragStart={(e) => !isEditing && onDragStart(e, step.id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, step.id)}
      className={`
        flex items-center gap-3 p-3 rounded-lg border transition-all
        ${isDragging ? 'opacity-50' : ''}
        ${step.is_completed ? 'bg-black/20 border-white/10' : 'bg-black/30 border-white/20'}
      `}
    >
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
            className="bg-black/40 backdrop-blur-sm border-white/30 text-white focus:border-white/50 flex-1"
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
            className={`flex-1 text-white transition-all ${
              step.is_completed 
                ? 'line-through text-gray-400 opacity-60' 
                : 'text-white'
            }`}
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
        </>
      )}
    </div>
  )
}

