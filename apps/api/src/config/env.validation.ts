import { z } from 'zod';

/**
 * Startup environment validation. The process crashes fast with a readable
 * message if anything required is missing or malformed.
 */
const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),
  ADMIN_USERNAME: z.string().min(1, 'ADMIN_USERNAME is required'),
  ADMIN_PASSWORD: z.string().min(1, 'ADMIN_PASSWORD is required'),

  VAULT_PATH: z.string().min(1, 'VAULT_PATH is required'),

  NEW_CARDS_PER_SESSION: z.coerce.number().int().nonnegative().default(10),
  SESSION_CARD_LIMIT: z.coerce.number().int().positive().default(50),
  OVERDUE_WEIGHT: z.coerce.number().default(2.0),
  MISTAKE_WEIGHT: z.coerce.number().default(1.5),
  NEW_CARD_WEIGHT: z.coerce.number().default(0.8),
  STREAK_BONUS_WEIGHT: z.coerce.number().default(0.1),
  LONG_ABSENCE_THRESHOLD_DAYS: z.coerce.number().int().positive().default(30),

  OPENAI_API_KEY: z.string().optional().default(''),
  EMBEDDING_MODEL: z.string().default('text-embedding-3-small'),
  CHAT_MODEL: z.string().default('gpt-4o-mini'),
  OPENAI_MOCK: z.string().default('true'),

  CORS_ORIGINS: z.string().default('http://localhost:5173'),
});

export type ValidatedEnv = z.infer<typeof envSchema>;

/**
 * Validate `process.env` against the schema.
 * @param config Raw environment variables.
 * @returns The validated and coerced configuration object.
 * @throws Error with a list of all validation problems if invalid.
 */
export function validateEnv(config: Record<string, unknown>): ValidatedEnv {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return result.data;
}
