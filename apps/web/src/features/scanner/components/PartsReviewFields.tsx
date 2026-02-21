'use client'

import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Button } from '@repo/ui/button'
import { Plus, Trash2 } from 'lucide-react'
import type { PartsReviewData, PartLineItem } from '../schema'

type Props = {
  data: PartsReviewData
  onChange: (data: PartsReviewData) => void
}

export function PartsReviewFields({ data, onChange }: Props) {
  function updateField(field: keyof PartsReviewData, value: string) {
    if (field === 'vendor' || field === 'order_date' || field === 'order_number' || field === 'tracking_number' || field === 'carrier') {
      onChange({ ...data, [field]: value || null })
    } else if (field !== 'items') {
      onChange({ ...data, [field]: value === '' ? null : Number(value) })
    }
  }

  function updateItem(index: number, field: keyof PartLineItem, value: string) {
    const items = [...(data.items || [])]
    const current = items[index]
    if (!current) return
    if (field === 'name') {
      items[index] = { name: value, quantity: current.quantity, part_number: current.part_number, purchase_price: current.purchase_price }
    } else if (field === 'part_number') {
      items[index] = { name: current.name, quantity: current.quantity, part_number: value || null, purchase_price: current.purchase_price }
    } else if (field === 'quantity') {
      items[index] = { name: current.name, quantity: value === '' ? 1 : Number(value), part_number: current.part_number, purchase_price: current.purchase_price }
    } else {
      items[index] = { name: current.name, quantity: current.quantity, part_number: current.part_number, purchase_price: value === '' ? null : Number(value) }
    }
    onChange({ ...data, items })
  }

  function addItem() {
    const items = [...(data.items || []), { name: '', quantity: 1, part_number: null, purchase_price: null }]
    onChange({ ...data, items })
  }

  function removeItem(index: number) {
    const items = [...(data.items || [])]
    items.splice(index, 1)
    onChange({ ...data, items })
  }

  return (
    <div className="space-y-4">
      {/* Order info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="scan-parts-vendor">Vendor *</Label>
          <Input
            id="scan-parts-vendor"
            type="text"
            placeholder="e.g. AutoZone"
            value={data.vendor}
            onChange={(e) => updateField('vendor', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="scan-parts-date">Date *</Label>
          <Input
            id="scan-parts-date"
            type="date"
            value={data.order_date}
            onChange={(e) => updateField('order_date', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="scan-parts-order-num">Order #</Label>
          <Input
            id="scan-parts-order-num"
            type="text"
            placeholder="Optional"
            value={data.order_number ?? ''}
            onChange={(e) => updateField('order_number', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="scan-parts-total">Total *</Label>
          <Input
            id="scan-parts-total"
            type="number"
            step="0.01"
            placeholder="$0.00"
            value={data.total || ''}
            onChange={(e) => updateField('total', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="scan-parts-subtotal">Subtotal</Label>
          <Input
            id="scan-parts-subtotal"
            type="number"
            step="0.01"
            value={data.subtotal ?? ''}
            onChange={(e) => updateField('subtotal', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="scan-parts-tax">Tax</Label>
          <Input
            id="scan-parts-tax"
            type="number"
            step="0.01"
            value={data.tax ?? ''}
            onChange={(e) => updateField('tax', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="scan-parts-ship">Shipping</Label>
          <Input
            id="scan-parts-ship"
            type="number"
            step="0.01"
            value={data.shipping_cost ?? ''}
            onChange={(e) => updateField('shipping_cost', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="scan-parts-tracking">Tracking #</Label>
          <Input
            id="scan-parts-tracking"
            type="text"
            placeholder="Optional"
            value={data.tracking_number ?? ''}
            onChange={(e) => updateField('tracking_number', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="scan-parts-carrier">Carrier</Label>
          <Input
            id="scan-parts-carrier"
            type="text"
            placeholder="e.g. UPS, FedEx"
            value={data.carrier ?? ''}
            onChange={(e) => updateField('carrier', e.target.value)}
          />
        </div>
      </div>

      {/* Line items */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Parts</Label>
          <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1 h-7 text-xs">
            <Plus className="h-3 w-3" />
            Add Part
          </Button>
        </div>

        {(data.items || []).map((item, i) => (
          <div key={i} className="border border-border rounded-lg p-3 space-y-2">
            <div className="flex items-start gap-2">
              <div className="flex-1 space-y-1.5">
                <Input
                  type="text"
                  placeholder="Part name"
                  value={item.name}
                  onChange={(e) => updateItem(i, 'name', e.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeItem(i)}
                className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Input
                type="text"
                placeholder="Part #"
                value={item.part_number ?? ''}
                onChange={(e) => updateItem(i, 'part_number', e.target.value)}
              />
              <Input
                type="number"
                min={1}
                placeholder="Qty"
                value={item.quantity || ''}
                onChange={(e) => updateItem(i, 'quantity', e.target.value)}
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Price"
                value={item.purchase_price ?? ''}
                onChange={(e) => updateItem(i, 'purchase_price', e.target.value)}
              />
            </div>
          </div>
        ))}

        {(!data.items || data.items.length === 0) && (
          <p className="text-sm text-muted-foreground text-center py-3">
            No parts extracted. Add manually if needed.
          </p>
        )}
      </div>
    </div>
  )
}
