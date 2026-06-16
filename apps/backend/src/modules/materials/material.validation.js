import { z } from 'zod';

const categories = ['FABRIC', 'THREAD', 'BUTTON', 'ZIPPER', 'LABEL', 'PACKAGING', 'ACCESSORY', 'OTHER'];
const sortFields = ['material_code', 'material_name', 'minimum_stock', 'created_at', 'updated_at'];

export const listMaterialsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    search: z.string().trim().optional(),
    category: z.enum(categories).optional(),
    supplierId: z.coerce.number().int().positive().optional(),
    isActive: z
      .enum(['true', 'false'])
      .optional()
      .transform((value) => (value === undefined ? undefined : value === 'true')),
    lowStock: z
      .enum(['true', 'false'])
      .optional()
      .transform((value) => (value === undefined ? undefined : value === 'true')),
    sortBy: z.enum(sortFields).optional(),
    sortOrder: z.enum(['asc', 'desc', 'ASC', 'DESC']).optional(),
  }),
});

export const materialIdSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const createMaterialSchema = z.object({
  body: z.object({
    materialCode: z.string().trim().min(1).max(50),
    materialName: z.string().trim().min(1).max(150),
    category: z.enum(categories),
    unit: z.string().trim().min(1).max(30),
    color: z.string().trim().max(80).optional().nullable(),
    specification: z.string().trim().max(255).optional().nullable(),
    minimumStock: z.coerce.number().min(0).default(0),
    defaultSupplierId: z.coerce.number().int().positive().optional().nullable(),
    notes: z.string().trim().optional().nullable(),
  }),
});

export const updateMaterialSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: createMaterialSchema.shape.body.partial().refine((value) => Object.keys(value).length > 0, {
    message: 'Can co it nhat mot truong de cap nhat',
  }),
});
