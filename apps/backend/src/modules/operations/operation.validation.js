import { z } from 'zod';

export const listOperationsSchema = z.object({
  query: z.object({
    isActive: z
      .enum(['true', 'false'])
      .optional()
      .transform((val) => (val === undefined ? undefined : val === 'true')),
    search: z.string().trim().optional(),
  }),
});

export const getOperationSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const createOperationSchema = z.object({
  body: z.object({
    operationCode: z.string().trim().min(1, 'Mã công đoạn là bắt buộc').max(50),
    operationName: z.string().trim().min(1, 'Tên công đoạn là bắt buộc').max(150),
    description: z.string().trim().optional().nullable(),
    standardTimeSeconds: z.coerce.number().int().positive('Thời gian định mức phải lớn hơn 0'),
    difficultyLevel: z.string().trim().max(50).default('MEDIUM'),
    isActive: z.boolean().default(true),
  }),
});

export const updateOperationSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    operationName: z.string().trim().min(1, 'Tên công đoạn là bắt buộc').max(150),
    description: z.string().trim().optional().nullable(),
    standardTimeSeconds: z.coerce.number().int().positive('Thời gian định mức phải lớn hơn 0'),
    difficultyLevel: z.string().trim().max(50),
    isActive: z.boolean(),
  }),
});

// Product operation flow schemas
export const getProductOperationsSchema = z.object({
  params: z.object({
    productId: z.coerce.number().int().positive(),
  }),
});

export const addProductOperationSchema = z.object({
  params: z.object({
    productId: z.coerce.number().int().positive(),
  }),
  body: z.object({
    operationId: z.coerce.number().int().positive(),
    sequenceNumber: z.coerce.number().int().positive('Thứ tự công đoạn phải lớn hơn 0'),
    standardTimeSeconds: z.coerce.number().int().positive('Thời gian định mức phải lớn hơn 0'),
    requiredSkillLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'SKILLED', 'EXPERT']).default('BEGINNER'),
    notes: z.string().trim().optional().nullable(),
  }),
});

export const updateProductOperationSchema = z.object({
  params: z.object({
    productId: z.coerce.number().int().positive(),
    productOperationId: z.coerce.number().int().positive(),
  }),
  body: z.object({
    sequenceNumber: z.coerce.number().int().positive('Thứ tự công đoạn phải lớn hơn 0'),
    standardTimeSeconds: z.coerce.number().int().positive('Thời gian định mức phải lớn hơn 0'),
    requiredSkillLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'SKILLED', 'EXPERT']),
    notes: z.string().trim().optional().nullable(),
  }),
});

export const removeProductOperationSchema = z.object({
  params: z.object({
    productId: z.coerce.number().int().positive(),
    productOperationId: z.coerce.number().int().positive(),
  }),
});
