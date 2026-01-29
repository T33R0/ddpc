import React from 'react'
import { Badge } from '@repo/ui/badge'
import { cn } from '@repo/ui/lib/utils'

interface VehicleStatusBadgeProps {
  status: string
  className?: string
}

export function VehicleStatusBadge({ status, className }: VehicleStatusBadgeProps) {
  // Normalize status to lowercase for consistent matching
  const normalizedStatus = status?.toLowerCase() || 'active'

  const getStatusStyles = (s: string) => {
    switch (s) {
      case 'active':
        return 'bg-success/25 text-success border-success/50 hover:bg-success/35'
      case 'inactive':
        return 'bg-info/25 text-info border-info/50 hover:bg-info/35'
      case 'archived':
        return 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
      default:
        // Fallback to active style or specific unknown style?
        // Using muted as safe fallback for unknown statuses
        return 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
    }
  }

  const formatStatus = (s: string) => {
    if (!s) return 'Active'
    // Capitalize first letter
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-medium border backdrop-blur-sm shadow-sm transition-colors",
        getStatusStyles(normalizedStatus),
        className
      )}
    >
      {formatStatus(normalizedStatus)}
    </Badge>
  )
}
