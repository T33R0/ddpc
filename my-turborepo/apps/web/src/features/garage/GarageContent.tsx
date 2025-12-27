
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useStoredVehicles } from '@/lib/hooks/useVehicles'
import { Card, CardContent } from '@repo/ui/card'
import AddVehicleModal from './add-vehicle-modal'
import { AuthProvider } from '@repo/ui/auth-context'
import { RealtimeChannel } from '@supabase/supabase-js'
import { Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { VehicleWithOdometer } from '@repo/types'
import { supabase } from '@/lib/supabase'
import { getVehicleSlug } from '@/lib/vehicle-utils-client'
import { VehicleCard } from '@/components/vehicle-card'

function AddVehicleCard({ onClick }: { onClick: () => void }) {
  return (
    <Card
      className="min-h-64 border-2 border-dashed border-border bg-transparent hover:bg-card/50 hover:border-accent/50 transition-colors duration-300 cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="flex items-center justify-center h-full p-6">
        <div className="flex flex-col items-center justify-center text-muted-foreground hover:text-accent transition-colors duration-300">
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
  allVehicles,
  showAddCard,
  onAddClick,
  onLoadMore,
  loadingMore,
  hasMore,
  onDrop,
  galleryType,
  isCollapsible,
  onSortChange,
  currentSort,
  onManualReorder
}: {
  title: string
  vehicles: VehicleWithOdometer[]
  allVehicles: VehicleWithOdometer[]
  showAddCard?: boolean
  onAddClick?: () => void
  onLoadMore?: () => void
  loadingMore?: boolean
  hasMore?: boolean
  onDrop?: (vehicleId: string, newStatus: string) => void
  galleryType?: 'active' | 'stored'
  isCollapsible?: boolean
  onSortChange?: (sort: string) => void
  currentSort?: string
  onManualReorder?: (draggedId: string, targetId: string) => void
}) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [draggingVehicleId, setDraggingVehicleId] = useState<string | null>(null)
  const router = useRouter()

  // Infinite scroll logic
  const handleScroll = useCallback(() => {
    if (!onLoadMore || loadingMore || !hasMore || (isCollapsible && !isExpanded)) return

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const windowHeight = window.innerHeight
    const documentHeight = document.documentElement.scrollHeight

    // Load more when user is within 300px of the bottom
    if (scrollTop + windowHeight >= documentHeight - 300) {
      onLoadMore()
    }
  }, [onLoadMore, loadingMore, hasMore, isCollapsible, isExpanded])

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

    if (vehicleId) {
      if (onDrop) {
        // Status change logic
        const newStatus = galleryType === 'active' ? 'active' : 'inactive'
        // If status is different, it's a move between galleries
        if (currentStatus !== newStatus) {
          onDrop(vehicleId, newStatus)
          setDraggingVehicleId(null)
          return
        }
      }
    }
    setDraggingVehicleId(null)
  }

  const handleCardDrop = (e: React.DragEvent, targetVehicleId: string) => {
    e.preventDefault()
    e.stopPropagation()
    const draggedId = e.dataTransfer.getData('vehicleId')
    const draggedStatus = e.dataTransfer.getData('currentStatus')

    // If dropping on a card in the SAME gallery (approx by checking if target is in this gallery)
    const isTargetInGallery = vehicles.find(v => v.id === targetVehicleId)
    const isDraggedInGallery = vehicles.find(v => v.id === draggedId)

    if (isTargetInGallery && isDraggedInGallery && onManualReorder) {
      onManualReorder(draggedId, targetVehicleId)
    } else if (onDrop && galleryType) {
      // Fallback to status change if moving between galleries
      const newStatus = galleryType === 'active' ? 'active' : 'inactive'
      if (draggedStatus !== newStatus) {
        onDrop(draggedId, newStatus)
      }
    }
    setIsDraggingOver(false)
    setDraggingVehicleId(null)
  }

  const formatStatus = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active'
      case 'inactive':
        return 'Inactive'
      case 'archived':
        return 'Archived'
      default:
        return status.charAt(0).toUpperCase() + status.slice(1)
    }
  }

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div
          className={`flex items-center gap-2 ${isCollapsible ? 'cursor-pointer select-none hover:text-accent transition-colors' : ''}`}
          onClick={() => isCollapsible && setIsExpanded(!isExpanded)}
        >
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          {isCollapsible && (
            isExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />
          )}
        </div>

        {/* Sort Controls - only show when expanded and sortable */}
        {isExpanded && onSortChange && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground hidden sm:inline">Sort by:</label>
            <select
              className="bg-card border border-border rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              value={currentSort}
              onChange={(e) => onSortChange(e.target.value)}
            >
              <option value="last_edited">Last Edited</option>
              <option value="year">Year</option>
              <option value="status">Status</option>
              <option value="ownership_period">Ownership Period</option>
              <option value="custom">Manual</option>
            </select>
          </div>
        )}
      </div>

      {isExpanded && (
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 transition-all duration-300 ${isDraggingOver ? 'bg-green-500/10 border-2 border-dashed border-green-500 rounded-lg p-4' : ''
            }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              onDragOver={(e) => {
                e.preventDefault() // Allow drop
                e.stopPropagation()
              }}
              onDrop={(e) => handleCardDrop(e, vehicle.id)}
            >
              <VehicleCard
                title={vehicle.nickname || vehicle.name}
                subtitle={vehicle.ymmt}
                status={vehicle.current_status}
                imageUrl={vehicle.vehicle_image || vehicle.image_url}
                onClick={() => {
                  const urlSlug = getVehicleSlug(vehicle, allVehicles)
                  router.push(`/vehicle/${urlSlug}`)
                }}
                footer={
                  <>
                    <div className="text-xs text-muted-foreground">
                      {vehicle.odometer ? `${vehicle.odometer.toLocaleString()} mi` : 'No mileage'}
                    </div>
                    <div className="text-xs text-muted-foreground font-semibold">
                      {formatStatus(vehicle.current_status)}
                    </div>
                  </>
                }
                isDragging={draggingVehicleId === vehicle.id}
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = 'move'
                  e.dataTransfer.setData('vehicleId', vehicle.id)
                  e.dataTransfer.setData('currentStatus', vehicle.current_status)
                  setDraggingVehicleId(vehicle.id)
                }}
                onDragEnd={() => setDraggingVehicleId(null)}
                showDragHandle={true}
              />
            </div>
          ))}

          {showAddCard && (
            <AddVehicleCard onClick={onAddClick || (() => { })} />
          )}
        </div>
      )}

      {isExpanded && loadingMore && (
        <div className="flex justify-center mt-8">
          <div className="text-muted-foreground">Loading more vehicles...</div>
        </div>
      )}
    </div>
  )
}

