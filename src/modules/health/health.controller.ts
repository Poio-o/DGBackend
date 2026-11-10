import type { Request, Response } from 'express';
import { HealthService } from './health.service';

export const getHealth = async (_req: Request, res: Response): Promise<void> => {
  const health = await HealthService.checkHealth();

  if (health.status === 'ok') {
    res.status(200).json(health);
  } else {
    res.status(503).json(health);
  }
};
