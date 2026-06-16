import { z } from 'zod';

const categories = ['FABRIC', 'THREAD', 'BUTTON', 'ZIPPER', 'LABEL', 'PACKAGING', 'ACCESSORY', 'OTHER'];
const txTypes = ['RECEIPT', 'ISSUE', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT'];
const balanceSortFields = ['quantity_on_hand', 'updated_at'];
const txSortFields = ['transaction_code', 'transaction_date', 'created_at', 'updated_at'];

export const listBalancesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    search: z.string().trim().optional(),
    warehouseId: z.coerce.number().int().positive().optional(),
    materialId: z.coerce.number().int().positive().optional(),
    category: z.enum(categories).optional(),
    lowStock: z
      .enum(['true', 'false'])
      .optional()
      .transform((value) => (value === undefined ? undefined : value === 'true')),
    sortBy: z.enum(balanceSortFields).optional(),
    sortOrder: z.enum(['asc', 'desc', 'ASC', 'DESC']).optional(),
  }),
});

export const listTransactionsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    transactionType: z.enum(txTypes).optional(),
    warehouseId: z.coerce.number().int().positive().optional(),
    supplierId: z.coerce.number().int().positive().optional(),
    orderId: z.coerce.number().int().positive().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    search: z.string().trim().optional(),
    sortBy: z.enum(txSortFields).optional(),
    sortOrder: z.enum(['asc', 'desc', 'ASC', 'DESC']).optional(),
  }),
});

export const transactionIdSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

const receiptItemSchema = z.object({
  materialId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().positive('Quantity must be greater than 0'),
  unitCost: z.coerce.number().min(0, 'Unit cost must not be negative'),
  notes: z.string().trim().optional().nullable(),
});

export const createReceiptSchema = z.object({
  body: z.object({
    transactionCode: z.string().trim().min(1, 'Transaction code must not be empty').max(50),
    warehouseId: z.coerce.number().int().positive(),
    supplierId: z.coerce.number().int().positive().optional().nullable(),
    transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Transaction date must be in YYYY-MM-DD format'),
    referenceNumber: z.string().trim().max(100).optional().nullable(),
    notes: z.string().trim().optional().nullable(),
    items: z
      .array(receiptItemSchema)
      .min(1, 'Transaction must contain at least one item')
      .refine(
        (items) => {
          const ids = items.map((item) => item.materialId);
          return new Set(ids).size === ids.length;
        },
        { message: 'Materials in transaction must be unique' },
      ),
  }),
});

const issueItemSchema = z.object({
  materialId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().positive('Quantity must be greater than 0'),
  notes: z.string().trim().optional().nullable(),
});

export const createIssueSchema = z.object({
  body: z.object({
    transactionCode: z.string().trim().min(1, 'Transaction code must not be empty').max(50),
    warehouseId: z.coerce.number().int().positive(),
    orderId: z.coerce.number().int().positive().optional().nullable(),
    transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Transaction date must be in YYYY-MM-DD format'),
    notes: z.string().trim().optional().nullable(),
    items: z
      .array(issueItemSchema)
      .min(1, 'Transaction must contain at least one item')
      .refine(
        (items) => {
          const ids = items.map((item) => item.materialId);
          return new Set(ids).size === ids.length;
        },
        { message: 'Materials in transaction must be unique' },
      ),
  }),
});

const adjustmentItemSchema = z.object({
  materialId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().positive('Quantity must be greater than 0'),
  notes: z.string().trim().optional().nullable(),
});

export const createAdjustmentSchema = z.object({
  body: z.object({
    transactionCode: z.string().trim().min(1, 'Transaction code must not be empty').max(50),
    transactionType: z.enum(['ADJUSTMENT_IN', 'ADJUSTMENT_OUT']),
    warehouseId: z.coerce.number().int().positive(),
    transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Transaction date must be in YYYY-MM-DD format'),
    notes: z.string().trim().min(1, 'Notes (reason) is required for adjustments'),
    items: z
      .array(adjustmentItemSchema)
      .min(1, 'Transaction must contain at least one item')
      .refine(
        (items) => {
          const ids = items.map((item) => item.materialId);
          return new Set(ids).size === ids.length;
        },
        { message: 'Materials in transaction must be unique' },
      ),
  }),
});
