import 'dotenv/config';

export const env = {
  PORT: Number(process.env.PORT ?? 3000),
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  API_PREFIX: process.env.API_PREFIX ?? '/api/v1',
  DATABASE_URL:
    process.env.DATABASE_URL ??
    'postgresql://postgres:postgres@localhost:5432/dg_database?schema=public',
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? '*',
};
