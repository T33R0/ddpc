'use client'

import { useState, useTransition } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { toggleVehiclePrivacy } from '@/actions/vehicle-privacy'
import toast from 'react-hot-toast'

interface VehiclePrivacyToggleProps {
  vehicleId: string
  initialPrivacy: string // 'PUBLIC' | 'PRIVATE'
}

export function VehiclePrivacyToggle({ vehicleId, initialPrivacy }: VehiclePrivacyToggleProps) {
  const [privacy, setPrivacy] = useState(initialPrivacy)
  const [isPending, startTransition] = useTransition()

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Optimistic update
    const previousPrivacy = privacy
    const newPrivacy = privacy === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC'
    setPrivacy(newPrivacy)

    startTransition(async () => {
      const result = await toggleVehiclePrivacy(vehicleId)

      if (result.error) {
        setPrivacy(previousPrivacy) // Revert
        toast.error('Failed to update privacy')
      } else {
        toast.success(`Vehicle is now ${newPrivacy.toLowerCase()}`)
      }
    })
  }

  const isPublic = privacy === 'PUBLIC'

  return (
    <Button
      variant="secondary"
      size="icon"
      className="h-8 w-8 rounded-full shadow-md bg-background/80 backdrop-blur-sm hover:bg-background border border-border"
      onClick={handleToggle}
      disabled={isPending}
      title={isPublic ? 'Public - Everyone can see this' : 'Private - Only you can see this'}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isPublic ? (
        <Eye className="h-4 w-4 text-primary" />
      ) : (
        <EyeOff className="h-4 w-4 text-muted-foreground" />
      )}
      <span className="sr-only">Toggle Privacy</span>
    </Button>
  )
}
