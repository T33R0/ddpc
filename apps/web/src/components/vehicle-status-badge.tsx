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
        return 'bg-green-500/25 text-green-400 border-green-500/50 hover:bg-green-500/35'
      case 'inactive':
        return 'bg-blue-500/25 text-blue-400 border-blue-500/50 hover:bg-blue-500/35'
      case 'archived':
        return 'bg-gray-500/25 text-gray-400 border-gray-500/50 hover:bg-gray-500/35'
      default:
        // Fallback to active style or specific unknown style?
        // Using grey as safe fallback for unknown statuses
        return 'bg-gray-500/25 text-gray-400 border-gray-500/50 hover:bg-gray-500/35'
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
