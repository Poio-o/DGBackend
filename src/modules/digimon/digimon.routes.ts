import { Router } from 'express';
import { DigimonController } from './digimon.controller';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = Router();

router.get('/mine', authMiddleware, DigimonController.getMyDigimons);
router.patch('/:id', authMiddleware, DigimonController.updateNickname);

export default router;
