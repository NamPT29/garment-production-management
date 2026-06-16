import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    identifier: z.string().min(1).max(150),
    password: z.string().min(1).max(100),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1).max(100),
    newPassword: z.string().min(8).max(100),
  }),
});
