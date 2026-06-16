import { z } from 'zod';

export const listEmployeesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVE']).optional(),
    position: z.enum(['WORKER', 'LINE_LEADER', 'TECHNICIAN', 'QC', 'OTHER']).optional(),
    search: z.string().trim().optional(),
  }),
});

export const getEmployeeSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const createEmployeeSchema = z.object({
  body: z.object({
    employeeCode: z.string().trim().min(1, 'Mã nhân viên là bắt buộc').max(50),
    fullName: z.string().trim().min(1, 'Họ và tên là bắt buộc').max(150),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format').optional().nullable(),
    gender: z.string().trim().max(20).optional().nullable(),
    phone: z.string().trim().max(30).optional().nullable(),
    email: z.string().email('Email không đúng định dạng').or(z.string().length(0)).optional().nullable(),
    address: z.string().trim().max(255).optional().nullable(),
    hireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Hire date must be in YYYY-MM-DD format').optional().nullable(),
    position: z.enum(['WORKER', 'LINE_LEADER', 'TECHNICIAN', 'QC', 'OTHER']).default('WORKER'),
    skillLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'SKILLED', 'EXPERT']).default('BEGINNER'),
    status: z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVE']).default('ACTIVE'),
    userId: z.coerce.number().int().positive().optional().nullable(),
  }),
});

export const updateEmployeeSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    fullName: z.string().trim().min(1, 'Họ và tên là bắt buộc').max(150),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format').optional().nullable(),
    gender: z.string().trim().max(20).optional().nullable(),
    phone: z.string().trim().max(30).optional().nullable(),
    email: z.string().email('Email không đúng định dạng').or(z.string().length(0)).optional().nullable(),
    address: z.string().trim().max(255).optional().nullable(),
    hireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Hire date must be in YYYY-MM-DD format').optional().nullable(),
    position: z.enum(['WORKER', 'LINE_LEADER', 'TECHNICIAN', 'QC', 'OTHER']),
    skillLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'SKILLED', 'EXPERT']),
    status: z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVE']),
    userId: z.coerce.number().int().positive().optional().nullable(),
  }),
});
