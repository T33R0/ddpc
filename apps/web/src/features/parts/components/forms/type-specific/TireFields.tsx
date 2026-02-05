import React, { useState } from 'react'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Switch } from '@repo/ui/switch'
import { TypeFieldsProps } from './GenericFields'
import { TireSpecificData } from '../../../types'
import { Check, ArrowRight } from 'lucide-react'
import { Button } from '@repo/ui/button'

export const TireFields: React.FC<TypeFieldsProps> = ({ data, onChange }) => {
  // Cast data to typed interface for internal usage (safe because we control the inputs)
  const tireData = data as Partial<TireSpecificData>
  
  // Local state for the "smart" tire string input
  const [smartString, setSmartString] = useState('')

  const parseTireString = (str: string, position: 'front' | 'rear') => {
    // Regex for 255/35R19 or 255/35/19 or 255 35 19
    const match = str.match(/(\d{3})[\/\s]?(\d{2})[R\s\/]?(\d{1,2})/i)
    
    if (match) {
      const width = match[1]
      const aspect = match[2]
      const diameter = match[3]

      if (!width || !aspect || !diameter) return false
      
      if (position === 'front') {
        onChange('width', parseInt(width))
        onChange('aspectRatio', parseInt(aspect))
        onChange('diameter', parseInt(diameter))
      } else {
        onChange('rearWidth', parseInt(width))
        onChange('rearAspectRatio', parseInt(aspect))
        onChange('rearDiameter', parseInt(diameter))
      }
      return true
    }
    return false
  }

  const handleSmartStringParse = () => {
    if (parseTireString(smartString, 'front')) {
      setSmartString('')
    }
  }

  const isStaggered = tireData.isStaggered || false

  return (
    <div className="space-y-6 pt-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Tire Details</h3>
        <div className="flex items-center space-x-2">
           <Label htmlFor="staggered-mode" className="text-sm font-normal">Staggered Setup</Label>
           <Switch 
              id="staggered-mode"
              checked={isStaggered}
              onCheckedChange={(checked) => onChange('isStaggered', checked)}
           />
        </div>
      </div>

      {/* Smart Parser Helper */}
      <div className="bg-muted/50 p-3 rounded-md space-y-2">
        <Label htmlFor="smart-input" className="text-xs text-muted-foreground">Quick Fill (e.g. 255/35R19)</Label>
        <div className="flex gap-2">
          <Input 
            id="smart-input"
            value={smartString}
            onChange={(e) => setSmartString(e.target.value)}
            placeholder="255/35R19"
            className="h-8 text-sm"
          />
          <Button 
            type="button" 
            variant="secondary" 
            size="sm" 
            className="h-8"
            onClick={handleSmartStringParse}
            disabled={!smartString}
          >
            Apply
          </Button>
        </div>
      </div>

      {/* Front / All Tires */}
      <div className="space-y-4">
        <div className="text-sm font-medium text-muted-foreground">
          {isStaggered ? 'Front Tires' : 'Tire Specification'}
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label htmlFor="width" className="text-xs">Width (mm)</Label>
            <Input 
              id="width" 
              type="number" 
              inputMode="numeric"
              value={tireData.width || ''} 
              onChange={(e) => onChange('width', parseInt(e.target.value))}
              placeholder="255"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="aspect" className="text-xs">Aspect</Label>
            <Input 
              id="aspect" 
              type="number" 
              inputMode="numeric"
              value={tireData.aspectRatio || ''} 
              onChange={(e) => onChange('aspectRatio', parseInt(e.target.value))}
              placeholder="35"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="diameter" className="text-xs">Diameter (in)</Label>
            <Input 
              id="diameter" 
              type="number" 
              inputMode="numeric"
              value={tireData.diameter || ''} 
              onChange={(e) => onChange('diameter', parseInt(e.target.value))}
              placeholder="19"
            />
          </div>
        </div>
      </div>

      {/* Rear Tires (Staggered Only) */}
      {isStaggered && (
        <div className="space-y-4 border-t border-dashed pt-4">
          <div className="text-sm font-medium text-muted-foreground">Rear Tires</div>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label htmlFor="rearWidth" className="text-xs">Width (mm)</Label>
              <Input 
                id="rearWidth" 
                type="number" 
                inputMode="numeric"
                value={tireData.rearWidth || ''} 
                onChange={(e) => onChange('rearWidth', parseInt(e.target.value))}
                placeholder="275"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="rearAspect" className="text-xs">Aspect</Label>
              <Input 
                id="rearAspect" 
                type="number" 
                inputMode="numeric"
                value={tireData.rearAspectRatio || ''} 
                onChange={(e) => onChange('rearAspectRatio', parseInt(e.target.value))}
                placeholder="35"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="rearDiameter" className="text-xs">Diameter (in)</Label>
              <Input 
                id="rearDiameter" 
                type="number" 
                inputMode="numeric"
                value={tireData.rearDiameter || ''} 
                onChange={(e) => onChange('rearDiameter', parseInt(e.target.value))}
                placeholder="19"
              />
            </div>
          </div>
        </div>
      )}

      {/* Common Specs */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="speedRating">Speed Rating</Label>
          <Select 
            value={tireData.speedRating || ''} 
            onValueChange={(val) => onChange('speedRating', val)}
          >
            <SelectTrigger id="speedRating">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {['S', 'T', 'H', 'V', 'W', 'Y', 'Z', '(Y)'].map(rating => (
                <SelectItem key={rating} value={rating}>{rating}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="loadIndex">Load Index</Label>
          <Input 
            id="loadIndex" 
            type="number"
            inputMode="numeric"
            value={tireData.loadIndex || ''} 
            onChange={(e) => onChange('loadIndex', parseInt(e.target.value))}
            placeholder="e.g. 96"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dotDate">DOT Date Code</Label>
          <Input 
            id="dotDate" 
            type="text"
            maxLength={4}
            value={tireData.dotDateCode || ''} 
            onChange={(e) => onChange('dotDateCode', e.target.value)}
            placeholder="WWYY (e.g. 2423)"
          />
          <p className="text-[10px] text-muted-foreground">Week & Year of manufacture</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="treadDepth">Tread Depth (32nds)</Label>
          <Input 
            id="treadDepth" 
            type="number"
            inputMode="numeric"
            value={tireData.treadDepthAtInstall || ''} 
            onChange={(e) => onChange('treadDepthAtInstall', parseFloat(e.target.value))}
            placeholder="e.g. 10"
          />
        </div>
      </div>
      
      {!isStaggered && (
        <div className="space-y-2">
           <Label htmlFor="position">Position</Label>
           <Select
             value={tireData.position || 'all'}
             onValueChange={(val) => onChange('position', val)}
           >
             <SelectTrigger id="position">
               <SelectValue placeholder="Select Position" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">All 4 Tires</SelectItem>
               <SelectItem value="front">Front Axle</SelectItem>
               <SelectItem value="rear">Rear Axle</SelectItem>
               <SelectItem value="spare">Spare</SelectItem>
             </SelectContent>
           </Select>
        </div>
      )}
    </div>
  )
}
