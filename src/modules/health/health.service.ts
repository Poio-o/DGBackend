import { prisma } from '../../config/db';

export interface HealthCheckResult {
  status: 'ok' | 'degraded';
  uptimeSeconds: number;
  timestamp: string;
  database: {
    status: 'connected' | 'disconnected';
    serverTime?: string;
    version?: string;
    latencyMs?: number;
    error?: string;
  };
}

export class HealthService {
  public static async checkHealth(): Promise<HealthCheckResult> {
    const uptimeSeconds = Number(process.uptime().toFixed(2));
    const timestamp = new Date().toISOString();

    const start = Date.now();
    try {
      const result = await prisma.$queryRaw<
        Array<{ db_time: Date; db_version: string }>
      >`SELECT NOW() as db_time, version() as db_version`;
      const latencyMs = Date.now() - start;
      const row = result && result[0];

      return {
        status: 'ok',
        uptimeSeconds,
        timestamp,
        database: {
          status: 'connected',
          serverTime: row ? String(row.db_time) : undefined,
          version: row ? row.db_version : undefined,
          latencyMs,
        },
      };
    } catch (error: any) {
      return {
        status: 'degraded',
        uptimeSeconds,
        timestamp,
        database: {
          status: 'disconnected',
          error: error.message || 'Error al conectar con la base de datos PostgreSQL con Prisma',
        },
      };
    }
  }
}
