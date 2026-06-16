import { z } from 'zod';

// Allocations
export const listAllocationsSchema = z.object({
  query: z.object({
    productionOrderId: z.coerce.number().int().positive().optional(),
    productionLineId: z.coerce.number().int().positive().optional(),
    status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  }),
});

export const getAllocationSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const createAllocationSchema = z.object({
  body: z.object({
    productionOrderId: z.coerce.number().int().positive('Mã lệnh sản xuất là bắt buộc'),
    productionLineId: z.coerce.number().int().positive('Mã chuyền may là bắt buộc'),
    allocatedQuantity: z.coerce.number().int().positive('Số lượng phân bổ phải lớn hơn 0'),
    plannedStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'plannedStartDate must be in YYYY-MM-DD format'),
    plannedEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'plannedEndDate must be in YYYY-MM-DD format'),
    status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('PLANNED'),
    notes: z.string().trim().optional().nullable(),
  }).refine(data => new Date(data.plannedEndDate) >= new Date(data.plannedStartDate), {
    message: 'Ngày kết thúc phân bổ phải lớn hơn hoặc bằng ngày bắt đầu',
    path: ['plannedEndDate']
  }),
});

export const updateAllocationSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    productionLineId: z.coerce.number().int().positive('Mã chuyền may là bắt buộc'),
    allocatedQuantity: z.coerce.number().int().positive('Số lượng phân bổ phải lớn hơn 0'),
    plannedStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'plannedStartDate must be in YYYY-MM-DD format'),
    plannedEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'plannedEndDate must be in YYYY-MM-DD format'),
    status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
    notes: z.string().trim().optional().nullable(),
  }).refine(data => new Date(data.plannedEndDate) >= new Date(data.plannedStartDate), {
    message: 'Ngày kết thúc phân bổ phải lớn hơn hoặc bằng ngày bắt đầu',
    path: ['plannedEndDate']
  }),
});

// Schedules
export const listSchedulesSchema = z.object({
  query: z.object({
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

export const createScheduleSchema = z.object({
  body: z.object({
    productionAllocationId: z.coerce.number().int().positive('Mã phân bổ là bắt buộc'),
    productionLineId: z.coerce.number().int().positive('Mã chuyền may là bắt buộc'),
    shiftId: z.coerce.number().int().positive('Mã ca làm việc là bắt buộc'),
    scheduleDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'scheduleDate must be in YYYY-MM-DD format'),
    targetQuantity: z.coerce.number().int().positive('Sản lượng mục tiêu phải lớn hơn 0'),
    plannedWorkers: z.coerce.number().int().positive('Số lượng công nhân kế hoạch phải lớn hơn 0'),
    status: z.enum(['DRAFT', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('DRAFT'),
    notes: z.string().trim().optional().nullable(),
  }),
});

export const updateScheduleSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    productionAllocationId: z.coerce.number().int().positive('Mã phân bổ là bắt buộc'),
    productionLineId: z.coerce.number().int().positive('Mã chuyền may là bắt buộc'),
    shiftId: z.coerce.number().int().positive('Mã ca làm việc là bắt buộc'),
    scheduleDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'scheduleDate must be in YYYY-MM-DD format'),
    targetQuantity: z.coerce.number().int().positive('Sản lượng mục tiêu phải lớn hơn 0'),
    plannedWorkers: z.coerce.number().int().positive('Số lượng công nhân kế hoạch phải lớn hơn 0'),
    status: z.enum(['DRAFT', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
    notes: z.string().trim().optional().nullable(),
  }),
});

// Employee schedule assignment
export const assignScheduleEmployeeSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(), // Schedule ID
  }),
  body: z.object({
    employeeId: z.coerce.number().int().positive('Mã nhân viên là bắt buộc'),
    operationId: z.coerce.number().int().positive('Mã công đoạn là bắt buộc'),
    assignedQuantity: z.coerce.number().int().positive().optional().nullable(),
    notes: z.string().trim().optional().nullable(),
  }),
});

export const removeScheduleEmployeeSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(), // Schedule ID
    assignmentId: z.coerce.number().int().positive(), // Assignment ID
  }),
});
