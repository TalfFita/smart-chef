/**
 * anotacion.routes.ts
 * Rutas globales de anotaciones (no anidadas bajo receta):
 * GET    /anotaciones/privadas        -- todas las mías RF07 (auth)
 * PATCH  /anotaciones/privadas/:id   -- editar RF07 (auth)
 * DELETE /anotaciones/privadas/:id   -- eliminar RF07 (auth)
 */
import { Router } from 'express';
import anotacionController from '../controllers/anotacion.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
router.get('/privadas', authMiddleware, anotacionController.listarTodasPrivadas);
router.patch('/privadas/:id', authMiddleware, anotacionController.actualizarPrivada);
router.delete('/privadas/:id', authMiddleware, anotacionController.eliminarPrivada);
export default router;
