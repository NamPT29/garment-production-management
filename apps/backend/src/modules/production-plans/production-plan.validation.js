import { z } from 'zod';

// Schedules
export const listSchedulesSchema = z.object({
  query: z.object({
    productionOrderId: z.coerce.number().int().positive().optional(),
    productionLineId: z.coerce.number().int().positive().optional(),
    shiftId: z.coerce.number().int().positive().optional(),
    scheduleDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }),
});

export const getScheduleSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

// Base object (before refine) so we can .extend() it safely
const scheduleBodyBaseSchema = z.object({
  productionOrderId: z.coerce.number().int().positive('Mã lệnh sản xuất là bắt buộc'),
  productionLineId: z.coerce.number().int().positive('Mã chuyền may là bắt buộc'),
  shiftId: z.coerce.number().int().positive('Mã ca làm việc là bắt buộc'),
  scheduleDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'scheduleDate must be in YYYY-MM-DD format'),
  allocatedQuantity: z.coerce.number().int().positive('Số lượng phân bổ phải lớn hơn 0'),
  targetQuantity: z.coerce.number().int().positive('Sản lượng mục tiêu phải lớn hơn 0'),
  plannedWorkers: z.coerce.number().int().positive('Số lượng công nhân kế hoạch phải lớn hơn 0'),
  plannedStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'plannedStartDate must be in YYYY-MM-DD format'),
  plannedEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'plannedEndDate must be in YYYY-MM-DD format'),
  status: z.enum(['DRAFT', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('DRAFT'),
  notes: z.string().trim().optional().nullable(),
});

const dateRangeRefine = (data) => new Date(data.plannedEndDate) >= new Date(data.plannedStartDate);
const dateRangeError = {
  message: 'Ngày kết thúc kế hoạch phải lớn hơn hoặc bằng ngày bắt đầu',
  path: ['plannedEndDate'],
};

export const createScheduleSchema = z.object({
  body: scheduleBodyBaseSchema.refine(dateRangeRefine, dateRangeError),
});

export const updateScheduleSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: scheduleBodyBaseSchema
    .extend({
      status: z.enum(['DRAFT', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
    })
    .refine(dateRangeRefine, dateRangeError),
});
