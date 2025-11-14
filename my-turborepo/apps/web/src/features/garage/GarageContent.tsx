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
        className="bg-black/50 backdrop-blur-lg rounded-2xl p-4 text-white flex flex-col gap-4"
        style={{
          border: '1px solid rgba(255, 255, 255, 0.3)',
          transition: 'all 0.3s ease-out',
        }}
        onMouseEnter={(e) => {
          if (!isDragging) {
            e.currentTarget.style.transform = 'scale(1.05)'
            e.currentTarget.style.border = '1px solid rgb(132, 204, 22)'
            e.currentTarget.style.boxShadow = '0 0 30px rgba(132, 204, 22, 0.6)'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.3)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <div className="absolute top-2 left-2 z-10">
          <span className={`w-3 h-3 rounded-full ${getStatusColor(vehicle.current_status)}`}></span>
        </div>
        <div className="w-full aspect-video overflow-hidden rounded-lg bg-white/10">
          <ImageWithTimeoutFallback
            src={vehicle.image_url || "https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop&crop=center"}
            fallbackSrc="/branding/fallback-logo.png"
            alt={`${vehicle.name} vehicle`}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-bold text-lg">{vehicle.name}</h3>
          </div>
          <div className="text-right text-xs text-gray-400 leading-tight">
            {(() => {
              const { line1, line2 } = formatYmmt(vehicle.ymmt)
              return (
                <>
                  <div>{line1}</div>
                  {line2 && <div>{line2}</div>}
                </>
              )
            })()}
          </div>
        </div>
        <div className="text-xs text-gray-400">
          {vehicle.odometer ? `${vehicle.odometer.toLocaleString()} mi` : 'No mileage'}
        </div>
      </div>
    </div>
  )
}

function AddVehicleCard({ onClick }: { onClick: () => void }) {
  return (
    <Card
      className="min-h-[250px] border-2 border-dashed border-gray-700 bg-transparent hover:bg-gray-900/50 hover:border-red-500/50 transition-colors duration-300 cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="flex items-center justify-center h-full p-6">
        <div className="flex flex-col items-center justify-center text-gray-400 hover:text-red-400 transition-colors duration-300">
          <Plus className="text-4xl mb-2" />
          <span className="text-sm font-semibold">Add a Vehicle</span>
        </div>
      </CardContent>
    </Card>
  )
}

