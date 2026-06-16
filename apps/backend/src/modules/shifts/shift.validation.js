import { z } from 'zod';

export const listShiftsSchema = z.object({
  query: z.object({
    isActive: z
      .enum(['true', 'false'])
      .optional()
      .transform((val) => (val === undefined ? undefined : val === 'true')),
    search: z.string().trim().optional(),
  }),
});

export const getShiftSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const createShiftSchema = z.object({
  body: z.object({
    shiftCode: z.string().trim().min(1, 'Mã ca là bắt buộc').max(50),
    shiftName: z.string().trim().min(1, 'Tên ca là bắt buộc').max(100),
    startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'startTime must be in HH:MM or HH:MM:SS format'),
    endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'endTime must be in HH:MM or HH:MM:SS format'),
    breakMinutes: z.coerce.number().int().min(0).default(0),
    isActive: z.boolean().default(true),
  }),
});

export const updateShiftSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    shiftName: z.string().trim().min(1, 'Tên ca là bắt buộc').max(100),
    startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'startTime must be in HH:MM or HH:MM:SS format'),
    endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'endTime must be in HH:MM or HH:MM:SS format'),
    breakMinutes: z.coerce.number().int().min(0),
    isActive: z.boolean(),
  }),
});
