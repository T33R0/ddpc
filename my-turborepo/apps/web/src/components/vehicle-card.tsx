import React from 'react'
import { cn } from '@repo/ui/lib/utils'
import { ImageWithTimeoutFallback } from './image-with-timeout-fallback'
import { GripVertical } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@repo/ui/card'
import { VehicleStatusBadge } from './vehicle-status-badge'

interface VehicleCardProps {
  title: string
  subtitle?: React.ReactNode
  imageUrl?: string | null
  status?: string // 'active' | 'inactive' | 'archived'
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
  return (
    <div
      className={cn("group transition-all duration-300 h-full", isDragging && "opacity-50", className)}
      onClick={onClick}
      draggable={!!onDragStart}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <Card className={cn(
        "relative h-full min-h-60 overflow-hidden transition-all duration-300 ease-out border-border bg-card",
        !isDragging && "hover:scale-105 hover:border-accent hover:shadow-lg cursor-pointer"
      )}>
        {/* Background Image Section */}
        <div className="absolute inset-0 z-0">
          <ImageWithTimeoutFallback
            src={imageUrl || "/branding/fallback-logo.png"}
            fallbackSrc="/branding/fallback-logo.png"
            alt={`${title} vehicle`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-40 group-hover:opacity-30"
          />
          {/* Missing Image Placeholder (if fallback fails visually or logic-wise, though component handles fallback) */}
          {!imageUrl && (
            <div className="absolute inset-0 bg-muted/20" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent" />
        </div>

        {/* Floating Elements (Status & Drag Handle) */}
        <div className="absolute top-3 left-3 z-20">
          {status && <VehicleStatusBadge status={status} />}
        </div>

        {showDragHandle && (
          <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm rounded p-1 cursor-grab active:cursor-grabbing text-foreground shadow-sm">
            <GripVertical size={16} />
          </div>
        )}

        {/* Content Section */}
        <div className="relative z-10 flex flex-col justify-end h-full p-6">
          <div className="mt-auto space-y-4">
            <CardHeader className="p-0 space-y-1">
              <CardTitle className="text-xl font-bold tracking-tight text-foreground group-hover:text-accent transition-colors line-clamp-1 drop-shadow-sm">
                {title}
              </CardTitle>
              {subtitle && (
                <CardDescription className="line-clamp-1 text-muted-foreground font-medium">
                  {subtitle}
                </CardDescription>
              )}
            </CardHeader>

            {/* Footer Section */}
            {footer && (
              <div className="pt-2 border-t border-border/50">
                <div className="w-full flex justify-between items-center text-sm">
                  {footer}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
