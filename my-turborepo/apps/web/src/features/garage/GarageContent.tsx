'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useStoredVehicles } from '@/lib/hooks/useVehicles'
import { Card, CardContent } from '@repo/ui/card'
import AddVehicleModal from './add-vehicle-modal'
import { AuthProvider } from '@repo/ui/auth-context'
import { supabase } from '@/lib/supabase'
import { Plus } from 'lucide-react'
import { VehicleWithOdometer } from '@repo/types'

type ImageWithTimeoutFallbackProps = {
  src: string
  fallbackSrc: string
  alt: string
  className?: string
  timeout?: number
}

function ImageWithTimeoutFallback({
  src,
  fallbackSrc,
  alt,
  className,
  timeout = 3000
}: ImageWithTimeoutFallbackProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [showFallback, setShowFallback] = useState(false)
  const imgRef = React.useRef<HTMLImageElement>(null)

  useEffect(() => {
    // Check if image is already loaded (cached by browser)
    if (imgRef.current?.complete && imgRef.current?.naturalHeight !== 0) {
      setImageLoaded(true)
      return
    }

    const timer = setTimeout(() => {
      if (!imageLoaded) {
        setShowFallback(true)
      }
    }, timeout)

    return () => clearTimeout(timer)
  }, [timeout, imageLoaded, src])

  if (showFallback) {
    return (
      <img
        src={fallbackSrc}
        alt={alt}
        className={className}
      />
    )
  }

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      className={className}
      onLoad={() => setImageLoaded(true)}
      onError={() => setShowFallback(true)}
    />
  )
}

function VehicleCard({
  vehicle,
  onDragStart,
  onDragEnd,
  isDragging
}: {
  vehicle: VehicleWithOdometer
  onDragStart?: () => void
  onDragEnd?: () => void
  isDragging?: boolean
}) {
  const router = useRouter()

  // Format status for display
  const formatStatus = (status: string) => {
    switch (status) {
      case 'daily_driver':
        return 'Active'
      case 'parked':
        return 'Parked'
      case 'listed':
        return 'Listed'
      case 'sold':
        return 'Sold'
      case 'retired':
        return 'Retired'
      default:
        return status.charAt(0).toUpperCase() + status.slice(1)
    }
  }

  // Get status color for the indicator dot
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'daily_driver':
        return 'bg-green-500' // Active - green
      case 'parked':
      case 'listed':
        return 'bg-yellow-500' // Parked/Listed - yellow
      case 'sold':
      case 'retired':
        return 'bg-red-500' // Sold/Retired - red
      default:
        return 'bg-gray-500'
    }
  }

  // Format YMMT to fit in 2 lines with max 30 chars per line
  const formatYmmt = (ymmt: string) => {
    if (!ymmt || ymmt.length <= 30) {
      return { line1: ymmt, line2: '' }
    }

    // Try to split at word boundaries within 30 chars
    const words = ymmt.split(' ')
    let line1 = ''
    let line2 = ''

    for (const word of words) {
      if (line1.length + word.length + 1 <= 30) {
        line1 += (line1 ? ' ' : '') + word
      } else if (!line2) {
        line2 = word
      } else if (line2.length + word.length + 1 <= 30) {
        line2 += ' ' + word
      } else {
        // If second line would exceed 30 chars, truncate with ellipsis
        line2 = line2.substring(0, 27) + '...'
        break
      }
    }

    return { line1, line2 }
  }

  const handleClick = () => {
    // Use nickname for URL
    // Next.js handles URL encoding automatically
    const urlSlug = vehicle.nickname || vehicle.id
    router.push(`/vehicle/${urlSlug}`)
  }

  return (
    <div
      className={`group transition-all duration-300 cursor-pointer ${isDragging ? 'opacity-50' : ''}`}
      onClick={handleClick}
      draggable={!!onDragStart}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('vehicleId', vehicle.id)
        e.dataTransfer.setData('currentStatus', vehicle.current_status)
        onDragStart?.()
      }}
      onDragEnd={() => {
        onDragEnd?.()
      }}
    >
      <div
        className="bg-card rounded-2xl p-4 text-foreground flex flex-col gap-4 border border-border"
        style={{
          transition: 'all 0.3s ease-out',
        }}
        onMouseEnter={(e) => {
          if (!isDragging) {
            e.currentTarget.style.transform = 'scale(1.05)'
            e.currentTarget.style.borderColor = 'hsl(var(--accent))'
            e.currentTarget.style.boxShadow = '0 0 30px hsl(var(--accent) / 0.6)'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.borderColor = 'hsl(var(--border))'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <div className="absolute top-2 left-2 z-10">
          <span className={`w-3 h-3 rounded-full ${getStatusColor(vehicle.current_status)}`}></span>
        </div>
        <div className="w-full aspect-video overflow-hidden rounded-lg bg-white/10">
          <ImageWithTimeoutFallback
            <div className="relative container px-4 md:px-6 pt-24">
            <div className="mb-10">
              <h1 className="text-4xl font-bold text-foreground mb-2">My Garage</h1>
            </div>

            {/* Active Vehicles Section - uses server-fetched data */}
            <VehicleGallery
              title="Active Vehicles"
              vehicles={uniqueActiveVehicles}
              showAddCard={canAddVehicle}
              onAddClick={() => setAddVehicleModalOpen(true)}
              onDrop={handleVehicleStatusChange}
              galleryType="active"
            />

            {/* Stored Vehicles Section - uses progressive loading */}
            <VehicleGallery
              title="Stored Vehicles"
              vehicles={allStoredVehicles}
              onLoadMore={loadMore}
              loadingMore={loadingMore}
              hasMore={hasMore}
              onDrop={handleVehicleStatusChange}
              galleryType="stored"
            />

            {storedLoading && storedVehicles.length === 0 && (
              <div className="flex justify-center mt-8">
                <div className="text-muted-foreground">Loading stored vehicles...</div>
              </div>
            )}
        </div>
      </section>

      <AddVehicleModal {...({ open: addVehicleModalOpen, onOpenChange: setAddVehicleModalOpen, onVehicleAdded: handleVehicleAdded } as any)} />
    </AuthProvider>
  )
}
