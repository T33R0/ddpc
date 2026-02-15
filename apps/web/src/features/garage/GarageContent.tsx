
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
import { User } from '@supabase/supabase-js'

// Extended interface to include stats
interface VehicleWithStats extends VehicleWithOdometer {
  avg_mpg?: number | null
  record_count?: number
}

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
  vehicles: VehicleWithStats[]
  allVehicles: VehicleWithStats[]
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
  onManualReorder?: (vehicles: VehicleWithStats[]) => void
}) {
  const [isOpen, setIsOpen] = useState(true)
  const router = useRouter()
  // Local state for dragging to prevent layout shifts during drag
  const [localVehicles, setLocalVehicles] = useState(vehicles)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  // Sync local vehicles when props change, but NOT while dragging
  useEffect(() => {
    if (!draggingId) {
      setLocalVehicles(vehicles)
    }
  }, [vehicles, draggingId])

  const handleDragStart = (e: React.DragEvent, vehicleId: string) => {
    e.dataTransfer.setData('vehicleId', vehicleId)
    e.dataTransfer.effectAllowed = 'move'
    setDraggingId(vehicleId)
  }

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggingId || draggingId === targetId || !onManualReorder) return

    // Find indexes
    const currentIndex = localVehicles.findIndex(v => v.id === draggingId)
    const targetIndex = localVehicles.findIndex(v => v.id === targetId)

    if (currentIndex === -1 || targetIndex === -1) return

    // Reorder locally
    const newVehicles = [...localVehicles]
    const [moved] = newVehicles.splice(currentIndex, 1)
    if (moved) {
      newVehicles.splice(targetIndex, 0, moved)
    }

    setLocalVehicles(newVehicles)
    onManualReorder(newVehicles)
  }

  const handleDragEnd = () => {
    setDraggingId(null)
  }

  const cardCount = localVehicles.length + (showAddCard ? 1 : 0)

  if (localVehicles.length === 0 && !showAddCard) return null

  return (
    <div className="mb-8">
      {isCollapsible ? (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-xl font-semibold mb-4 text-foreground/80 hover:text-foreground transition-colors w-full group"
        >
          {isOpen ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          <span>{title}</span>
          <span className="text-sm font-normal text-muted-foreground ml-2">
            ({localVehicles.length})
          </span>
          {/* Visual separator line */}
          <div className="h-px bg-border flex-1 ml-4 group-hover:bg-accent/50 transition-colors" />
        </button>
      ) : (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{title}</h2>
          {/* Sort Dropdown (Basic Implementation) */}
          {onSortChange && currentSort && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <select
                className="bg-background border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                value={currentSort}
                onChange={(e) => onSortChange(e.target.value)}
              >
                <option value="recent">Recently Added</option>
                <option value="year_desc">Year (Newest)</option>
                <option value="year_asc">Year (Oldest)</option>
                <option value="make">Make</option>
                <option value="manual">Manual</option>
              </select>
            </div>
          )}
        </div>
      )}

      {isOpen && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
          {localVehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              draggable={!!onManualReorder}
              onDragStart={(e) => handleDragStart(e, vehicle.id)}
              onDragOver={(e) => handleDragOver(e, vehicle.id)}
              onDragEnd={handleDragEnd}
              onDrop={(e) => {
                // Prevent dropping on itself or other lists handled by standard drop
                e.preventDefault();
              }}
              className="h-full"
            >
              <VehicleCard
                title={vehicle.nickname || vehicle.name}
                subtitle={vehicle.ymmt}
                status={vehicle.current_status}
                imageUrl={vehicle.vehicle_image || vehicle.image_url} // Corrected property access
                onClick={() => {
                  const urlSlug = getVehicleSlug(vehicle, allVehicles)
                  router.push(`/vehicle/${urlSlug}`)
                }}
                isDragging={draggingId === vehicle.id}
                onDragStart={(e) => {
                  // This is for the "drag to status" functionality
                  // We need to set the vehicleId for the drop zone
                  if (onDrop) {
                    e.dataTransfer.setData('vehicleId', vehicle.id)
                    e.dataTransfer.setData('currentStatus', vehicle.current_status)
                    e.dataTransfer.effectAllowed = 'move'
                  }
                  // Also trigger local reorder start
                  handleDragStart(e, vehicle.id)
                }}
                onDragEnd={handleDragEnd}
                showDragHandle={!!onManualReorder} // Show handle only if reordering is allowed
                footer={
                  // Updated Footer: Odometer | Avg MPG | # Records
                  <div className="flex items-center justify-between w-full text-xs font-medium text-foreground/90">
                    <div className="flex items-center gap-1">
                      <span>{vehicle.odometer ? vehicle.odometer.toLocaleString() : '—'}</span>
                      <span className="text-foreground/60 font-normal">mi</span>
                    </div>
                    <div className="h-3 w-px bg-foreground/20 mx-2" />
                    <div className="flex items-center gap-1">
                      <span>{vehicle.avg_mpg ? vehicle.avg_mpg.toFixed(1) : '—'}</span>
                      <span className="text-foreground/60 font-normal">mpg</span>
                    </div>
                    <div className="h-3 w-px bg-foreground/20 mx-2" />
                    <div className="flex items-center gap-1">
                      <span>{vehicle.record_count || 0}</span>
                      <span className="text-foreground/60 font-normal">recs</span>
                    </div>
                  </div>
                }
              />
            </div>
          ))}

          {showAddCard && onAddClick && (
            <AddVehicleCard onClick={onAddClick} />
          )}
        </div>
      )}
      {/* Infinite Scroll Trigger */}
      {hasMore && (
        <div
          className="h-20 flex justify-center items-center mt-8 cursor-pointer hover:text-accent transition-colors"
          onClick={onLoadMore}
        >
          {loadingMore ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          ) : (
            <span className="text-muted-foreground text-sm">Load More</span>
          )}
        </div>
      )}
    </div>
  )
}

