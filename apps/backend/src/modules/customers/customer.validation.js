import { z } from 'zod';

const sortFields = ['customer_code', 'customer_name', 'created_at', 'updated_at'];

export const listCustomersSchema = z.object({
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

export const customerIdSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const createCustomerSchema = z.object({
  body: z.object({
    customerCode: z.string().trim().min(1).max(50),
    customerName: z.string().trim().min(1).max(150),
    contactPerson: z.string().trim().max(150).optional().nullable(),
    phone: z.string().trim().max(30).optional().nullable(),
    email: z.string().trim().email().max(150).optional().nullable().or(z.literal('')),
    address: z.string().trim().max(255).optional().nullable(),
    taxCode: z.string().trim().max(50).optional().nullable(),
    notes: z.string().trim().optional().nullable(),
  }),
});

export const updateCustomerSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: createCustomerSchema.shape.body.partial().refine((value) => Object.keys(value).length > 0, {
    message: 'Can co it nhat mot truong de cap nhat',
  }),
});
