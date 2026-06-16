import { z } from 'zod';

const sortFields = ['warehouse_code', 'warehouse_name', 'created_at', 'updated_at'];
const categories = ['FABRIC', 'THREAD', 'BUTTON', 'ZIPPER', 'LABEL', 'PACKAGING', 'ACCESSORY', 'OTHER'];

export const listWarehousesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    search: z.string().trim().optional(),
    isActive: z
      .enum(['true', 'false'])
      .optional()
      .transform((value) => (value === undefined ? undefined : value === 'true')),
    sortBy: z.enum(sortFields).optional(),
    sortOrder: z.enum(['asc', 'desc', 'ASC', 'DESC']).optional(),
  }),
});

export const warehouseIdSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const listWarehouseBalancesSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    search: z.string().trim().optional(),
    category: z.enum(categories).optional(),
    lowStock: z
      .enum(['true', 'false'])
      .optional()
      .transform((value) => (value === undefined ? undefined : value === 'true')),
  }),
});

export const createWarehouseSchema = z.object({
  body: z.object({
    warehouseCode: z.string().trim().min(1).max(50),
    warehouseName: z.string().trim().min(1).max(150),
    location: z.string().trim().max(255).optional().nullable(),
    description: z.string().trim().optional().nullable(),
  }),
});

export const updateWarehouseSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: createWarehouseSchema.shape.body.partial().refine((value) => Object.keys(value).length > 0, {
    message: 'Can co it nhat mot truong de cap nhat',
  }),
});
