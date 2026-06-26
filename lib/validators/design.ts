import { z } from 'zod'

export const UpdateMaterialPriceSchema = z.object({
  unitPrice: z.number().int().min(1).max(10_000_000),
  reason: z.string().min(1).max(200),
})
