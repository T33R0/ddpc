import { generateObject } from 'ai'
import { vercelGateway } from '@/lib/ai-gateway'
import { OcrExtractionSchema, type OcrExtraction } from '../schema'

const SYSTEM_PROMPT = `You are an expert receipt and automotive invoice OCR system for a vehicle maintenance tracking app. Extract structured data from receipt and invoice images.

CATEGORIZE THE RECEIPT:
- FUEL: Gas station receipts. Look for gallons/liters, price per gallon, pump number, octane grade. Total = gallons * price_per_gallon.
- SERVICE: Mechanic, dealer, or shop invoices. Look for labor charges, service descriptions (oil change, brake job, alignment, etc.), odometer readings.
- PARTS: Auto parts store receipts or online order confirmations. Look for part names, part numbers, quantities, individual prices, tracking/shipping info.
- ORDER: Same as PARTS but specifically online order confirmations or packing slips.
- UNKNOWN: If you genuinely cannot determine the type.

EXTRACTION RULES:
1. Dates: Convert to YYYY-MM-DD format. If year is ambiguous, use current year.
2. Currency: Extract numeric values only (no $ signs). Use decimal precision (e.g., 3.459 for gas price).
3. Odometer: Only extract if clearly visible on the receipt. Don't guess.
4. Part numbers: Include manufacturer part numbers, SKUs, or item codes.
5. Be CONSERVATIVE — only include data you can clearly read. Use null for anything unclear.
6. Add warnings for ambiguous data (blurry text, partial numbers, unclear dates).
7. For fuel receipts: price_per_gallon is the per-unit price, total_cost is the receipt total.
8. For service: split labor vs parts costs if visible. List each service item performed.
9. For parts: list each line item separately with quantity and unit price.`

/**
 * Extract structured receipt data using a vision model.
 * Uses Gemini 2.5 Flash for cost efficiency (~$0.30/$2.50 per M tokens).
 */
export async function extractReceiptData(
  imageBase64: string,
  mimeType: string
): Promise<OcrExtraction> {
  const { object } = await generateObject({
    model: vercelGateway.languageModel('google/gemini-2.5-flash'),
    schema: OcrExtractionSchema,
    messages: [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: [
          {
            type: 'image',
            image: `data:${mimeType};base64,${imageBase64}`,
          },
          {
            type: 'text',
            text: 'Extract all data from this receipt/invoice. Be thorough but conservative — only include what you can clearly read.',
          },
        ],
      },
    ],
  })

  return object
}