type GarageContentProps = {
  initialVehicles: VehicleWithOdometer[]
}

export function GarageContent({
  initialVehicles,
}: GarageContentProps) {
  const router = useRouter()
  // Use server-fetched data as initial state, ensuring no duplicates
  const initialActive = initialVehicles.filter(vehicle => vehicle.current_status === 'active')
  const uniqueInitialActive = initialActive.filter((v, index, self) =>
    index === self.findIndex((t) => t.id === v.id)
  )

  const [activeVehicles, setActiveVehicles] = useState<VehicleWithOdometer[]>(uniqueInitialActive)
  const [storedVehiclesLocal, setStoredVehiclesLocal] = useState<VehicleWithOdometer[]>([])

  // Sorting State
  const [storedSortBy, setStoredSortBy] = useState('last_edited')

  // For stored vehicles, we still need the hook since they load progressively
  // We pass sort params to the hook
  const {
    vehicles: storedVehicles,
    isLoading: storedLoading,
    loadingMore,
    hasMore,
    loadMore
  } = useStoredVehicles({
    sort_by: storedSortBy,
    sort_direction: storedSortBy === 'year' || storedSortBy === 'last_edited' ? 'desc' : 'asc'
  })

  const [addVehicleModalOpen, setAddVehicleModalOpen] = useState(false)

  // Show add vehicle card only if active vehicles < 3
  const canAddVehicle = activeVehicles.length < 3

  // Combined stored vehicles (local + hook), excluding active vehicles and duplicates
  // We need to respect the sort order here if possible, but local optimisitic updates make this tricky.
  // Ideally, useStoredVehicles returns the sorted list.
  // Local updates should be minimized or re-fetched.
  // For manual reordering, we need to manage the order in local state overriding the hook.

  const [manualOrderVehicles, setManualOrderVehicles] = useState<VehicleWithOdometer[]>([])
  const [isManualSort, setIsManualSort] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Load manual order from localStorage on mount
  useEffect(() => {
    try {
      const savedOrder = localStorage.getItem('garage-manual-order')
      if (savedOrder) {
        const orderMap = JSON.parse(savedOrder) as string[]
        if (Array.isArray(orderMap) && orderMap.length > 0) {
          // If we have a saved order, we might want to default to manual sort?
          // Or just have the order ready.
          // The user requirement says "reorder... and that ordering sticks".
          // If we switch to 'custom', we need the list.
          // We can't fully reconstruct the list until we have vehicles.
        }
      }
      const savedSortMode = localStorage.getItem('garage-sort-mode')
      if (savedSortMode === 'custom') {
        setIsManualSort(true)
      } else if (savedSortMode) {
        setStoredSortBy(savedSortMode)
      }
    } catch (e) {
      console.error('Failed to load garage settings', e)
    }
    setIsInitialized(true)
  }, [])

  // Save sort mode to localStorage
  useEffect(() => {
    if (!isInitialized) return
    localStorage.setItem('garage-sort-mode', isManualSort ? 'custom' : storedSortBy)
  }, [isManualSort, storedSortBy, isInitialized])

  // Save manual order to localStorage
  useEffect(() => {
    if (!isInitialized || !isManualSort || manualOrderVehicles.length === 0) return
    const orderIds = manualOrderVehicles.map(v => v.id)
    localStorage.setItem('garage-manual-order', JSON.stringify(orderIds))
  }, [manualOrderVehicles, isManualSort, isInitialized])

  // Update manual order list when hook updates
  // If we are in manual mode, we need to respect the saved order
  // And merge in new vehicles
  useEffect(() => {
    if (!isManualSort) return

    // Merge current fetched vehicles into manual list
    // Logic:
    // 1. Start with existing manualOrderVehicles (if any) or create from saved order
    // 2. Add any new vehicles from storedVehicles that aren't in the list
    // 3. Update data for existing vehicles in the list

    setManualOrderVehicles(prev => {
      let baseList = prev

      // If list is empty, try to load from saved order + storedVehicles
      if (baseList.length === 0) {
        try {
          const savedOrder = JSON.parse(localStorage.getItem('garage-manual-order') || '[]') as string[]
          if (savedOrder.length > 0) {
            // Sort storedVehicles according to savedOrder
            // Vehicles not in savedOrder go to the end
            const vehicleMap = new Map(storedVehicles.map(v => [v.id, v]))
            const ordered: VehicleWithOdometer[] = []
            const usedIds = new Set<string>()

            savedOrder.forEach(id => {
              const v = vehicleMap.get(id)
              if (v) {
                ordered.push(v)
                usedIds.add(id)
              }
            })

            storedVehicles.forEach(v => {
              if (!usedIds.has(v.id)) {
                ordered.push(v)
              }
            })

            baseList = ordered
          } else {
            baseList = storedVehicles
          }
        } catch {
          baseList = storedVehicles
        }
      } else {
        // Update existing items in baseList with new data from storedVehicles
        // And append new items
        const currentIds = new Set(baseList.map(v => v.id))
        const newItems = storedVehicles.filter(v => !currentIds.has(v.id))

        baseList = baseList.map(v => {
          const updated = storedVehicles.find(sv => sv.id === v.id)
          return updated ? updated : v
        })

        if (newItems.length > 0) {
          baseList = [...baseList, ...newItems]
        }
      }

      // Filter out vehicles that moved to active
      // (This is handled by effectiveStoredVehicles logic usually, but here we manage the source list)
      return baseList
    })
  }, [storedVehicles, isManualSort])

  const effectiveStoredVehicles = React.useMemo(() => {
    if (isManualSort && manualOrderVehicles.length > 0) {
      return manualOrderVehicles.filter(v =>
        v.current_status !== 'active' &&
        !activeVehicles.find(av => av.id === v.id)
      );
    }

    // Standard mode: Merge local optimistic updates + hook data
    const filteredFromHook = storedVehicles.filter(v =>
      v.current_status !== 'active' &&
      !activeVehicles.find(av => av.id === v.id)
    )

    // Keep vehicles that were optimistically added but aren't in hook yet
    const optimisticOnly = storedVehiclesLocal.filter(lv =>
      lv.current_status !== 'active' &&
      !activeVehicles.find(av => av.id === lv.id) &&
      !filteredFromHook.find(hv => hv.id === lv.id)
    )

    // Combine: optimistic-only vehicles + hook vehicles (avoiding duplicates)
    const combined = [...optimisticOnly]
    filteredFromHook.forEach(hv => {
      if (!combined.find(cv => cv.id === hv.id)) {
        combined.push(hv)
      }
    })

    return combined;
  }, [storedVehicles, storedVehiclesLocal, activeVehicles, isManualSort, manualOrderVehicles])

  const handleSortChange = (newSort: string) => {
    if (newSort === 'custom') {
      setIsManualSort(true)
      // Trigger the useEffect to populate manualOrderVehicles
      setManualOrderVehicles([]) // Reset to trigger reconstruction from current data + storage
    } else {
      setIsManualSort(false)
      setStoredSortBy(newSort)
    }
  }

  const handleManualReorder = (draggedId: string, targetId: string) => {
    // Switch to manual sort if not already
    if (!isManualSort) {
      setIsManualSort(true)
      setManualOrderVehicles([...effectiveStoredVehicles])
    }

    setManualOrderVehicles(prev => {
      // If prev is empty (first drag), initialize it
      const list = prev.length > 0 ? prev : [...effectiveStoredVehicles]

      const currentIndex = list.findIndex(v => v.id === draggedId)
      const targetIndex = list.findIndex(v => v.id === targetId)

      if (currentIndex === -1 || targetIndex === -1) return list

      const newList = [...list]
      const [movedItem] = newList.splice(currentIndex, 1)
      if (movedItem) {
        newList.splice(targetIndex, 0, movedItem)
      }
      return newList
    })
  }

  // All known vehicles for slug generation context
  const allKnownVehicles = [...activeVehicles, ...effectiveStoredVehicles]


  // Real-time subscription to vehicle status changes
  useEffect(() => {
    let subscription: RealtimeChannel | null = null

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
            const updatedVehicle = payload.new as VehicleWithOdometer
            const vehicleId = updatedVehicle.id
            const newStatus = updatedVehicle.current_status

            // Update active vehicles
            setActiveVehicles((prev) => {
              const isActive = newStatus === 'active'
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
              const isStored = newStatus !== 'active'
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
      effectiveStoredVehicles.find(v => v.id === vehicleId) ||
      storedVehicles.find(v => v.id === vehicleId)

    if (!vehicleToMove) return

    const updatedVehicle = { ...vehicleToMove, current_status: newStatus }
    const isActive = newStatus === 'active'

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

    // Update manual list if in manual mode
    if (isManualSort) {
      setManualOrderVehicles((prev) => {
        if (!isActive) {
          const exists = prev.find(v => v.id === vehicleId)
          if (exists) return prev.map(v => v.id === vehicleId ? updatedVehicle : v)
          return [...prev, updatedVehicle]
        } else {
          return prev.filter(v => v.id !== vehicleId)
        }
      })
    }

    // Then update via API
    try {
      const response = await fetch('/api/garage/update-vehicle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          vehicleId,
          status: newStatus,
        }),
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        console.error('Failed to update vehicle status:', {
          status: response.status,
          statusText: response.statusText,
          error: result
        })

        // Show user-friendly error message
        const errorMessage = result.error || result.details || 'Unknown error'
        alert(`Failed to update vehicle status: ${errorMessage}${result.hint ? '\n\n' + result.hint : ''}`)

        // Revert optimistic update on error
        router.refresh()
        return
      }

      // Verify the response indicates success
      if (!result.success && !result.vehicle) {
        console.error('Update response missing success indicator:', result)
        alert('Update may have failed. Please check the console for details.')
        router.refresh()
        return
      }

      console.log('Vehicle status updated successfully:', {
        vehicleId: result.vehicle?.id,
        newStatus: result.vehicle?.current_status,
        response: result
      })

      // Soft refresh to update server state without page flash
      router.refresh()
    } catch (err) {
      console.error('Error updating vehicle status:', err)
      // Revert on error - the realtime subscription will handle the correct state
    }
  }

  // Function to refresh garage data when vehicles are added or updated
  const handleVehicleAdded = () => {
    // Soft refresh to re-run the Server Component without page flash
    router.refresh()
  }

  // Remove duplicates from active vehicles (safety check)
  const uniqueActiveVehicles = React.useMemo(() => activeVehicles.filter((v, index, self) =>
    index === self.findIndex((t) => t.id === v.id)
  ), [activeVehicles])

  // Update state if duplicates found
  useEffect(() => {
    if (activeVehicles.length !== uniqueActiveVehicles.length) {
      setActiveVehicles(uniqueActiveVehicles)
    }
  }, [activeVehicles.length, uniqueActiveVehicles])

  // Refresh data when page becomes visible (handles navigation from vehicle page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Refetch vehicles to ensure we have latest status
        const refreshData = async () => {
          try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: vehicles } = await supabase
              .from('user_vehicle')
              .select('id, current_status, vehicle_image')
              .eq('owner_id', user.id)

            if (vehicles) {
              // Update active vehicles - remove any that shouldn't be active
              setActiveVehicles((prev) => {
                const activeIds = vehicles.filter(v => v.current_status === 'active').map(v => v.id)
                return prev
                  .filter(v => activeIds.includes(v.id))
                  .map(v => {
                    const updated = vehicles.find(uv => uv.id === v.id)
                    return updated ? { ...v, current_status: updated.current_status, vehicle_image: updated.vehicle_image } : v
                  })
              })

              // Update stored vehicles - remove any that are now active
              setStoredVehiclesLocal((prev) => {
                const storedIds = vehicles.filter(v => v.current_status !== 'active').map(v => v.id)
                return prev
                  .filter(v => storedIds.includes(v.id))
                  .map(v => {
                    const updated = vehicles.find(uv => uv.id === v.id)
                    return updated ? { ...v, current_status: updated.current_status, vehicle_image: updated.vehicle_image } : v
                  })
              })
            }
          } catch (err) {
            console.error('Error refreshing vehicle data:', err)
          }
        }

        refreshData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  return (
    <AuthProvider supabase={supabase}>
      <section className="relative py-12 bg-background min-h-screen">
        <div
          aria-hidden="true"
          className="absolute inset-0 grid grid-cols-2 -space-x-52 opacity-20"
        >
          <div className="blur-[106px] h-56 bg-gradient-to-br from-red-500 to-purple-400" />
          <div className="blur-[106px] h-32 bg-gradient-to-r from-cyan-400 to-sky-300" />
        </div>

        <div className="relative container px-4 md:px-6 pt-24">
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-foreground mb-2">My Garage</h1>
          </div>

          {/* Active Vehicles Section - uses server-fetched data */}
          <VehicleGallery
            title="Active Vehicles"
            vehicles={uniqueActiveVehicles}
            allVehicles={allKnownVehicles}
            showAddCard={canAddVehicle}
            onAddClick={() => setAddVehicleModalOpen(true)}
            onDrop={handleVehicleStatusChange}
            galleryType="active"
            isCollapsible={false}
          />

          {/* Stored Vehicles Section - uses progressive loading */}
          <VehicleGallery
            title="Stored Vehicles"
            vehicles={effectiveStoredVehicles}
            allVehicles={allKnownVehicles}
            onLoadMore={loadMore}
            loadingMore={loadingMore}
            hasMore={hasMore}
            onDrop={handleVehicleStatusChange}
            galleryType="stored"
            isCollapsible={true}
            onSortChange={handleSortChange}
            currentSort={isManualSort ? 'custom' : storedSortBy}
            onManualReorder={handleManualReorder}
          />

          {storedLoading && storedVehicles.length === 0 && (
            <div className="flex justify-center mt-8">
              <div className="text-muted-foreground">Loading stored vehicles...</div>
            </div>
          )}
        </div>
      </section>

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <AddVehicleModal {...({ open: addVehicleModalOpen, onOpenChange: setAddVehicleModalOpen, onVehicleAdded: handleVehicleAdded } as any)} />
    </AuthProvider>
  )
}
