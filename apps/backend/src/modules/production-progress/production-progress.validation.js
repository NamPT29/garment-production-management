import { z } from 'zod';

export const getProgressHistorySchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(), // productionOrderId
  }),
});