interface GarageContentProps {
  initialVehicles: VehicleWithStats[]
  user?: User | null
}

export function GarageContent({ initialVehicles, user }: GarageContentProps) {
  // Active vehicles state (initialized from server data)
  const [activeVehicles, setActiveVehicles] = useState<VehicleWithStats[]>(
    initialVehicles.filter(v => v.current_status === 'active' || v.current_status === 'project')
  )

  // Stored vehicles hook
  const {
    vehicles: storedVehiclesHook,
    isLoading: loading, // mapped to loading
    refetch: refresh,   // mapped to refresh
    loadMore,
    hasMore
  } = useStoredVehicles({})

  // For stored vehicles, we prefer the hook data (for pagination), but fallback/merge with initial for stats if needed.
  // Since hook data might miss stats, we could try to merge, but for now we'll just cast.
  // If hook data is empty and we have initial stored vehicles, show initial.
  const storedVehiclesRaw = storedVehiclesHook.length > 0
    ? storedVehiclesHook
    : initialVehicles.filter(v => v.current_status !== 'active' && v.current_status !== 'project');

  const storedVehicles = storedVehiclesRaw as VehicleWithStats[]

  // Combined list for "All Known Vehicles" (for slugs etc)
  const vehicles = [...activeVehicles, ...storedVehicles] // This is "allVehicles" for context

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // Sorting State
  const [sortOrder, setSortOrder] = useState<string>('recent')
  const [manuallyOrderedIds, setManuallyOrderedIds] = useState<string[]>([]);

  // Effect to load saved sort order from localStorage
  useEffect(() => {
    const savedSort = localStorage.getItem('garage_sort_order')
    if (savedSort) {
      setSortOrder(savedSort)
    }
    const savedManualOrder = localStorage.getItem('garage_manual_order');
    if (savedManualOrder) {
      try {
        setManuallyOrderedIds(JSON.parse(savedManualOrder));
      } catch (e) {
        console.error("Failed to parse manual order", e);
      }
    }
  }, [])

  const handleSortChange = (newSort: string) => {
    setSortOrder(newSort)
    localStorage.setItem('garage_sort_order', newSort)
  }

  // Manual Reorder Handler
  const handleManualReorder = (reorderedVehicles: VehicleWithStats[]) => {
    const ids = reorderedVehicles.map(v => v.id);
    setManuallyOrderedIds(ids);
    localStorage.setItem('garage_manual_order', JSON.stringify(ids));
    if (sortOrder !== 'manual') {
      setSortOrder('manual');
      localStorage.setItem('garage_sort_order', 'manual')
    }
  };


  const router = useRouter()

  const handleStatusChange = async (vehicleId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('user_vehicle')
        .update({ current_status: newStatus })
        .eq('id', vehicleId)

      if (error) throw error
      refresh() // Refresh list
      router.refresh() // Refresh server components
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  // Sort Logic
  const getSortedVehicles = (list: VehicleWithStats[]) => {
    let sorted = [...list];

    if (sortOrder === 'manual' && manuallyOrderedIds.length > 0) {
      sorted.sort((a, b) => {
        const indexA = manuallyOrderedIds.indexOf(a.id);
        const indexB = manuallyOrderedIds.indexOf(b.id);
        const valA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA;
        const valB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB;
        return valA - valB;
      });
      return sorted;
    }

    switch (sortOrder) {
      case 'recent':
        break;
      case 'year_desc':
        sorted.sort((a, b) => parseInt(b.year || '0') - parseInt(a.year || '0'));
        break;
      case 'year_asc':
        sorted.sort((a, b) => parseInt(a.year || '0') - parseInt(b.year || '0'));
        break;
      case 'make':
        sorted.sort((a, b) => (a.make || '').localeCompare(b.make || ''));
        break;
    }
    return sorted;
  }

  // Apply sorting
  const sortedActiveVehicles = getSortedVehicles(activeVehicles)
  const sortedStoredVehicles = getSortedVehicles(storedVehicles)

  const displayName = user?.user_metadata?.full_name?.split(' ')[0]?.toLowerCase() || user?.user_metadata?.first_name?.toLowerCase() || 'driver'

  return (
    <div className="container pb-8 pt-24 md:pt-32 max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-light tracking-tight text-foreground mb-2">
          welcome back, <span className="font-medium">{displayName}</span>
        </h1>
        <p className="text-muted-foreground">Manage your fleet and track your builds.</p>
      </div>

      <VehicleGallery
        title="Active Garage"
        vehicles={sortedActiveVehicles}
        allVehicles={vehicles}
        showAddCard={true}
        onAddClick={() => setIsAddModalOpen(true)}
        galleryType="active"
        onDrop={handleStatusChange}
        onSortChange={handleSortChange}
        currentSort={sortOrder}
        onManualReorder={handleManualReorder}
      />

      {sortedStoredVehicles.length > 0 && (
        <VehicleGallery
          title="Storage & Archive"
          vehicles={sortedStoredVehicles}
          allVehicles={vehicles}
          galleryType="stored"
          isCollapsible={true}
          onDrop={handleStatusChange}
        // No manual reorder/sort for stored? Or maybe yes. Inherits sort.
        />
      )}

      <AddVehicleModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onVehicleAdded={() => {
          refresh()
          router.refresh()
        }}
      />
    </div>
  )
}
