/**
 * auth.routes.ts -- Rutas de autenticación
 *
 * Define los endpoints públicos de autenticación.
 * Estas rutas NO llevan authMiddleware: son accesibles sin token.
 *
 * POST /auth/registro  -- RF01
 * POST /auth/login     -- RF01, RF02
 */

import { Router } from 'express';
import authController from '../controllers/auth.controller';

const router = Router();

router.post('/registro', authController.registro);

router.post('/login', authController.login);

export default router;
