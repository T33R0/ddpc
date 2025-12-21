import { z } from 'zod'

export const WishlistItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.string().optional().nullable(),
  price: z.coerce.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high']),
  type: z.enum(['mod', 'service']),
  category: z.string().optional().nullable(),
  vehicle_id: z.string().uuid(),
})

export type WishlistItemInput = z.infer<typeof WishlistItemSchema>
