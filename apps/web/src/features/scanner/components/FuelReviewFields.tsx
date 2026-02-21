'use client'

import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import type { FuelReviewData } from '../schema'

type Props = {
  data: FuelReviewData
  onChange: (data: FuelReviewData) => void
}

export function FuelReviewFields({ data, onChange }: Props) {
  function update(field: keyof FuelReviewData, value: string) {
    onChange({
      ...data,
      [field]: field === 'event_date' ? value : value === '' ? null : Number(value),
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="scan-fuel-date">Date *</Label>
          <Input
            id="scan-fuel-date"
            type="date"
            value={data.event_date}
            onChange={(e) => update('event_date', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="scan-fuel-odo">Odometer *</Label>
          <Input
            id="scan-fuel-odo"
            type="number"
            placeholder="e.g. 45230"
            value={data.odometer || ''}
            onChange={(e) => update('odometer', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="scan-fuel-gal">Gallons *</Label>
          <Input
            id="scan-fuel-gal"
            type="number"
            step="0.001"
            placeholder="e.g. 12.456"
            value={data.gallons || ''}
            onChange={(e) => update('gallons', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="scan-fuel-ppg">Price/Gallon *</Label>
          <Input
            id="scan-fuel-ppg"
            type="number"
            step="0.001"
            placeholder="e.g. 3.459"
            value={data.price_per_gallon || ''}
            onChange={(e) => update('price_per_gallon', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="scan-fuel-trip">Trip Miles</Label>
          <Input
            id="scan-fuel-trip"
            type="number"
            step="0.1"
            placeholder="Optional"
            value={data.trip_miles ?? ''}
            onChange={(e) => update('trip_miles', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="scan-fuel-octane">Octane</Label>
          <Input
            id="scan-fuel-octane"
            type="number"
            placeholder="e.g. 87, 91, 93"
            value={data.octane ?? ''}
            onChange={(e) => update('octane', e.target.value)}
          />
        </div>
      </div>

      {/* Calculated total */}
      {data.gallons > 0 && data.price_per_gallon > 0 && (
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-sm text-muted-foreground">
            Total: <span className="font-medium text-foreground">${(data.gallons * data.price_per_gallon).toFixed(2)}</span>
          </p>
        </div>
      )}
    </div>
  )
}
