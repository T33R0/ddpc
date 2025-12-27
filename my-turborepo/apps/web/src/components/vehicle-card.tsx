import React from 'react'
import { cn } from '@repo/ui/lib/utils'
import { ImageWithTimeoutFallback } from './image-with-timeout-fallback'
import { GripVertical } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@repo/ui/card'
import { Badge } from '@repo/ui/badge'

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
  // Map legacy status strings to standard Badge variants
  const getStatusVariant = (s?: string): "default" | "secondary" | "destructive" => {
    switch (s) {
      case 'active': return 'default'
      case 'inactive': return 'secondary'
      case 'archived': return 'destructive'
      default: return 'secondary'
    }
  }

  // Format status text (replace underscores with spaces)
  const formatStatus = (s: string) => s.replace(/_/g, ' ')

  return (
    <div
      className={cn("group transition-all duration-300", isDragging && "opacity-50", className)}
      onClick={onClick}
      draggable={!!onDragStart}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <Card className={cn(
        "h-full overflow-hidden transition-all duration-300 ease-out border-border",
        !isDragging && "group-hover:scale-105 group-hover:border-accent group-hover:shadow-[0_0_30px_hsl(var(--accent)/0.6)]"
      )}>
        {/* Image Section */}
        <div className="relative w-full aspect-video bg-muted/10 p-4 pb-0">
           <div className="relative w-full h-full overflow-hidden rounded-lg">
            {/* Status Badge */}
            {status && (
              <div className="absolute top-2 left-2 z-10">
                <Badge variant={getStatusVariant(status)} className="capitalize shadow-sm">
                  {formatStatus(status)}
                </Badge>
              </div>
            )}

            {/* Drag Handle */}
            {showDragHandle && (
              <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm rounded p-1 cursor-grab active:cursor-grabbing text-foreground shadow-sm">
                <GripVertical size={16} />
              </div>
            )}

            <ImageWithTimeoutFallback
              src={imageUrl || "/branding/fallback-logo.png"}
              fallbackSrc="/branding/fallback-logo.png"
              alt={`${title} vehicle`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Missing Image Placeholder */}
            {!imageUrl && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50 backdrop-blur-sm">
                <span className="text-muted-foreground text-sm font-semibold tracking-wide">Image Missing</span>
              </div>
            )}
          </div>
        </div>

        {/* Content Section */}
        <CardHeader className="p-4 pt-4">
          <CardTitle className="text-lg line-clamp-1">{title}</CardTitle>
          {subtitle && <CardDescription className="line-clamp-1">{subtitle}</CardDescription>}
        </CardHeader>

        {/* Footer Section */}
        {footer && (
          <CardFooter className="p-4 pt-0 mt-auto">
            <div className="w-full flex justify-between items-center">
              {footer}
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
