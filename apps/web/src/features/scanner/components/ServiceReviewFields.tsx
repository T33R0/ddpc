'use client'

import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Textarea } from '@repo/ui/textarea'
import type { ServiceReviewData } from '../schema'

type Props = {
  data: ServiceReviewData
  onChange: (data: ServiceReviewData) => void
}

export function ServiceReviewFields({ data, onChange }: Props) {
  function update(field: keyof ServiceReviewData, value: string) {
    if (field === 'event_date' || field === 'service_provider' || field === 'notes' || field === 'service_item_id') {
      onChange({ ...data, [field]: value || null })
    } else {
      onChange({ ...data, [field]: value === '' ? null : Number(value) })
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="scan-svc-date">Date *</Label>
          <Input
            id="scan-svc-date"
            type="date"
            value={data.event_date}
            onChange={(e) => update('event_date', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="scan-svc-odo">Odometer</Label>
          <Input
            id="scan-svc-odo"
            type="number"
            placeholder="Optional"
            value={data.odometer ?? ''}
            onChange={(e) => update('odometer', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="scan-svc-cost">Total Cost</Label>
          <Input
            id="scan-svc-cost"
            type="number"
            step="0.01"
            placeholder="$0.00"
            value={data.cost ?? ''}
            onChange={(e) => update('cost', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="scan-svc-provider">Service Provider</Label>
          <Input
            id="scan-svc-provider"
            type="text"
            placeholder="e.g. Jiffy Lube"
            value={data.service_provider ?? ''}
            onChange={(e) => update('service_provider', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="scan-svc-notes">Service Items / Notes</Label>
        <Textarea
          id="scan-svc-notes"
          placeholder="e.g. Oil change, tire rotation, brake inspection"
          rows={3}
          value={data.notes ?? ''}
          onChange={(e) => update('notes', e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          List services performed, separated by commas.
        </p>
      </div>
    </div>
  )
}
