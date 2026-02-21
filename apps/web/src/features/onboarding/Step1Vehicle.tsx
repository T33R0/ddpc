'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { toast } from 'react-hot-toast'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@repo/ui/tabs'
import { Car, Search, ChevronRight } from 'lucide-react'
import { VehicleSummary } from '@repo/types'
import { addVehicleToGarage } from '@/features/garage/actions'

interface Step1VehicleProps {
  onComplete: (vehicleId: string, vehicleName: string) => void
}

export function Step1Vehicle({ onComplete }: Step1VehicleProps) {
  const { user } = useAuth()

  // VIN state
  const [vin, setVin] = useState('')
  const [isDecodingVin, setIsDecodingVin] = useState(false)
  const [vinVehicleData, setVinVehicleData] = useState<VehicleSummary | null>(null)

  // Manual entry state
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedMake, setSelectedMake] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const [availableMakes, setAvailableMakes] = useState<string[]>([])
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [manualVehicleData, setManualVehicleData] = useState<VehicleSummary | null>(null)

  // Common state
  const [isAdding, setIsAdding] = useState(false)
  const [activeTab, setActiveTab] = useState<'vin' | 'manual'>('vin')

  // Load year options for manual entry
  useEffect(() => {
    if (activeTab === 'manual' && availableYears.length === 0) {
      const loadFilters = async () => {
        try {
          const response = await fetch('/api/explore/filters')
          if (response.ok) {
            const data = await response.json()
            setAvailableYears(data.years || [])
          }
        } catch (error) {
          console.error('Failed to load filter options:', error)
        }
      }
      loadFilters()
    }
  }, [activeTab, availableYears.length])

  // Load makes when year changes
  useEffect(() => {
    if (selectedYear) {
      const loadMakes = async () => {
        try {
          const response = await fetch(
            `/api/explore/vehicle-options?type=makes&year=${selectedYear}`
          )
          if (response.ok) {
            const makes = await response.json()
            setAvailableMakes(makes)
          }
        } catch (error) {
          console.error('Failed to load makes:', error)
        }
      }
      loadMakes()
    } else {
      setAvailableMakes([])
    }
    setSelectedMake('')
    setSelectedModel('')
    setAvailableModels([])
    setManualVehicleData(null)
  }, [selectedYear])

  // Load models when make changes
  useEffect(() => {
    if (selectedYear && selectedMake) {
      const loadModels = async () => {
        try {
          const response = await fetch(
            `/api/explore/vehicle-options?type=models&year=${selectedYear}&make=${encodeURIComponent(selectedMake)}`
          )
          if (response.ok) {
            const models = await response.json()
            setAvailableModels(models)
          }
        } catch (error) {
          console.error('Failed to load models:', error)
        }
      }
      loadModels()
    } else {
      setAvailableModels([])
    }
    setSelectedModel('')
    setManualVehicleData(null)
  }, [selectedYear, selectedMake])

  // Search for trims when model is selected
  useEffect(() => {
    if (selectedYear && selectedMake && selectedModel) {
      const searchVehicles = async () => {
        try {
          const filters = [
            { id: 'year', column: 'year', operator: 'eq', value: selectedYear },
            { id: 'make', column: 'make', operator: 'eq', value: selectedMake },
            { id: 'model', column: 'model', operator: 'eq', value: selectedModel },
          ]
          const params = new URLSearchParams({
            page: '1',
            pageSize: '50',
            filters: JSON.stringify(filters),
          })
          const response = await fetch(`/api/explore/vehicles?${params.toString()}`)
          if (response.ok) {
            const data = await response.json()
            if (data.data && data.data.length > 0) {
              setManualVehicleData(data.data[0])
            }
          }
        } catch (error) {
          console.error('Error searching vehicles:', error)
        }
      }
      searchVehicles()
    }
  }, [selectedYear, selectedMake, selectedModel])

  const handleVinDecode = async () => {
    if (!vin.trim() || vin.trim().length !== 17) {
      toast.error('Please enter a valid 17-character VIN')
      return
    }

    setIsDecodingVin(true)
    try {
      const response = await fetch('/api/garage/decode-vin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vin }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to decode VIN')
      }

      if (!data.vehicleData) {
        throw new Error('No vehicle data returned')
      }

      const trims = data.vehicleData.trims
      if (!trims || !Array.isArray(trims) || trims.length === 0) {
        // Fallback: if YMM available, switch to manual
        if (data.vehicleData.year && data.vehicleData.make && data.vehicleData.model) {
          toast('Exact trim not found. Switching to manual selection...', { icon: '\u2139\uFE0F' })
          setActiveTab('manual')
          setSelectedYear(data.vehicleData.year.toString())
          setSelectedMake(data.vehicleData.make)
          setSelectedModel(data.vehicleData.model)
          return
        }
        throw new Error('No trim details available. Try manual entry.')
      }

      setVinVehicleData(data.vehicleData)
      toast.success(`Found: ${data.vehicleData.year} ${data.vehicleData.make} ${data.vehicleData.model}`)
    } catch (error) {
      console.error('Error decoding VIN:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to decode VIN')
    } finally {
      setIsDecodingVin(false)
    }
  }

  const handleAddVehicle = async () => {
    if (!user) {
      toast.error('You must be signed in')
      return
    }

    let trimId: string
    let trimData: Record<string, unknown> | undefined
    let displayName: string

    if (activeTab === 'vin' && vinVehicleData) {
      const trim = vinVehicleData.trims[0]
      if (!trim) {
        toast.error('No trim data available')
        return
      }
      trimId = trim.id
      trimData = trim as unknown as Record<string, unknown>
      displayName = `${vinVehicleData.year} ${vinVehicleData.make} ${vinVehicleData.model}`
    } else if (activeTab === 'manual' && manualVehicleData) {
      // Auto-select first trim for speed
      const trim = manualVehicleData.trims[0]
      if (!trim) {
        toast.error('No trim data available for this vehicle')
        return
      }
      trimId = trim.id
      trimData = trim as unknown as Record<string, unknown>
      displayName = `${selectedYear} ${selectedMake} ${selectedModel}`
    } else {
      toast.error('Please search for your vehicle first')
      return
    }

    setIsAdding(true)
    try {
      const result = await addVehicleToGarage(
        trimId,
        activeTab === 'vin' ? vin : undefined,
        trimData
      )

      if (result.error) {
        throw new Error(result.error)
      }

      if (result.vehicleId) {
        toast.success('Vehicle added!')
        onComplete(result.vehicleId, displayName)
      }
    } catch (error) {
      console.error('Error adding vehicle:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add vehicle')
    } finally {
      setIsAdding(false)
    }
  }

  const hasVehicleData =
    (activeTab === 'vin' && vinVehicleData) ||
    (activeTab === 'manual' && manualVehicleData)

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
          <Car className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Add Your First Vehicle</h2>
        <p className="text-sm text-muted-foreground">
          Enter your VIN for instant lookup, or select year/make/model manually.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'vin' | 'manual')}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="vin">VIN Decode</TabsTrigger>
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        </TabsList>

        <TabsContent value="vin" className="space-y-3 mt-3">
          <div className="space-y-2">
            <Label htmlFor="vin-input">Vehicle Identification Number</Label>
            <div className="flex gap-2">
              <Input
                id="vin-input"
                placeholder="e.g. 1HGCG5655WA041389"
                value={vin}
                onChange={(e) => setVin(e.target.value.toUpperCase())}
                maxLength={17}
                className="font-mono"
              />
              <Button
                onClick={handleVinDecode}
                disabled={isDecodingVin || vin.length !== 17}
                size="default"
                variant="outline"
              >
                {isDecodingVin ? (
                  <span className="animate-spin">&#8987;</span>
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Find your VIN on the driver&apos;s side dashboard or door jamb sticker.
            </p>
          </div>

          {vinVehicleData && (
            <div className="rounded-md border border-border bg-muted/50 p-3">
              <p className="text-sm font-medium text-foreground">
                {vinVehicleData.year} {vinVehicleData.make} {vinVehicleData.model}
              </p>
              {vinVehicleData.trims[0] && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {vinVehicleData.trims[0].trim || 'Base'} trim
                  {vinVehicleData.trims[0].engine_size_l &&
                    ` \u2022 ${vinVehicleData.trims[0].engine_size_l}L`}
                </p>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="manual" className="space-y-3 mt-3">
          <div className="space-y-2">
            <Label htmlFor="year-select">Year</Label>
            <select
              id="year-select"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="">Select year...</option>
              {availableYears
                .sort((a, b) => b - a)
                .map((year) => (
                  <option key={year} value={year.toString()}>
                    {year}
                  </option>
                ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="make-select">Make</Label>
            <select
              id="make-select"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={selectedMake}
              onChange={(e) => setSelectedMake(e.target.value)}
              disabled={!selectedYear}
            >
              <option value="">Select make...</option>
              {availableMakes.map((make) => (
                <option key={make} value={make}>
                  {make}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model-select">Model</Label>
            <select
              id="model-select"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={!selectedMake}
            >
              <option value="">Select model...</option>
              {availableModels.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>

          {manualVehicleData && (
            <div className="rounded-md border border-border bg-muted/50 p-3">
              <p className="text-sm font-medium text-foreground">
                {selectedYear} {selectedMake} {selectedModel}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {manualVehicleData.trims.length} trim
                {manualVehicleData.trims.length !== 1 ? 's' : ''} available (auto-selecting first
                match)
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Button
        onClick={handleAddVehicle}
        disabled={!hasVehicleData || isAdding}
        className="w-full"
        size="lg"
      >
        {isAdding ? 'Adding Vehicle...' : 'Add Vehicle & Continue'}
        {!isAdding && <ChevronRight className="w-4 h-4 ml-1" />}
      </Button>
    </div>
  )
}
