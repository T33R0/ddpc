import { z } from 'zod'

// Zod schema for the fuel log form
export const FuelLogSchema = z.object({
  user_vehicle_id: z.string().uuid(),
  event_date: z.string().min(1, 'Date is required.'),
  odometer: z.coerce.number().min(1, 'Odometer is required.'),
  gallons: z.coerce.number().min(0.01, 'Gallons are required.'),
  price_per_gallon: z.coerce.number().min(0.01, 'Price is required.'),
})

export type FuelLogInputs = z.infer<typeof FuelLogSchema>

