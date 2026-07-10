/**
 * usuario.routes.ts
 * GET /usuarios/me/recetario -- colecciones del recetario personal (auth)
 */

import { Router } from 'express';
import usuarioController from '../controllers/usuario.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/me/recetario', authMiddleware, usuarioController.getRecetario);

export default router;
