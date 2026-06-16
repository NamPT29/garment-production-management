import { z } from 'zod';

export const listProductionOutputsSchema = z.object({
  query: z.object({
    productionLineId: z.coerce.number().int().positive().optional(),
    productionOrderId: z.coerce.number().int().positive().optional(),
    dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }),
});

export const getProductionOutputSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const createProductionOutputSchema = z.object({
  body: z.object({
    productionScheduleId: z.coerce.number().int().positive('Mã kế hoạch là bắt buộc'),
    productionOrderId: z.coerce.number().int().positive('Mã lệnh sản xuất là bắt buộc'),
    productionLineId: z.coerce.number().int().positive('Mã chuyền may là bắt buộc'),
    shiftId: z.coerce.number().int().positive('Mã ca làm việc là bắt buộc'),
    outputDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'outputDate must be in YYYY-MM-DD format'),
    goodQuantity: z.coerce.number().int().min(0, 'Số lượng sản phẩm đạt phải >= 0'),
    defectQuantity: z.coerce.number().int().min(0, 'Số lượng sản phẩm lỗi phải >= 0'),
    reworkQuantity: z.coerce.number().int().min(0, 'Số lượng sửa lại phải >= 0').default(0),
    workingMinutes: z.coerce.number().int().min(0, 'Thời gian làm việc phải >= 0').default(480),
    downtimeMinutes: z.coerce.number().int().min(0, 'Thời gian dừng chuyền phải >= 0').default(0),
    notes: z.string().trim().optional().nullable(),
  }),
});
