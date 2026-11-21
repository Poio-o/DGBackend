import { Router } from 'express';
import { InventoryController } from './inventory.controller';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = Router();

router.get('/mine', authMiddleware, InventoryController.getMyInventory);

export default router;
