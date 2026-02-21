'use client'

import React from 'react'
import { Droplets, RotateCcw, Wind, Disc, Sparkles, Zap } from 'lucide-react'

export interface QuickServicePreset {
  label: string
  title: string
  icon: React.ReactNode
}

const QUICK_PRESETS: QuickServicePreset[] = [
  { label: 'Oil Change', title: 'Oil Change', icon: <Droplets className="w-4 h-4" /> },
  { label: 'Tire Rotation', title: 'Tire Rotation', icon: <RotateCcw className="w-4 h-4" /> },
  { label: 'Air Filter', title: 'Air Filter Replacement', icon: <Wind className="w-4 h-4" /> },
  { label: 'Brakes', title: 'Brake Pad Replacement', icon: <Disc className="w-4 h-4" /> },
  { label: 'Coolant Flush', title: 'Coolant Flush', icon: <Sparkles className="w-4 h-4" /> },
  { label: 'Spark Plugs', title: 'Spark Plug Replacement', icon: <Zap className="w-4 h-4" /> },
]

interface QuickAddServiceProps {
  onSelect: (preset: QuickServicePreset) => void
}

export function QuickAddService({ onSelect }: QuickAddServiceProps) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick Add</h4>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {QUICK_PRESETS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => onSelect(preset)}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border bg-card/50 hover:bg-accent hover:text-accent-foreground active:scale-95 transition-all min-h-[64px] touch-manipulation"
          >
            <span className="text-muted-foreground group-hover:text-accent-foreground">
              {preset.icon}
            </span>
            <span className="text-[11px] font-medium leading-tight text-center">
              {preset.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export { QUICK_PRESETS }
