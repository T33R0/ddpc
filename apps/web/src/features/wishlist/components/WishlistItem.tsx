'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@repo/ui/card'
import { Button } from '@repo/ui/button'
import { Badge } from '@repo/ui/badge'
import { ExternalLink, Trash2, ShoppingBag, Loader2, Plus } from 'lucide-react'
import { deleteWishlistItem } from '../actions'
import { cn } from '@repo/ui/lib/utils'
import { useRouter } from 'next/navigation'
import { getTrackingLink } from '@/features/workshop/utils';

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
    tracking_number?: string | null
    carrier?: string | null
  }
  onUpdate?: () => void
  onAddToJob?: (id: string) => void
  onMarkArrived?: (id: string) => void
}

export function WishlistItemCard({ item, onUpdate, onEdit, onAddToJob, onMarkArrived }: WishlistItemProps & { onEdit?: (item: any) => void }) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  // Delete is now handled in the edit dialog
  // const handleDelete = async (e: React.MouseEvent) => { ... }

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
      className={cn(
        "mb-2 transition-colors h-22 flex flex-col justify-center relative", // Reduced height to h-22 (88px)
        !isHistory ? 'cursor-pointer hover:border-primary/50' : '',
        isHistory ? 'opacity-60 bg-muted/50' : ''
      )}
      onClick={() => !isHistory && onEdit?.(item)}
    >

      <CardContent className="p-3"> {/* Reduced padding */}
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 space-y-1 overflow-hidden">
            <div className="flex items-center gap-2 flex-wrap pr-2">
              <span className={`font-medium truncate max-w-[200px] ${isHistory ? 'line-through text-muted-foreground' : ''}`} title={item.name}>
                {item.name}
              </span>

              {/* Inline Categories */}
              {item.category && (
                <Badge variant="secondary" className="text-[10px] px-1.5 h-4 capitalize opacity-70">
                  {item.category.replace('_', ' ')}
                </Badge>
              )}

              {!isHistory && renderPriorityBadge(item.priority)}

              {isOrdered && (
                <div className="flex gap-1">
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs py-0 h-5">
                    Ordered
                  </Badge>
                  {item.tracking_number && (
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:bg-muted text-xs py-0 h-5 border-dashed gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(getTrackingLink(item.tracking_number!, item.carrier), '_blank');
                      }}
                    >
                      <span className="opacity-70">🚚</span> {item.tracking_number}
                    </Badge>
                  )}
                </div>
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

          <div className="flex flex-col gap-1 items-end justify-center self-center">
            {onAddToJob && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-info hover:text-info/90 hover:bg-info/10"
                onClick={(e) => {
                  e.stopPropagation()
                  onAddToJob(item.id)
                }}
                title="Add to Job"
              >
                <Plus className="w-4 h-4" />
              </Button>
            )}

            {isOrdered && onMarkArrived && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-[10px] px-2 gap-1 border-dashed text-success hover:text-success/90 hover:bg-success/10 hover:border-success/20"
                onClick={(e) => {
                  e.stopPropagation()
                  onMarkArrived(item.id)
                }}
                title="Mark Arrived"
              >
                📦 Arrived
              </Button>
            )}

            {/* Delete button removed from here */}

            {isHistory && (
              <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                Purchased
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card >
  )
}
