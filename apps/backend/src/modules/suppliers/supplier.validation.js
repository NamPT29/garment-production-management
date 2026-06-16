import { z } from 'zod';

const sortFields = ['supplier_code', 'supplier_name', 'created_at', 'updated_at'];

export const listSuppliersSchema = z.object({
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

export const supplierIdSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const createSupplierSchema = z.object({
  body: z.object({
    supplierCode: z.string().trim().min(1).max(50),
    supplierName: z.string().trim().min(1).max(150),
    contactPerson: z.string().trim().max(150).optional().nullable(),
    phone: z.string().trim().max(30).optional().nullable(),
    email: z.string().trim().email().max(150).optional().nullable().or(z.literal('')),
    address: z.string().trim().max(255).optional().nullable(),
    taxCode: z.string().trim().max(50).optional().nullable(),
    notes: z.string().trim().optional().nullable(),
  }),
});

export const updateSupplierSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: createSupplierSchema.shape.body.partial().refine((value) => Object.keys(value).length > 0, {
    message: 'Can co it nhat mot truong de cap nhat',
  }),
});
