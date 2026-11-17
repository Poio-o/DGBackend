import { Router } from 'express';
import { RaisingController } from './raising.controller';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = Router();

router.post('/:id/feed', authMiddleware, RaisingController.feed);
router.post('/:id/train', authMiddleware, RaisingController.train);
router.post('/:id/rest', authMiddleware, RaisingController.rest);
router.get('/:id/status', authMiddleware, RaisingController.getStatus);

export default router;
