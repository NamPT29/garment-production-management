import { z } from 'zod';

export const listProductionLinesSchema = z.object({
  query: z.object({
    status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']).optional(),
    search: z.string().trim().optional(),
  }),
});

export const getProductionLineSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const createProductionLineSchema = z.object({
  body: z.object({
    lineCode: z.string().trim().min(1, 'Mã chuyền là bắt buộc').max(50),
    lineName: z.string().trim().min(1, 'Tên chuyền là bắt buộc').max(150),
    location: z.string().trim().max(255).optional().nullable(),
    targetWorkers: z.coerce.number().int().min(0, 'Target workers must be non-negative').default(0),
    maximumWorkers: z.coerce.number().int().min(0, 'Maximum workers must be non-negative').default(0),
    status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']).default('ACTIVE'),
    description: z.string().trim().optional().nullable(),
  }).refine(data => data.maximumWorkers >= data.targetWorkers, {
    message: 'Số lượng công nhân tối đa phải lớn hơn hoặc bằng số lượng mục tiêu',
    path: ['maximumWorkers']
  }),
});

export const updateProductionLineSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    lineName: z.string().trim().min(1, 'Tên chuyền là bắt buộc').max(150),
    location: z.string().trim().max(255).optional().nullable(),
    targetWorkers: z.coerce.number().int().min(0, 'Target workers must be non-negative'),
    maximumWorkers: z.coerce.number().int().min(0, 'Maximum workers must be non-negative'),
    status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']),
    description: z.string().trim().optional().nullable(),
  }).refine(data => data.maximumWorkers >= data.targetWorkers, {
    message: 'Số lượng công nhân tối đa phải lớn hơn hoặc bằng số lượng mục tiêu',
    path: ['maximumWorkers']
  }),
});
