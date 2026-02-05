import React from 'react'
import { Label } from '@repo/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'

interface PartTypeSelectorProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export const PartTypeSelector: React.FC<PartTypeSelectorProps> = ({ value, onChange, disabled }) => {
  return (
    <div className="space-y-2 border-t pt-4">
        <div className="flex flex-col gap-1">
            <Label htmlFor="partType" className="text-sm font-semibold">Part Type Specification</Label>
            <p className="text-xs text-muted-foreground">Select a specific part type to unlock additional fields.</p>
        </div>
      
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger id="partType">
          <SelectValue placeholder="Select Part Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">Generic / Other</SelectItem>
          <SelectItem value="tires">Tires</SelectItem>
          <SelectItem value="wheels">Wheels</SelectItem>
          <SelectItem value="brake-pads">Brake Pads</SelectItem>
          <SelectItem value="brake-rotors">Brake Rotors</SelectItem>
          <SelectItem value="suspension">Suspension</SelectItem>
          <SelectItem value="engine">Engine</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
