import { z } from 'zod'

// ─── OCR Extraction Output (what the vision model returns) ────────────────────

export const OcrExtractionSchema = z.object({
  detected_type: z.enum(['fuel', 'service', 'parts', 'order', 'unknown']),
  confidence: z.number().min(0).max(1),

  // Common fields
  vendor_name: z.string().optional().nullable(),
  date: z.string().optional().nullable(), // YYYY-MM-DD
  total_cost: z.number().optional().nullable(),

  // Fuel-specific
  fuel_details: z
    .object({
      gallons: z.number().optional().nullable(),
      price_per_gallon: z.number().optional().nullable(),
      total_cost: z.number().optional().nullable(),
      octane: z.number().optional().nullable(),
      odometer: z.number().optional().nullable(),
    })
    .optional()
    .nullable(),

  // Service-specific
  service_details: z
    .object({
      service_items: z.array(z.string()).optional().nullable(),
      odometer: z.number().optional().nullable(),
      service_provider: z.string().optional().nullable(),
      labor_cost: z.number().optional().nullable(),
      parts_cost: z.number().optional().nullable(),
    })
    .optional()
    .nullable(),

  // Parts/order-specific
  parts_details: z
    .object({
      items: z
        .array(
          z.object({
            name: z.string(),
            quantity: z.number().default(1),
            price: z.number().optional().nullable(),
            part_number: z.string().optional().nullable(),
          })
        )
        .optional()
        .nullable(),
      order_number: z.string().optional().nullable(),
      tracking_number: z.string().optional().nullable(),
      carrier: z.string().optional().nullable(),
      subtotal: z.number().optional().nullable(),
      tax: z.number().optional().nullable(),
      shipping_cost: z.number().optional().nullable(),
    })
    .optional()
    .nullable(),

  // Warnings (e.g., "date is ambiguous", "total unclear")
  warnings: z.array(z.string()).optional().nullable(),
})

export type OcrExtraction = z.infer<typeof OcrExtractionSchema>

// ─── Record Type (what the user is saving) ────────────────────────────────────

export type ScannerRecordType = 'fuel' | 'service' | 'parts'

// ─── Fuel Review Data ─────────────────────────────────────────────────────────

export const FuelReviewSchema = z.object({
  event_date: z.string().min(1, 'Date is required.'),
  odometer: z.coerce.number().min(1, 'Odometer is required.'),
  gallons: z.coerce.number().min(0.01, 'Gallons are required.'),
  price_per_gallon: z.coerce.number().min(0.01, 'Price is required.'),
  trip_miles: z.coerce.number().optional().nullable(),
  octane: z.coerce.number().optional().nullable(),
})

export type FuelReviewData = z.infer<typeof FuelReviewSchema>

// ─── Service Review Data ──────────────────────────────────────────────────────

export const ServiceReviewSchema = z.object({
  event_date: z.string().min(1, 'Date is required.'),
  odometer: z.coerce.number().optional().nullable(),
  cost: z.coerce.number().optional().nullable(),
  service_provider: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  service_item_id: z.string().uuid().optional().nullable(),
})

export type ServiceReviewData = z.infer<typeof ServiceReviewSchema>

// ─── Parts Review Data ────────────────────────────────────────────────────────

export const PartLineItemSchema = z.object({
  name: z.string().min(1, 'Part name is required.'),
  quantity: z.coerce.number().min(1).default(1),
  part_number: z.string().optional().nullable(),
  purchase_price: z.coerce.number().optional().nullable(),
})

export type PartLineItem = z.infer<typeof PartLineItemSchema>

export const PartsReviewSchema = z.object({
  vendor: z.string().min(1, 'Vendor is required.'),
  order_date: z.string().min(1, 'Date is required.'),
  order_number: z.string().optional().nullable(),
  subtotal: z.coerce.number().optional().nullable(),
  tax: z.coerce.number().optional().nullable(),
  shipping_cost: z.coerce.number().optional().nullable(),
  total: z.coerce.number().min(0),
  tracking_number: z.string().optional().nullable(),
  carrier: z.string().optional().nullable(),
  items: z.array(PartLineItemSchema).optional().nullable(),
})

export type PartsReviewData = z.infer<typeof PartsReviewSchema>

// ─── Combined Scanner Submit Payload ──────────────────────────────────────────

export const ScannerSubmitSchema = z.object({
  scanner_record_id: z.string().uuid(),
  vehicle_id: z.string().uuid(),
  final_type: z.enum(['fuel', 'service', 'parts']),
  fuel_data: FuelReviewSchema.optional(),
  service_data: ServiceReviewSchema.optional(),
  parts_data: PartsReviewSchema.optional(),
})

export type ScannerSubmitPayload = z.infer<typeof ScannerSubmitSchema>
