import type { OcrExtraction, FuelReviewData, ServiceReviewData, PartsReviewData } from '../schema'

const today = (): string => new Date().toISOString().split('T')[0] as string

/**
 * Map OCR extraction to fuel form fields.
 */
export function mapToFuelData(extraction: OcrExtraction): FuelReviewData {
  const fuel = extraction.fuel_details
  return {
    event_date: extraction.date || today(),
    odometer: fuel?.odometer ?? 0,
    gallons: fuel?.gallons ?? 0,
    price_per_gallon: fuel?.price_per_gallon ?? 0,
    trip_miles: null,
    octane: fuel?.octane ?? null,
  }
}

/**
 * Map OCR extraction to service form fields.
 */
export function mapToServiceData(extraction: OcrExtraction): ServiceReviewData {
  const service = extraction.service_details
  const itemsList = service?.service_items?.join(', ') || null

  return {
    event_date: extraction.date || today(),
    odometer: service?.odometer ?? null,
    cost: extraction.total_cost ?? null,
    service_provider: service?.service_provider || extraction.vendor_name || null,
    notes: itemsList,
    service_item_id: null, // User selects from service_items table
  }
}

/**
 * Map OCR extraction to parts/order form fields.
 */
export function mapToPartsData(extraction: OcrExtraction): PartsReviewData {
  const parts = extraction.parts_details

  return {
    vendor: extraction.vendor_name || '',
    order_date: extraction.date || today(),
    order_number: parts?.order_number ?? null,
    subtotal: parts?.subtotal ?? null,
    tax: parts?.tax ?? null,
    shipping_cost: parts?.shipping_cost ?? null,
    total: extraction.total_cost ?? 0,
    tracking_number: parts?.tracking_number ?? null,
    carrier: parts?.carrier ?? null,
    items:
      parts?.items?.map((item) => ({
        name: item.name,
        quantity: item.quantity || 1,
        part_number: item.part_number ?? null,
        purchase_price: item.price ?? null,
      })) ?? null,
  }
}
