import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  APP_NAME: z.string().min(1).optional(),
  PORT: z.string().transform(Number).pipe(z.number().positive()),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ENABLED: z
    .string()
    .optional()
    .transform((v) => (v ?? 'true').toLowerCase() === 'true'),
  CORS_ORIGIN: z.string().optional(),
  API_KEY_ENABLED: z
    .string()
    .optional()
    .transform((v) => (v ?? 'false').toLowerCase() === 'true'),
  API_KEY_BOOTSTRAP_NAME: z.string().min(1).default('bootstrap'),
  API_KEY_BOOTSTRAP_VALUE: z.string().min(1).optional(),
  DB_HOST: z.string().min(1),
  DB_PORT: z.string().transform(Number).pipe(z.number().positive()),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1),
  DB_SYNCHRONIZE: z
    .string()
    .optional()
    .transform((v) => (v ?? 'false').toLowerCase() === 'true'),
  DB_RUN_MIGRATIONS: z
    .string()
    .optional()
    .transform((v) => (v ?? 'true').toLowerCase() === 'true'),
  REDIS_HOST: z.string().min(1),
  REDIS_PORT: z.string().transform(Number).pipe(z.number().positive()),
  JWT_SECRET: z.string().min(1).optional(),
  JWT_ISSUER: z.string().min(1).optional(),
  JWT_AUDIENCE: z.string().min(1).optional(),
});

export type Env = z.infer<typeof envSchema>;
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}
export const env: Env = parsed.data;
