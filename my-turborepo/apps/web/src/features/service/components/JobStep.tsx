'use client'

import { Checkbox } from '@repo/ui/checkbox'
import { GripVertical } from 'lucide-react'

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
  onDragStart: (e: React.DragEvent, stepId: string) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, stepId: string) => void
  isDragging: boolean
}

export function JobStep({
  step,
  onToggleComplete,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
}: JobStepProps) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, step.id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, step.id)}
      className={`
        flex items-center gap-3 p-3 rounded-lg border transition-all
        ${isDragging ? 'opacity-50' : ''}
        ${step.is_completed ? 'bg-black/20 border-white/10' : 'bg-black/30 border-white/20'}
      `}
    >
      {/* Drag Handle */}
      <div
        className="cursor-move text-gray-400 hover:text-white transition-colors"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-5 w-5" />
      </div>

      {/* Checkbox */}
      <Checkbox
        checked={step.is_completed}
        onCheckedChange={(checked) => onToggleComplete(step.id, checked === true)}
        className="border-white/30 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
      />

      {/* Step Name */}
      <span
        className={`flex-1 text-white ${
          step.is_completed ? 'line-through text-gray-500' : ''
        }`}
      >
        {step.description}
      </span>
    </div>
  )
}

