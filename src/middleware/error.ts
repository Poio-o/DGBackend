import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  logger.error(`${req.method} ${req.path} - ${err.message}`);
  if (err.stack) {
    logger.error(err.stack);
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    status: 'error',
    message: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
