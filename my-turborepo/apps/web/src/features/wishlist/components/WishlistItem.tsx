'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@repo/ui/card'
import { Button } from '@repo/ui/button'
import { Badge } from '@repo/ui/badge'
import { ExternalLink, Trash2, ShoppingBag, Loader2, Plus } from 'lucide-react'
import { deleteWishlistItem } from '../actions'
import { useRouter } from 'next/navigation'

// Migrated to 'inventory' schema
interface WishlistItemProps {
  item: {
    id: string
    name: string
    purchase_url: string | null
    purchase_price: number | null
    priority: number // 1-5
    status: 'wishlist' | 'purchased' | string
    vehicle_id: string
    category?: string | null
  }
  onUpdate?: () => void
  onAddToJob?: (id: string) => void
}

export function WishlistItemCard({ item, onUpdate, onEdit, onAddToJob }: WishlistItemProps & { onEdit?: (item: any) => void }) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
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

  // "Purchased" in the context of history means fully closed/archived.
  // "Ordered" means it's active but bought.
  const isHistory = item.status === 'purchased'
  const isOrdered = item.status === 'ordered'

  // Priority Badge Logic
  const renderPriorityBadge = (priority: number) => {
    let colorClass = 'text-muted-foreground border-border'
    if (priority >= 5) colorClass = 'text-destructive border-destructive/50'
    else if (priority >= 3) colorClass = 'text-yellow-500 border-yellow-500/50'

    return (
      <Badge variant="outline" className={`text-xs py-0 h-5 ${colorClass}`}>
        P{priority}
      </Badge>
    )
  }

  // Helper to ensure URL is absolute
  const formatUrl = (url: string) => {
    if (!url) return ''
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }
    return `https://${url}`
  }

  return (
    <Card
      className={`mb-3 transition-colors ${!isHistory ? 'cursor-pointer hover:border-primary/50' : ''} ${isHistory ? 'opacity-60 bg-muted/50' : ''}`}
      onClick={() => !isHistory && onEdit?.(item)}
    >

      <CardContent className="p-4">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-medium ${isHistory ? 'line-through text-muted-foreground' : ''}`}>
                {item.name}
              </span>

              {!isHistory && renderPriorityBadge(item.priority)}
              {item.category && (
                <Badge variant="secondary" className="text-xs py-0 h-5 capitalize">
                  {item.category.replace('_', ' ')}
                </Badge>
              )}
              {isOrdered && (
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-xs py-0 h-5">
                  Ordered
                </Badge>
              )}
            </div>

            <div className="text-sm text-muted-foreground flex items-center gap-3">
              {item.purchase_price && (
                <span className="font-medium text-foreground">
                  ${item.purchase_price.toLocaleString()}
                </span>
              )}
              {item.purchase_url && (
                <a
                  href={formatUrl(item.purchase_url)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center hover:text-primary transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  Link <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            {onAddToJob && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                onClick={(e) => {
                  e.stopPropagation()
                  onAddToJob(item.id)
                }}
                title="Add to Job"
              >
                <Plus className="w-4 h-4" />
              </Button>
            )}

            {!isHistory && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={handleDelete}
                disabled={isDeleting}
                title="Delete"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </Button>
            )}
            {isHistory && (
              <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                Purchased
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
