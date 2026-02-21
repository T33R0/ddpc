'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { extractReceiptData } from './lib/ocr-processor'
import {
  ScannerSubmitSchema,
  type ScannerSubmitPayload,
  type OcrExtraction,
} from './schema'
import { logFuel } from '@/features/fuel/actions'
import { logFreeTextService } from '@/features/service/actions'

// ─── Types ────────────────────────────────────────────────────────────────────

type ScanResult = {
  scannerId?: string
  extraction?: OcrExtraction
  receiptUrl?: string
  error?: string
}

type SaveResult = {
  success?: boolean
  recordId?: string
  error?: string
}

// ─── ACTION: Upload + OCR ─────────────────────────────────────────────────────

/**
 * Upload a receipt image, run OCR extraction, store in scanner_records.
 * Returns the extraction data for the review form.
 */
export async function uploadAndScanReceipt(formData: FormData): Promise<ScanResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Validate file
    const file = formData.get('receipt') as File
    if (!file || !(file instanceof File)) return { error: 'No file provided.' }

    const validTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return { error: 'Invalid file type. Use JPEG, PNG, HEIC, or WebP.' }
    }
    if (file.size > 10 * 1024 * 1024) {
      return { error: 'File too large. Maximum 10MB.' }
    }

    // Convert to base64 for vision model
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString('base64')

    // Run OCR extraction
    const extraction = await extractReceiptData(base64, file.type)

    // Upload to Supabase Storage (service role for bucket write)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      return { error: 'Server configuration error.' }
    }

    const adminClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const timestamp = Date.now()
    const ext = file.name.split('.').pop() || 'jpg'
    const filePath = `${user.id}/${timestamp}.${ext}`

    const { error: uploadError } = await adminClient.storage
      .from('receipts')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return { error: 'Failed to upload receipt image.' }
    }

    // Get public URL
    const { data: urlData } = adminClient.storage
      .from('receipts')
      .getPublicUrl(filePath)

    // Create scanner_records entry
    const { data: record, error: recordError } = await supabase
      .from('scanner_records')
      .insert({
        user_id: user.id,
        receipt_image_path: filePath,
        receipt_image_url: urlData.publicUrl,
        detected_type: extraction.detected_type,
        ocr_raw: extraction as unknown as Record<string, unknown>,
        event_date: extraction.date || null,
        vendor_name: extraction.vendor_name || null,
        total_cost: extraction.total_cost || null,
        status: 'pending',
      })
      .select('id')
      .single()

    if (recordError || !record) {
      console.error('Scanner record error:', recordError)
      return { error: 'Failed to create scan record.' }
    }

    return {
      scannerId: record.id,
      extraction,
      receiptUrl: urlData.publicUrl,
    }
  } catch (err) {
    console.error('uploadAndScanReceipt error:', err)
    return { error: 'An unexpected error occurred while processing the receipt.' }
  }
}

// ─── ACTION: Save Reviewed Data ───────────────────────────────────────────────

/**
 * Save the user-reviewed data to the appropriate table(s).
 */
