import dotenv from 'dotenv';
import { z } from 'zod';

const envFiles = process.env.ENV_FILE
  ? [process.env.ENV_FILE]
  : ['apps/backend/.env', '.env', 'apps/backend/.env.example', '.env.example'];

for (const envFile of envFiles) {
  dotenv.config({ path: envFile, override: false });
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  BACKEND_PORT: z.coerce.number().int().positive().optional(),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_USER: z.string().default('root'),
  DB_PASSWORD: z.string().default(''),
  DB_NAME: z.string().default('garment_production'),
  DB_CONNECTION_LIMIT: z.coerce.number().int().positive().default(10),
  JWT_SECRET: z.string().min(12).default('change_me_in_real_environment'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  AI_SERVICE_URL: z.string().url().default('http://localhost:8000'),
  UPLOAD_DIRECTORY: z.string().default('uploads'),
  DEV_ADMIN_USERNAME: z.string().default('admin'),
  DEV_ADMIN_EMAIL: z.string().email().default('admin@example.com'),
  DEV_ADMIN_PASSWORD: z.string().min(8).default('Admin@123456'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Bien moi truong khong hop le', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

export const env = {
  ...parsed.data,
  BACKEND_PORT: parsed.data.BACKEND_PORT ?? parsed.data.PORT,
};
