import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const emptyToUndefined = (value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
};

const envValue = (...keys) => {
  for (const key of keys) {
    const value = emptyToUndefined(process.env[key]);
    if (value !== undefined) {
      return value;
    }
  }

  return undefined;
};

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z.string().min(1),
  CORS_ORIGIN: z
    .string()
    .min(1)
    .default('http://localhost:3000,http://localhost:3001,http://localhost:5173,http://localhost:8080'),
  JWT_ACCESS_SECRET: z.preprocess(
    () => envValue('JWT_ACCESS_SECRET', 'ACCESS_TOKEN_SECRET', 'JWT_SECRET'),
    z.string().min(32),
  ),
  JWT_REFRESH_SECRET: z.preprocess(
    () => envValue('JWT_REFRESH_SECRET', 'REFRESH_TOKEN_SECRET', 'JWT_SECRET'),
    z.string().min(32),
  ),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('30d'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(2000),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  CONTACT_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
  BCRYPT_OR_ARGON2_PEPPER: z.string().min(16),
  OPENAI_API_KEY: z.preprocess(emptyToUndefined, z.string().min(20).optional()),
  OPENAI_MODEL: z.string().min(3).default('gpt-4o-mini'),
  IMAGEKIT_PUBLIC_KEY: z.string().min(10),
  IMAGEKIT_PRIVATE_KEY: z.string().min(10),
  IMAGEKIT_URL_ENDPOINT: z.string().url(),
  GOOGLE_OAUTH_CLIENT_ID: z.preprocess(emptyToUndefined, z.string().min(10).optional()),
  GOOGLE_OAUTH_CLIENT_SECRET: z.preprocess(emptyToUndefined, z.string().min(10).optional()),
  GOOGLE_OAUTH_REDIRECT_URI: z.preprocess(emptyToUndefined, z.string().url().optional()),

  // Apache Solr is optional. When SOLR_URL is unset the job search falls back to
  // a cached MongoDB query, so the app keeps working without a Solr server.
  SOLR_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  SOLR_JOBS_CORE: z.string().trim().min(1).default('jobs'),
  SOLR_CANDIDATES_CORE: z.string().trim().min(1).default('candidates'),
  SOLR_TIMEOUT_MS: z.coerce.number().int().positive().default(4000),

  FRONTEND_URL: z.preprocess(
    () => envValue('FRONTEND_URL', 'CLIENT_URL'),
    z.string().url().default('http://localhost:3000'),
  ),
  BACKEND_PUBLIC_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  PASSWORD_RESET_EXPIRES_MIN: z.coerce.number().int().positive().default(30),
  BREVO_EMAIL: z.preprocess(emptyToUndefined, z.string().email().optional()),
  BREVO_SMTP_KEY: z.preprocess(emptyToUndefined, z.string().min(10).optional()),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

