import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const globalForPrisma = globalThis as { prisma?: PrismaClient };

export const prisma =
  (globalForPrisma.prisma ??= new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  }));

export const testDbConnection = async (): Promise<boolean> => {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Conexión a PostgreSQL con Prisma establecida correctamente.');
    return true;
  } catch (error: any) {
    logger.error(`No se pudo conectar a PostgreSQL con Prisma: ${error.message}`);
    return false;
  }
};
