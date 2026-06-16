import { z } from 'zod';

export const listProductionOrdersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    status: z.enum(['DRAFT', 'PLANNED', 'RELEASED', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'CANCELLED']).optional(),
    priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
    productId: z.coerce.number().int().positive().optional(),
    orderId: z.coerce.number().int().positive().optional(),
    search: z.string().trim().optional(),
  }),
});

export const getProductionOrderSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const createProductionOrderSchema = z.object({
  body: z.object({
    productionOrderCode: z.string().trim().min(1, 'Mã lệnh sản xuất là bắt buộc').max(50),
    orderId: z.coerce.number().int().positive('Mã đơn hàng là bắt buộc'),
    productId: z.coerce.number().int().positive('Mã sản phẩm là bắt buộc'),
    plannedQuantity: z.coerce.number().int().positive('Số lượng lên kế hoạch phải lớn hơn 0'),
    plannedStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'plannedStartDate must be in YYYY-MM-DD format'),
    plannedEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'plannedEndDate must be in YYYY-MM-DD format'),
    priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
    status: z.enum(['DRAFT', 'PLANNED', 'RELEASED', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'CANCELLED']).default('DRAFT'),
    notes: z.string().trim().optional().nullable(),
  }).refine(data => new Date(data.plannedEndDate) >= new Date(data.plannedStartDate), {
    message: 'Ngày kết thúc kế hoạch phải lớn hơn hoặc bằng ngày bắt đầu',
    path: ['plannedEndDate']
  }),
});

export const updateProductionOrderSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    plannedQuantity: z.coerce.number().int().positive('Số lượng lên kế hoạch phải lớn hơn 0'),
    plannedStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'plannedStartDate must be in YYYY-MM-DD format'),
    plannedEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'plannedEndDate must be in YYYY-MM-DD format'),
    priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
    status: z.enum(['DRAFT', 'PLANNED', 'RELEASED', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'CANCELLED']),
    notes: z.string().trim().optional().nullable(),
  }).refine(data => new Date(data.plannedEndDate) >= new Date(data.plannedStartDate), {
    message: 'Ngày kết thúc kế hoạch phải lớn hơn hoặc bằng ngày bắt đầu',
    path: ['plannedEndDate']
  }),
});

export const updateProductionOrderStatusSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    status: z.enum(['DRAFT', 'PLANNED', 'RELEASED', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'CANCELLED']),
  }),
});
