/**
 * historial.routes.ts
 * POST /historial  -- registrar receta cocinada (auth)
 * GET  /historial  -- listar historial del usuario (auth)
 */

import { Router } from 'express';
import historialController from '../controllers/historial.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authMiddleware, historialController.marcarCocinada);
router.get('/', authMiddleware, historialController.getHistorial);

export default router;