function VehicleGallery({
  title,
  vehicles,
  showAddCard,
  onAddClick,
  onLoadMore,
  loadingMore,
  hasMore,
  onDrop,
  galleryType
}: {
  title: string
  vehicles: VehicleWithOdometer[]
  showAddCard?: boolean
  onAddClick?: () => void
  onLoadMore?: () => void
  loadingMore?: boolean
  hasMore?: boolean
  onDrop?: (vehicleId: string, newStatus: string) => void
  galleryType?: 'active' | 'stored'
}) {
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [draggingVehicleId, setDraggingVehicleId] = useState<string | null>(null)
  // Infinite scroll logic
  const handleScroll = useCallback(() => {
    if (!onLoadMore || loadingMore || !hasMore) return

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const windowHeight = window.innerHeight
    const documentHeight = document.documentElement.scrollHeight

    // Load more when user is within 300px of the bottom
    if (scrollTop + windowHeight >= documentHeight - 300) {
      onLoadMore()
    }
  }, [onLoadMore, loadingMore, hasMore])

  useEffect(() => {
    if (onLoadMore) {
      window.addEventListener('scroll', handleScroll)
      return () => window.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll, onLoadMore])

  if (vehicles.length === 0 && !showAddCard) {
    return null
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOver(true)
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOver(false)
    
    const vehicleId = e.dataTransfer.getData('vehicleId')
    const currentStatus = e.dataTransfer.getData('currentStatus')
    
    if (vehicleId && onDrop && galleryType) {
      const newStatus = galleryType === 'active' ? 'daily_driver' : 'parked'
      if (currentStatus !== newStatus) {
        onDrop(vehicleId, newStatus)
      }
    }
    setDraggingVehicleId(null)
  }

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>
      <div 
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 transition-all duration-300 ${
          isDraggingOver ? 'bg-green-500/10 border-2 border-dashed border-green-500 rounded-lg p-4' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {vehicles.map((vehicle) => (
          <VehicleCard 
            key={vehicle.id} 
            vehicle={vehicle}
            onDragStart={() => setDraggingVehicleId(vehicle.id)}
            onDragEnd={() => setDraggingVehicleId(null)}
            isDragging={draggingVehicleId === vehicle.id}
          />
        ))}

        {showAddCard && (
          <AddVehicleCard onClick={onAddClick || (() => {})} />
        )}
      </div>

      {loadingMore && (
        <div className="flex justify-center mt-8">
          <div className="text-gray-400">Loading more vehicles...</div>
        </div>
      )}
    </div>
  )
}

type GarageContentProps = {
  initialVehicles: VehicleWithOdometer[]
  preferredVehicleId: string | null
}

export function GarageContent({
  initialVehicles,
  preferredVehicleId,
}: GarageContentProps) {
  // Use server-fetched data as initial state
  const [activeVehicles, setActiveVehicles] = useState<VehicleWithOdometer[]>(
    initialVehicles.filter(vehicle => vehicle.current_status === 'daily_driver')
  )
  const [storedVehiclesLocal, setStoredVehiclesLocal] = useState<VehicleWithOdometer[]>([])

  // For stored vehicles, we still need the hook since they load progressively
  const { vehicles: storedVehicles, isLoading: storedLoading, loadingMore, hasMore, loadMore } = useStoredVehicles()
  const [addVehicleModalOpen, setAddVehicleModalOpen] = useState(false)

  // Show add vehicle card only if active vehicles < 3
  const canAddVehicle = activeVehicles.length < 3

  // Sync stored vehicles from hook
  useEffect(() => {
    setStoredVehiclesLocal(storedVehicles)
  }, [storedVehicles])

  // Real-time subscription to vehicle status changes
  useEffect(() => {
    let subscription: any = null

    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      subscription = supabase
        .channel('vehicle-status-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'user_vehicle',
            filter: `owner_id=eq.${user.id}`,
          },
          (payload) => {
            const updatedVehicle = payload.new as any
            const vehicleId = updatedVehicle.id
            const newStatus = updatedVehicle.current_status

            // Update active vehicles
            setActiveVehicles((prev) => {
              const isActive = newStatus === 'daily_driver'
              const vehicleIndex = prev.findIndex((v) => v.id === vehicleId)
              
              if (isActive && vehicleIndex === -1) {
                // Vehicle became active, add it
                const vehicle = initialVehicles.find((v) => v.id === vehicleId)
                if (vehicle) {
                  return [...prev, { ...vehicle, current_status: newStatus }]
                }
              } else if (!isActive && vehicleIndex !== -1) {
                // Vehicle became inactive, remove it
                return prev.filter((v) => v.id !== vehicleId)
              } else if (vehicleIndex !== -1) {
                // Update existing vehicle status
                return prev.map((v) =>
                  v.id === vehicleId ? { ...v, current_status: newStatus } : v
                )
              }
              return prev
            })

            // Update stored vehicles
            setStoredVehiclesLocal((prev) => {
              const isStored = newStatus !== 'daily_driver'
              const vehicleIndex = prev.findIndex((v) => v.id === vehicleId)
              
              if (isStored && vehicleIndex === -1) {
                // Vehicle became stored, add it
                const vehicle = initialVehicles.find((v) => v.id === vehicleId)
                if (vehicle) {
                  return [...prev, { ...vehicle, current_status: newStatus }]
                }
              } else if (!isStored && vehicleIndex !== -1) {
                // Vehicle became active, remove it
                return prev.filter((v) => v.id !== vehicleId)
              } else if (vehicleIndex !== -1) {
                // Update existing vehicle status
                return prev.map((v) =>
                  v.id === vehicleId ? { ...v, current_status: newStatus } : v
                )
              }
              return prev
            })
          }
        )
        .subscribe()
    }

    setupSubscription()

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [initialVehicles])

  // Function to handle vehicle status change via drag and drop
  const handleVehicleStatusChange = async (vehicleId: string, newStatus: string) => {
    // Optimistically update the UI immediately
    const vehicleToMove = activeVehicles.find(v => v.id === vehicleId) || 
                         storedVehiclesLocal.find(v => v.id === vehicleId) ||
                         storedVehicles.find(v => v.id === vehicleId)
    
    if (!vehicleToMove) return

    const updatedVehicle = { ...vehicleToMove, current_status: newStatus }
    const isActive = newStatus === 'daily_driver'

    // Update active vehicles immediately
    setActiveVehicles((prev) => {
      if (isActive) {
        // Moving to active - add if not already there
        const exists = prev.find(v => v.id === vehicleId)
        if (exists) {
          return prev.map(v => v.id === vehicleId ? updatedVehicle : v)
        }
        return [...prev, updatedVehicle]
      } else {
        // Moving away from active - remove
        return prev.filter(v => v.id !== vehicleId)
      }
    })

    // Update stored vehicles immediately
    setStoredVehiclesLocal((prev) => {
      if (!isActive) {
        // Moving to stored - add if not already there
        const exists = prev.find(v => v.id === vehicleId)
        if (exists) {
          return prev.map(v => v.id === vehicleId ? updatedVehicle : v)
        }
        return [...prev, updatedVehicle]
      } else {
        // Moving away from stored - remove
        return prev.filter(v => v.id !== vehicleId)
      }
    })

    // Then update via API
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/garage/update-vehicle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          vehicleId,
          status: newStatus,
        }),
      })

      if (!response.ok) {
        console.error('Failed to update vehicle status')
        // Revert on error - the realtime subscription will handle the correct state
      }
    } catch (err) {
      console.error('Error updating vehicle status:', err)
      // Revert on error - the realtime subscription will handle the correct state
    }
  }

  // Function to refresh garage data when vehicles are added or updated
  const handleVehicleAdded = () => {
    // For now, refresh the page to re-run the Server Component
    // In a more sophisticated implementation, you could refetch data via API
    window.location.reload()
  }

  // Combined stored vehicles (local + hook), excluding active vehicles
  const allStoredVehicles = [
    ...storedVehiclesLocal.filter(v => v.current_status !== 'daily_driver'),
    ...storedVehicles.filter(v => 
      v.current_status !== 'daily_driver' && 
      !storedVehiclesLocal.find(lv => lv.id === v.id) &&
      !activeVehicles.find(av => av.id === v.id)
    )
  ]

  return (
    <AuthProvider supabase={supabase}>
      <section className="relative py-12 bg-black min-h-screen">
        <div
          aria-hidden="true"
          className="absolute inset-0 grid grid-cols-2 -space-x-52 opacity-20"
        >
          <div className="blur-[106px] h-56 bg-gradient-to-br from-red-500 to-purple-400" />
          <div className="blur-[106px] h-32 bg-gradient-to-r from-cyan-400 to-sky-300" />
        </div>

        <div className="relative container px-4 md:px-6 pt-24">
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-white mb-2">My Garage</h1>
          </div>

          {/* Active Vehicles Section - uses server-fetched data */}
          <VehicleGallery
            title="Active Vehicles"
            vehicles={activeVehicles}
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
              <div className="text-gray-400">Loading stored vehicles...</div>
            </div>
          )}
        </div>
      </section>

      <AddVehicleModal {...({ open: addVehicleModalOpen, onOpenChange: setAddVehicleModalOpen, onVehicleAdded: handleVehicleAdded } as any)} />
    </AuthProvider>
  )
}
