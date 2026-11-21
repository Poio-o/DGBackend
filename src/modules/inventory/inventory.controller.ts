import type { Request, Response, NextFunction } from 'express';
import { InventoryService } from './inventory.service';
import { AppError } from '../../utils/errors';

export class InventoryController {
  public static async getMyInventory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new AppError('No autenticado', 401);
      }

      const data = await InventoryService.getMyInventory(userId);

      res.status(200).json({
        status: 'success',
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}
