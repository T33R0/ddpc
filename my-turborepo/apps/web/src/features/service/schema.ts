import { z } from 'zod'

// Zod schema for the form
export const ServiceLogSchema = z.object({
  user_vehicle_id: z.string().uuid(),
  service_provider: z.string().optional(),
  cost: z.coerce.number().min(0).optional(),
  odometer: z.coerce.number().min(0).optional(),
  event_date: z.string().min(1, 'Date is required.'), // Changed to min(1) for simple validation
  notes: z.string().optional(),
  // This is the key. It's the ID of the `service_intervals` item.
  plan_item_id: z.string().uuid().optional(),
  // Service item ID from service_items table
  service_item_id: z.string().uuid().optional(),
  // Status: "History" for past/completed services, "Plan" for planned services
  status: z.enum(['History', 'Plan']).optional(),
})

export type ServiceLogInputs = z.infer<typeof ServiceLogSchema>

