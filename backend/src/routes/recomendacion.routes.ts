/**
 * recomendacion.routes.ts
 * GET /recomendacion -- RF04, RF05 (auth)
 */
import { Router } from 'express';
import recomendacionController from '../controllers/recomendacion.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
router.get('/', authMiddleware, recomendacionController.recomendar);
export default router;
