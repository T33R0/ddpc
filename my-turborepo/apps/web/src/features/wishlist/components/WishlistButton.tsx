'use client'

import React, { useState } from 'react'
import { Button } from '@repo/ui/button'
import { ListTodo } from 'lucide-react'
import { WishlistDrawer } from './WishlistDrawer'

interface WishlistButtonProps {
  vehicleId: string
  isOwner: boolean
}

export function WishlistButton({ vehicleId, isOwner }: WishlistButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Only owners can see the wishlist button for now, as RLS restricts view anyway
  if (!isOwner) return null

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-2 bg-muted hover:bg-muted/80 text-muted-foreground border-border px-3"
        onClick={() => setIsOpen(true)}
      >
        <ListTodo className="w-4 h-4" />
        <span className="hidden sm:inline">Wishlist</span>
      </Button>

      <WishlistDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        vehicleId={vehicleId}
        isOwner={isOwner}
      />
    </>
  )
}