export async function saveScannerReview(data: ScannerSubmitPayload): Promise<SaveResult> {
  try {
    // Validate
    let validated: ScannerSubmitPayload
    try {
      validated = ScannerSubmitSchema.parse(data)
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const msgs = validationError.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; ')
        return { error: `Validation failed: ${msgs}` }
      }
      throw validationError
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Verify ownership of scanner record
    const { data: scanRecord } = await supabase
      .from('scanner_records')
      .select('id')
      .eq('id', validated.scanner_record_id)
      .eq('user_id', user.id)
      .single()

    if (!scanRecord) return { error: 'Scanner record not found.' }

    let linkedRecordId: string | undefined
    let linkColumn: string | undefined

    // ── Route to appropriate table ──

    if (validated.final_type === 'fuel' && validated.fuel_data) {
      const result = await logFuel({
        user_vehicle_id: validated.vehicle_id,
        event_date: validated.fuel_data.event_date,
        odometer: validated.fuel_data.odometer,
        gallons: validated.fuel_data.gallons,
        price_per_gallon: validated.fuel_data.price_per_gallon,
        trip_miles: validated.fuel_data.trip_miles,
        octane: validated.fuel_data.octane,
      })

      if (result.error) return { error: `Fuel log failed: ${result.error}` }
      linkedRecordId = result.logId
      linkColumn = 'fuel_log_id'
    }

    if (validated.final_type === 'service' && validated.service_data) {
      const result = await logFreeTextService({
        user_vehicle_id: validated.vehicle_id,
        event_date: validated.service_data.event_date,
        odometer: validated.service_data.odometer ?? undefined,
        cost: validated.service_data.cost ?? undefined,
        service_provider: validated.service_data.service_provider ?? undefined,
        notes: validated.service_data.notes ?? undefined,
        service_item_id: validated.service_data.service_item_id ?? undefined,
        status: 'History',
      })

      if (!result.success) return { error: `Service log failed: ${result.error}` }
      linkedRecordId = result.data?.id
      linkColumn = 'maintenance_log_id'
    }

    if (validated.final_type === 'parts' && validated.parts_data) {
      // Create order record
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          vehicle_id: validated.vehicle_id,
          vendor: validated.parts_data.vendor,
          order_number: validated.parts_data.order_number || null,
          order_date: validated.parts_data.order_date,
          status: 'delivered',
          subtotal: validated.parts_data.subtotal || 0,
          tax: validated.parts_data.tax || 0,
          shipping_cost: validated.parts_data.shipping_cost || 0,
          total: validated.parts_data.total,
          tracking_number: validated.parts_data.tracking_number || null,
          carrier: validated.parts_data.carrier || null,
        })
        .select('id')
        .single()

      if (orderError || !order) {
        console.error('Order create error:', orderError)
        return { error: 'Failed to create order.' }
      }

      linkedRecordId = order.id
      linkColumn = 'order_id'

      // Create inventory items linked to the order
      if (validated.parts_data.items && validated.parts_data.items.length > 0) {
        const inventoryRows = validated.parts_data.items.map((item) => ({
          vehicle_id: validated.vehicle_id,
          user_id: user.id,
          name: item.name,
          quantity: item.quantity,
          part_number: item.part_number || null,
          purchase_price: item.purchase_price || null,
          purchase_date: validated.parts_data!.order_date,
          vendor_name: validated.parts_data!.vendor,
          status: 'in_stock' as const,
          order_id: order.id,
        }))

        const { error: invError } = await supabase.from('inventory').insert(inventoryRows)

        if (invError) {
          console.warn('Inventory insert warning (order saved):', invError)
          // Don't fail the whole operation — the order was created
        }
      }
    }

    // Update scanner record with link + status
    const updatePayload: Record<string, unknown> = {
      status: 'saved',
      user_override_type: validated.final_type,
      updated_at: new Date().toISOString(),
    }
    if (linkColumn && linkedRecordId) {
      updatePayload[linkColumn] = linkedRecordId
    }

    await supabase
      .from('scanner_records')
      .update(updatePayload)
      .eq('id', validated.scanner_record_id)
      .eq('user_id', user.id)

    // Revalidate relevant paths
    try {
      revalidatePath(`/vehicle/${validated.vehicle_id}`)
      revalidatePath(`/vehicle/${validated.vehicle_id}/fuel`)
      revalidatePath(`/vehicle/${validated.vehicle_id}/service`)
      revalidatePath(`/vehicle/${validated.vehicle_id}/shop-log`)
      revalidatePath(`/vehicle/${validated.vehicle_id}/parts`)
    } catch {
      // Non-critical
    }

    return { success: true, recordId: linkedRecordId }
  } catch (err) {
    console.error('saveScannerReview error:', err)
    return { error: 'An unexpected error occurred while saving.' }
  }
}
