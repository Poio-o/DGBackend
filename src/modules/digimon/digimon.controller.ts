import type { Request, Response, NextFunction } from 'express';
import { DigimonService } from './digimon.service';
import { AppError } from '../../utils/errors';

export class DigimonController {
  public static async getMyDigimons(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new AppError('No autenticado', 401);
      }

      const data = await DigimonService.getMyDigimons(userId);

      res.status(200).json({
        status: 'success',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateNickname(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new AppError('No autenticado', 401);
      }

      const { id } = req.params;
      const { nickname } = req.body ?? {};

      if (!id || typeof id !== 'string') {
        throw new AppError('Identificador de Digimon inválido', 400);
      }

      if (!nickname || typeof nickname !== 'string') {
        throw new AppError('Mote inválido', 400);
      }

      const result = await DigimonService.updateNickname(userId, id, nickname);

      res.status(200).json({
        status: 'success',
        message: 'Mote actualizado correctamente',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
