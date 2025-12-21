'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@repo/ui/card'
import { Button } from '@repo/ui/button'
import { Badge } from '@repo/ui/badge'
import { ExternalLink, Trash2, ShoppingBag, Loader2 } from 'lucide-react'
import { deleteWishlistItem, purchaseWishlistItem } from '../actions'
import { useRouter } from 'next/navigation'

interface WishlistItemProps {
  item: {
    id: string
    name: string
    url: string | null
    price: number | null
    notes: string | null
    priority: 'low' | 'medium' | 'high' | string
    type: 'mod' | 'service' | string
    category: string | null
    status: 'active' | 'purchased' | string
    vehicle_id: string
  }
  onUpdate?: () => void
}

export function WishlistItemCard({ item, onUpdate }: WishlistItemProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPurchasing, setIsPurchasing] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this item?')) return
    setIsDeleting(true)
    try {
      await deleteWishlistItem(item.id, item.vehicle_id)
      onUpdate?.()
      router.refresh()
    } catch (err) {
      alert('Failed to delete item')
      setIsDeleting(false)
    }
  }

  const handlePurchase = async () => {
    if (!confirm('Mark as purchased? This will add it to your parts inventory.')) return
    setIsPurchasing(true)
    try {
      const result = await purchaseWishlistItem(item.id, item.vehicle_id)
      if (!result.success) {
        throw new Error(result.error)
      }
      onUpdate?.()
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to purchase item')
      setIsPurchasing(false)
    }
  }

  const isPurchased = item.status === 'purchased'
  const priorityColors = {
    high: 'text-destructive border-destructive/50',
    medium: 'text-yellow-500 border-yellow-500/50',
    low: 'text-muted-foreground border-border',
  }

  return (
    <Card className={`mb-3 ${isPurchased ? 'opacity-60 bg-muted/50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-medium ${isPurchased ? 'line-through text-muted-foreground' : ''}`}>
                {item.name}
              </span>
              <Badge variant="outline" className="text-xs py-0 h-5">
                {item.type}
              </Badge>
              {item.category && (
                <Badge variant="secondary" className="text-xs py-0 h-5 text-muted-foreground">
                  {item.category}
                </Badge>
              )}
              {!isPurchased && (
                <Badge variant="outline" className={`text-xs py-0 h-5 ${priorityColors[item.priority as keyof typeof priorityColors] || ''}`}>
                  {item.priority}
                </Badge>
              )}
            </div>

            <div className="text-sm text-muted-foreground flex items-center gap-3">
              {item.price && (
                <span className="font-medium text-foreground">
                  ${item.price.toLocaleString()}
                </span>
              )}
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center hover:text-primary transition-colors"
                >
                  Link <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              )}
            </div>

            {item.notes && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {item.notes}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            {!isPurchased && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/20"
                  onClick={handlePurchase}
                  disabled={isPurchasing || isDeleting}
                  title="Mark as Purchased"
                >
                  {isPurchasing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4" />}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={handleDelete}
                  disabled={isPurchasing || isDeleting}
                  title="Delete"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </Button>
              </>
            )}
            {isPurchased && (
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                Purchased
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
