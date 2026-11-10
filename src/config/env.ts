import 'dotenv/config';

export const env = {
  PORT: Number(process.env.PORT ?? 3000),
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  API_PREFIX: process.env.API_PREFIX ?? '/api/v1',
  DATABASE_URL:
    process.env.DATABASE_URL ??
    'postgresql://postgres:postgres@localhost:5432/dg_database?schema=public',
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? '*',
  JWT_SECRET:
    process.env.JWT_SECRET ??
    'super_secret_jwt_key_dgworld_2026_change_in_production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '30d',
};
