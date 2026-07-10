/**
 * favorito.routes.ts
 * GET    /favoritos              -- listar favoritos RF06 (auth)
 * POST   /favoritos/:recetaId    -- añadir favorito RF06 (auth)
 * DELETE /favoritos/:recetaId    -- quitar favorito RF06 (auth)
 */
import { Router } from 'express';
import favoritoController from '../controllers/favorito.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
router.get('/', authMiddleware, favoritoController.listar);
router.post('/:recetaId', authMiddleware, favoritoController.añadir);
router.delete('/:recetaId', authMiddleware, favoritoController.quitar);
export default router;
