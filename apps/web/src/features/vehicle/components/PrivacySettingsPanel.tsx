'use client'

import { useState, useCallback } from 'react'
import { Check, Shield, Gauge, DollarSign, Wrench, Fuel, Cog, Package, KeyRound } from 'lucide-react'
import { updateVehiclePrivacySettings } from '@/actions/update-vehicle-privacy-settings'
import { toast } from '@repo/ui/use-toast'
import type { VehiclePrivacySettings } from '@/lib/vehicle-privacy-filter'
import { DEFAULT_PRIVACY_SETTINGS, parsePrivacySettings } from '@/lib/vehicle-privacy-filter'

interface PrivacySettingsPanelProps {
  vehicleId: string
  initialSettings: unknown
  isPublic: boolean
}

interface ToggleOption {
  key: keyof VehiclePrivacySettings
  label: string
  description: string
  icon: React.ReactNode
}

const TOGGLE_OPTIONS: ToggleOption[] = [
  {
    key: 'show_odometer',
    label: 'Odometer',
    description: 'Current mileage reading',
    icon: <Gauge className="w-4 h-4" />,
  },
  {
    key: 'show_vin',
    label: 'VIN',
    description: 'Vehicle identification number',
    icon: <KeyRound className="w-4 h-4" />,
  },
  {
    key: 'show_cost',
    label: 'Costs',
    description: 'Mod costs, service costs, fuel prices',
    icon: <DollarSign className="w-4 h-4" />,
  },
  {
    key: 'show_maintenance_history',
    label: 'Maintenance History',
    description: 'Service logs and job records',
    icon: <Wrench className="w-4 h-4" />,
  },
  {
    key: 'show_fuel_logs',
    label: 'Fuel Logs',
    description: 'Fill-ups, MPG, and fuel costs',
    icon: <Fuel className="w-4 h-4" />,
  },
  {
    key: 'show_mods',
    label: 'Modifications',
    description: 'Installed mods and build details',
    icon: <Cog className="w-4 h-4" />,
  },
  {
    key: 'show_parts',
    label: 'Parts Inventory',
    description: 'Installed parts and health status',
    icon: <Package className="w-4 h-4" />,
  },
]

export function PrivacySettingsPanel({ vehicleId, initialSettings, isPublic }: PrivacySettingsPanelProps) {
  const [settings, setSettings] = useState<VehiclePrivacySettings>(
    parsePrivacySettings(initialSettings)
  )
  const [saving, setSaving] = useState(false)

  const handleToggle = useCallback(async (key: keyof VehiclePrivacySettings) => {
    const newValue = !settings[key]
    const previousSettings = { ...settings }

    // Optimistic update
    setSettings(prev => ({ ...prev, [key]: newValue }))

    setSaving(true)
    try {
      const result = await updateVehiclePrivacySettings(vehicleId, { [key]: newValue })
      if (result.error) {
        // Revert on error
        setSettings(previousSettings)
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
      }
    } catch {
      setSettings(previousSettings)
      toast({ title: 'Error', description: 'Failed to save setting', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }, [settings, vehicleId])

  if (!isPublic) {
    return (
      <div className="rounded-lg border border-border bg-card/50 p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Shield className="w-4 h-4" />
          <p className="text-sm">
            Privacy controls are available when your vehicle is set to Public.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-primary" />
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Public Visibility
        </h4>
      </div>
      <p className="text-xs text-muted-foreground">
        Choose what visitors can see when viewing your vehicle. Vehicle specs (year, make, model, photos) are always visible on public vehicles.
      </p>
      <div className="space-y-1">
        {TOGGLE_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => handleToggle(option.key)}
            disabled={saving}
            className="flex items-center gap-3 w-full text-left rounded-md p-2.5 hover:bg-muted/50 transition-colors disabled:opacity-50"
          >
            <div
              className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
                settings[option.key]
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'border-input bg-background'
              }`}
            >
              {settings[option.key] && <Check className="w-3 h-3" />}
            </div>
            <span className="text-muted-foreground flex-shrink-0">{option.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{option.label}</p>
              <p className="text-xs text-muted-foreground">{option.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
