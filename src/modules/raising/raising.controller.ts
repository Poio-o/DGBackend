import type { Request, Response, NextFunction } from 'express';
import { RaisingService } from './raising.service';
import { AppError } from '../../utils/errors';

export class RaisingController {
  public static async feed(
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
      const { itemId } = req.body ?? {};

      if (!id || typeof id !== 'string') {
        throw new AppError('Identificador de Digimon inválido', 400);
      }

      if (!itemId || typeof itemId !== 'string') {
        throw new AppError(
          'Debe especificar el itemId del alimento a consumir',
          400
        );
      }

      const result = await RaisingService.feedDigimon(userId, id, itemId);

      res.status(200).json({
        status: 'success',
        message: 'Digimon alimentado correctamente',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getStatus(
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
      if (!id || typeof id !== 'string') {
        throw new AppError('Identificador de Digimon inválido', 400);
      }

      const result = await RaisingService.getDigimonStatus(userId, id);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
