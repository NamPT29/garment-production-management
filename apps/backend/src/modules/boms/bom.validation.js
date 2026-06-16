import { z } from 'zod';

const statuses = ['DRAFT', 'ACTIVE', 'INACTIVE'];
const sortFields = ['version', 'status', 'effective_date', 'created_at', 'updated_at'];

export const listBomsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    search: z.string().trim().optional(),
    productId: z.coerce.number().int().positive().optional(),
    status: z.enum(statuses).optional(),
    sortBy: z.enum(sortFields).optional(),
    sortOrder: z.enum(['asc', 'desc', 'ASC', 'DESC']).optional(),
  }),
});

export const bomIdSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const productIdSchema = z.object({
  params: z.object({
    productId: z.coerce.number().int().positive(),
  }),
});

const bomItemSchema = z.object({
  materialId: z.coerce.number().int().positive(),
  quantityPerUnit: z.coerce.number().positive('Quantity per unit must be greater than 0'),
  wasteRatePercent: z.coerce.number().min(0).max(100, 'Waste rate must be between 0 and 100'),
  notes: z.string().trim().optional().nullable(),
});

export const createBomSchema = z.object({
  body: z.object({
    productId: z.coerce.number().int().positive(),
    version: z.string().trim().min(1, 'Version must not be empty').max(50),
    effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Effective date must be in YYYY-MM-DD format'),
    notes: z.string().trim().optional().nullable(),
    items: z
      .array(bomItemSchema)
      .min(1, 'BOM must contain at least one material item')
      .refine(
        (items) => {
          const ids = items.map((item) => item.materialId);
          return new Set(ids).size === ids.length;
        },
        { message: 'Materials in BOM must be unique' },
      ),
  }),
});

export const updateBomSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    version: z.string().trim().min(1).max(50).optional(),
    effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    notes: z.string().trim().optional().nullable(),
    items: z
      .array(bomItemSchema)
      .min(1)
      .refine(
        (items) => {
          const ids = items.map((item) => item.materialId);
          return new Set(ids).size === ids.length;
        },
        { message: 'Materials in BOM must be unique' },
      )
      .optional(),
  }),
});
