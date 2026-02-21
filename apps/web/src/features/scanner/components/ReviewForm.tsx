'use client'

import { useState, useEffect } from 'react'
import { Button } from '@repo/ui/button'
import { Label } from '@repo/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/select'
import { AlertTriangle, Fuel, Wrench, Package } from 'lucide-react'
import { FuelReviewFields } from './FuelReviewFields'
import { ServiceReviewFields } from './ServiceReviewFields'
import { PartsReviewFields } from './PartsReviewFields'
import { mapToFuelData, mapToServiceData, mapToPartsData } from '../lib/field-mapper'
import type {
  OcrExtraction,
  ScannerRecordType,
  FuelReviewData,
  ServiceReviewData,
  PartsReviewData,
  ScannerSubmitPayload,
} from '../schema'

type Props = {
  extraction: OcrExtraction
  scannerId: string
  vehicleId: string
  receiptUrl?: string
  onSubmit: (payload: ScannerSubmitPayload) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
}

const TYPE_OPTIONS: { value: ScannerRecordType; label: string; icon: typeof Fuel }[] = [
  { value: 'fuel', label: 'Fuel Fill-Up', icon: Fuel },
  { value: 'service', label: 'Service / Maintenance', icon: Wrench },
  { value: 'parts', label: 'Parts / Order', icon: Package },
]

export function ReviewForm({
  extraction,
  scannerId,
  vehicleId,
  receiptUrl,
  onSubmit,
  onCancel,
  isSubmitting,
}: Props) {
  // Determine initial type from extraction
  const initialType: ScannerRecordType =
    extraction.detected_type === 'fuel' ||
    extraction.detected_type === 'service' ||
    extraction.detected_type === 'parts'
      ? extraction.detected_type
      : extraction.detected_type === 'order'
        ? 'parts'
        : 'fuel'

  const [selectedType, setSelectedType] = useState<ScannerRecordType>(initialType)

  // Per-type form data
  const [fuelData, setFuelData] = useState<FuelReviewData>(mapToFuelData(extraction))
  const [serviceData, setServiceData] = useState<ServiceReviewData>(mapToServiceData(extraction))
  const [partsData, setPartsData] = useState<PartsReviewData>(mapToPartsData(extraction))

  // Re-map if extraction changes
  useEffect(() => {
    setFuelData(mapToFuelData(extraction))
    setServiceData(mapToServiceData(extraction))
    setPartsData(mapToPartsData(extraction))
  }, [extraction])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const payload: ScannerSubmitPayload = {
      scanner_record_id: scannerId,
      vehicle_id: vehicleId,
      final_type: selectedType,
      fuel_data: selectedType === 'fuel' ? fuelData : undefined,
      service_data: selectedType === 'service' ? serviceData : undefined,
      parts_data: selectedType === 'parts' ? partsData : undefined,
    }

    await onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Warnings from OCR */}
      {extraction.warnings && extraction.warnings.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 space-y-1">
          {extraction.warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <span className="text-amber-700 dark:text-amber-400">{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Receipt thumbnail + detected info */}
      <div className="flex gap-3 items-start">
        {receiptUrl && (
          <div className="shrink-0 w-16 h-16 rounded-md overflow-hidden bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={receiptUrl} alt="Receipt" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {extraction.vendor_name && (
            <p className="font-medium text-sm truncate">{extraction.vendor_name}</p>
          )}
          {extraction.date && (
            <p className="text-xs text-muted-foreground">{extraction.date}</p>
          )}
          {extraction.total_cost != null && (
            <p className="text-xs text-muted-foreground">${extraction.total_cost.toFixed(2)}</p>
          )}
          <p className="text-xs text-muted-foreground/60 mt-0.5">
            Confidence: {Math.round((extraction.confidence || 0) * 100)}%
          </p>
        </div>
      </div>

      {/* Type selector */}
      <div className="space-y-1.5">
        <Label>Record Type</Label>
        <Select
          value={selectedType}
          onValueChange={(v) => setSelectedType(v as ScannerRecordType)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <span className="flex items-center gap-2">
                  <opt.icon className="h-4 w-4" />
                  {opt.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Type-specific fields */}
      {selectedType === 'fuel' && (
        <FuelReviewFields data={fuelData} onChange={setFuelData} />
      )}
      {selectedType === 'service' && (
        <ServiceReviewFields data={serviceData} onChange={setServiceData} />
      )}
      {selectedType === 'parts' && (
        <PartsReviewFields data={partsData} onChange={setPartsData} />
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'Saving...' : 'Save Record'}
        </Button>
      </div>
    </form>
  )
}
