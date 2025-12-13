import React from 'react'
import { cn } from '@repo/ui/lib/utils'
import { ImageWithTimeoutFallback } from './image-with-timeout-fallback'
import { GripVertical } from 'lucide-react'

interface VehicleCardProps {
  title: string
  subtitle?: React.ReactNode
  imageUrl?: string | null
  status?: string // 'daily_driver' | 'parked' | 'listed' | 'sold' | 'retired'
  onClick?: () => void
  footer?: React.ReactNode
  className?: string
  isDragging?: boolean
  onDragStart?: React.DragEventHandler<HTMLDivElement>
  onDragEnd?: React.DragEventHandler<HTMLDivElement>
  showDragHandle?: boolean
}

export function VehicleCard({
  title,
  subtitle,
  imageUrl,
  status,
  onClick,
  footer,
  className,
  isDragging,
  onDragStart,
  onDragEnd,
  showDragHandle
}: VehicleCardProps) {
  // Status color logic
  const getStatusColor = (s?: string) => {
    switch (s) {
      case 'daily_driver': return 'bg-green-500'
      case 'parked': return 'bg-yellow-500'
      case 'listed': return 'bg-yellow-500'
      case 'sold':
      case 'retired': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div
      className={cn("group transition-all duration-300", isDragging && "opacity-50", className)}
      onClick={onClick}
      draggable={!!onDragStart}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className={cn(
        "bg-card rounded-2xl p-4 text-foreground flex flex-col gap-4 border border-border transition-all duration-300 ease-out",
        !isDragging && "group-hover:scale-105 group-hover:border-accent group-hover:shadow-[0_0_30px_hsl(var(--accent)/0.6)]"
      )}>
        <div className="relative w-full aspect-video overflow-hidden rounded-lg bg-muted/10">
          {/* Status Dot */}
          {status && (
            <div className="absolute top-2 left-2 z-10 flex gap-1">
              <span className={cn("w-3 h-3 rounded-full shadow-sm", getStatusColor(status))} />
            </div>
          )}

          {/* Drag Handle */}
          {showDragHandle && (
            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded p-1 cursor-grab active:cursor-grabbing text-white">
              <GripVertical size={16} />
            </div>
          )}

          <ImageWithTimeoutFallback
            src={imageUrl || "/branding/fallback-logo.png"}
            fallbackSrc="/branding/fallback-logo.png"
            alt={`${title} vehicle`}
            className="w-full h-full object-cover"
          />
          {!imageUrl && (
            <>
              <div className="absolute inset-0 bg-black/40" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-lg font-semibold tracking-wide">Vehicle Image Missing</span>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col gap-1 items-start">
          <h3 className="font-bold text-lg text-foreground line-clamp-1">{title}</h3>
          {subtitle && <div className="text-sm text-muted-foreground line-clamp-1">{subtitle}</div>}
        </div>

        {footer && (
          <div className="flex justify-between items-center mt-auto pt-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
