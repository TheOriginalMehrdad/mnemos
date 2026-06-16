import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  jwtSecret: process.env.JWT_SECRET ?? 'fallback-dev-secret-change-in-production',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? 'fallback-refresh-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10),
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173').split(','),
  adminUsername: process.env.ADMIN_USERNAME ?? 'admin',
  adminPassword: process.env.ADMIN_PASSWORD ?? 'change-me',
}));

export const redisConfig = registerAs('redis', () => ({
  url: process.env.REDIS_URL ?? 'redis://localhost:6379',
}));

export const openaiConfig = registerAs('openai', () => ({
  apiKey: process.env.OPENAI_API_KEY ?? '',
  embeddingModel: process.env.EMBEDDING_MODEL ?? 'text-embedding-3-small',
  chatModel: process.env.CHAT_MODEL ?? 'gpt-4o-mini',
  mock: process.env.OPENAI_MOCK !== 'false',
}));

export const vaultConfig = registerAs('vault', () => ({
  path: process.env.VAULT_PATH ?? './vault',
  uploadDir: process.env.VAULT_UPLOAD_DIR ?? './uploads',
  maxSizeMb: parseInt(process.env.VAULT_MAX_SIZE_MB ?? '50', 10),
}));

/**
 * Adaptive review-queue tuning. Every weight and threshold the scoring engine
 * uses is sourced here so nothing is hardcoded in business logic.
 */
export const adaptiveConfig = registerAs('adaptive', () => ({
  newCardsPerSession: parseInt(process.env.NEW_CARDS_PER_SESSION ?? '10', 10),
  sessionCardLimit: parseInt(process.env.SESSION_CARD_LIMIT ?? '50', 10),
  overdueWeight: parseFloat(process.env.OVERDUE_WEIGHT ?? '2.0'),
  mistakeWeight: parseFloat(process.env.MISTAKE_WEIGHT ?? '1.5'),
  newCardWeight: parseFloat(process.env.NEW_CARD_WEIGHT ?? '0.8'),
  streakBonusWeight: parseFloat(process.env.STREAK_BONUS_WEIGHT ?? '0.1'),
  longAbsenceThresholdDays: parseInt(process.env.LONG_ABSENCE_THRESHOLD_DAYS ?? '30', 10),
}));
