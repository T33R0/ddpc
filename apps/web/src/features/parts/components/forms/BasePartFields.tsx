import React from 'react'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { PartFormData, PartSlot } from '../../types'

interface BasePartFieldsProps {
  formData: PartFormData
  onFieldChange: (field: keyof PartFormData, value: string) => void
  slot?: PartSlot | null
}

export const BasePartFields: React.FC<BasePartFieldsProps> = ({ formData, onFieldChange, slot }) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="partName">Part Name *</Label>
        <Input
          id="partName"
          value={formData.partName}
          onChange={(e) => onFieldChange('partName', e.target.value)}
          placeholder="e.g. Interstate Battery"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select
          value={formData.category}
          onValueChange={(val) => onFieldChange('category', val)}
          disabled={!!slot?.category} // Disable if slot defines category
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="engine">Engine</SelectItem>
            <SelectItem value="suspension">Suspension</SelectItem>
            <SelectItem value="brakes">Braking</SelectItem>
            <SelectItem value="wheels_tires">Wheels & Tires</SelectItem>
            <SelectItem value="interior">Interior</SelectItem>
            <SelectItem value="exterior">Exterior</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="partNumber">Part Number</Label>
          <Input
            id="partNumber"
            value={formData.partNumber}
            onChange={(e) => onFieldChange('partNumber', e.target.value)}
            placeholder="e.g. MTZ-34"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="variant">Variant</Label>
          <Select
            value={formData.variant}
            onValueChange={(val) => onFieldChange('variant', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Variant" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="stock">Stock</SelectItem>
              <SelectItem value="upgrade">Upgrade</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="vendorLink">Vendor Link</Label>
        <Input
          id="vendorLink"
          type="url"
          value={formData.vendorLink}
          onChange={(e) => onFieldChange('vendorLink', e.target.value)}
          placeholder="https://..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="installedDate">Date Installed</Label>
          <Input
            id="installedDate"
            type="date"
            value={formData.installedDate}
            onChange={(e) => onFieldChange('installedDate', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="installedMileage">Mileage Installed</Label>
          <Input
            id="installedMileage"
            type="number"
            inputMode="numeric"
            value={formData.installedMileage}
            onChange={(e) => onFieldChange('installedMileage', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="purchaseCost">Purchase Cost ($)</Label>
          <Input
            id="purchaseCost"
            type="number"
            step="0.01"
            inputMode="decimal"
            value={formData.purchaseCost}
            onChange={(e) => onFieldChange('purchaseCost', e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="acquisitionType">Acquisition Type</Label>
          <Select
            value={formData.acquisitionType || 'purchase'}
            onValueChange={(val) => onFieldChange('acquisitionType', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="purchase">Purchase</SelectItem>
              <SelectItem value="warranty">Warranty</SelectItem>
              <SelectItem value="gift">Gift</SelectItem>
              <SelectItem value="trade">Trade</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border-t pt-4 space-y-4">
        <h3 className="text-sm font-semibold mb-1">Expected Lifespan</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="customLifespanMiles">
              Miles
              {slot?.default_lifespan_miles && (
                <span className="text-xs text-muted-foreground ml-1">
                  (Def: {slot.default_lifespan_miles.toLocaleString()})
                </span>
              )}
            </Label>
            <Input
              id="customLifespanMiles"
              type="number"
              inputMode="numeric"
              value={formData.customLifespanMiles}
              onChange={(e) => onFieldChange('customLifespanMiles', e.target.value)}
              placeholder="e.g. 50000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customLifespanMonths">
              Months
              {slot?.default_lifespan_months && (
                <span className="text-xs text-muted-foreground ml-1">
                  (Def: {slot.default_lifespan_months})
                </span>
              )}
            </Label>
            <Input
              id="customLifespanMonths"
              type="number"
              inputMode="numeric"
              value={formData.customLifespanMonths}
              onChange={(e) => onFieldChange('customLifespanMonths', e.target.value)}
              placeholder="e.g. 60"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
