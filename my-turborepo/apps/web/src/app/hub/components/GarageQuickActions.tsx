'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@repo/ui/button'
import { Fuel, Wrench } from 'lucide-react'
import { useVehicles, Vehicle } from '../../../lib/hooks/useVehicles'
import { SelectVehicleDialog } from './SelectVehicleDialog'
import { AddFuelDialog } from '@/features/fuel/components'
import { AddServiceDialog, ServiceCategory, ServiceItem } from '@/features/service/components/AddServiceDialog'
import { supabase } from '@/lib/supabase'

export function GarageQuickActions() {
  const router = useRouter()
  const { data, isLoading } = useVehicles()

  // State for sorted vehicles
  const [sortedVehicles, setSortedVehicles] = useState<Vehicle[]>([])

  // State for service data pre-fetching
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([])
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([])

  const [isSelectVehicleOpen, setIsSelectVehicleOpen] = useState(false)
  const [selectedAction, setSelectedAction] = useState<'fuel' | 'service' | null>(null)

  const [isFuelLogOpen, setIsFuelLogOpen] = useState(false)
  const [isServiceLogOpen, setIsServiceLogOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)

  // Sort vehicles whenever data changes
  useEffect(() => {
    if (!data?.vehicles) {
      setSortedVehicles([])
      return
    }

    const vehicles = data.vehicles
    const active = vehicles.filter(v => v.current_status === 'daily_driver')
    const stored = vehicles.filter(v => v.current_status !== 'daily_driver')

    let sortedStored = [...stored]

    try {
      if (typeof window !== 'undefined') {
        const sortMode = localStorage.getItem('garage-sort-mode')

        if (sortMode === 'custom') {
           const manualOrder = JSON.parse(localStorage.getItem('garage-manual-order') || '[]') as string[]
           const orderMap = new Map(manualOrder.map((id, index) => [id, index]))
           sortedStored.sort((a, b) => {
             const idxA = orderMap.has(a.id) ? orderMap.get(a.id)! : 999999
             const idxB = orderMap.has(b.id) ? orderMap.get(b.id)! : 999999
             return idxA - idxB
           })
        } else {
           // Default: Last Edited (desc)
           // Use updated_at or last_event_at or created_at
           sortedStored.sort((a, b) => {
             const tA = new Date(a.updated_at || a.last_event_at || a.created_at || 0).getTime()
             const tB = new Date(b.updated_at || b.last_event_at || b.created_at || 0).getTime()
             return tB - tA
           })
        }
      }
    } catch (e) {
      console.error('Error sorting vehicles:', e)
    }

    setSortedVehicles([...active, ...sortedStored])
  }, [data?.vehicles])

  // Pre-fetch service categories and items to avoid modal hang
  useEffect(() => {
    async function fetchServiceData() {
      try {
        const { data: cats } = await supabase
          .from('service_categories')
          .select('id, name')
          .order('name')

        if (cats) {
          setServiceCategories(cats)
        }

        const { data: items } = await supabase
          .from('service_items')
          .select('id, name, description, category_id')
          .order('name')

        if (items) {
          setServiceItems(items)
        }
      } catch (err) {
        console.error('Error fetching service data:', err)
      }
    }

    fetchServiceData()
  }, [])

  const handleActionClick = (action: 'fuel' | 'service') => {
    if (isLoading) return

    if (sortedVehicles.length === 0) {
      if (confirm('No vehicles found. Would you like to go to your Garage to add one?')) {
        router.push('/garage')
      }
      return
    }

    if (sortedVehicles.length === 1) {
      // Auto-select the only vehicle
      const vehicle = sortedVehicles[0]
      if (vehicle) {
        setSelectedVehicle(vehicle)
        if (action === 'fuel') setIsFuelLogOpen(true)
        if (action === 'service') setIsServiceLogOpen(true)
      }
    } else {
      // Multiple vehicles, open selection dialog
      setSelectedAction(action)
      setIsSelectVehicleOpen(true)
    }
  }

  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    if (selectedAction === 'fuel') setIsFuelLogOpen(true)
    if (selectedAction === 'service') setIsServiceLogOpen(true)
    setSelectedAction(null)
  }

  // Wrap in a div that stops propagation to prevent bubbling to the parent Card's onClick
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <div className="flex gap-2 mt-4 z-20 relative">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1 bg-background/80 backdrop-blur-sm hover:bg-background/90 text-xs sm:text-sm h-9"
          onClick={() => handleActionClick('fuel')}
        >
          <Fuel className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
          Log Fuel
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="flex-1 bg-background/80 backdrop-blur-sm hover:bg-background/90 text-xs sm:text-sm h-9"
          onClick={() => handleActionClick('service')}
        >
          <Wrench className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
          Log Service
        </Button>
      </div>

      <SelectVehicleDialog
        isOpen={isSelectVehicleOpen}
        onClose={() => setIsSelectVehicleOpen(false)}
        vehicles={sortedVehicles}
        onSelect={handleVehicleSelect}
        actionLabel={selectedAction === 'fuel' ? 'log fuel' : 'log service'}
      />

      {selectedVehicle && (
        <>
          <AddFuelDialog
            isOpen={isFuelLogOpen}
            onClose={() => setIsFuelLogOpen(false)}
            vehicleId={selectedVehicle.id}
            currentOdometer={selectedVehicle.odometer}
          />

          <AddServiceDialog
            isOpen={isServiceLogOpen}
            onClose={() => setIsServiceLogOpen(false)}
            vehicleId={selectedVehicle.id}
            initialCategories={serviceCategories}
            initialItems={serviceItems}
          />
        </>
      )}
    </div>
  )
}
