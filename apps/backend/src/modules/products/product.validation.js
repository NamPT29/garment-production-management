import { z } from 'zod';

const sortFields = ['product_code', 'product_name', 'category', 'created_at', 'updated_at'];

export const listProductsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    search: z.string().trim().optional(),
    category: z.string().trim().optional(),
    isActive: z
      .enum(['true', 'false'])
      .optional()
      .transform((value) => (value === undefined ? undefined : value === 'true')),
    sortBy: z.enum(sortFields).optional(),
    sortOrder: z.enum(['asc', 'desc', 'ASC', 'DESC']).optional(),
  }),
});

export const productIdSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const createProductSchema = z.object({
  body: z.object({
    productCode: z.string().trim().min(1).max(50),
    productName: z.string().trim().min(1).max(150),
    category: z.string().trim().max(100).optional().nullable(),
    unit: z.string().trim().max(30).optional().nullable(),
    description: z.string().trim().optional().nullable(),
    standardTimeMinutes: z.coerce.number().int().positive().optional().nullable(),
    imageUrl: z.string().trim().url().max(255).optional().nullable().or(z.literal('')),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: createProductSchema.shape.body.partial().refine((value) => Object.keys(value).length > 0, {
    message: 'Can co it nhat mot truong de cap nhat',
  }),
});
