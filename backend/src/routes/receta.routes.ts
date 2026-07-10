/**
 * receta.routes.ts
 *
 * GET  /recetas           -- catálogo / búsqueda RF03, RF11 (público)
 * GET  /recetas/trending  -- top por favoritos (público)
 * GET  /recetas/:id       -- detalle RF03 (público)
 * POST /recetas           -- crear RF09 (auth)
 * PUT  /recetas/:id       -- editar receta propia (auth + ownership)
 * DELETE /recetas/:id     -- eliminar (borrado lógico) receta propia (auth + ownership)
 *
 * Rutas de anotaciones anidadas bajo receta:
 * POST   /recetas/:recetaId/anotaciones/privadas  (auth)
 * GET    /recetas/:recetaId/anotaciones/privadas  (auth)
 * POST   /recetas/:recetaId/anotaciones/estilo    (auth, solo autor)
 * GET    /recetas/:recetaId/anotaciones/estilo    (auth)
 * DELETE /recetas/:recetaId/anotaciones/estilo/:id (auth, solo autor)
 */

import { Router } from 'express';
import recetaController from '../controllers/receta.controller';
import anotacionController from '../controllers/anotacion.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Catálogo y búsqueda -- públicos
router.get('/', recetaController.listar);
// /trending DEBE ir antes de /:id o Express lo trataría como id="trending"
router.get('/trending', recetaController.getTrending);
router.get('/:id', recetaController.obtenerPorId);

// Crear receta -- requiere auth
router.post('/', authMiddleware, recetaController.crear);

// Actualizar receta propia -- requiere auth + ownership (verificado en service)
router.put('/:id', authMiddleware, recetaController.actualizar);

// Eliminar (borrado lógico) receta propia -- requiere auth + ownership (verificado en service)
router.delete('/:id', authMiddleware, recetaController.eliminar);

// Anotaciones privadas sobre una receta -- requieren auth
router.post('/:recetaId/anotaciones/privadas', authMiddleware, anotacionController.crearPrivada);
router.get('/:recetaId/anotaciones/privadas', authMiddleware, anotacionController.listarPrivadasPorReceta);

// Anotaciones de estilo sobre una receta
router.post('/:recetaId/anotaciones/estilo', authMiddleware, anotacionController.crearEstilo);
router.get('/:recetaId/anotaciones/estilo', authMiddleware, anotacionController.listarEstiloPorReceta);
router.delete('/:recetaId/anotaciones/estilo/:id', authMiddleware, anotacionController.eliminarEstilo);

export default router;
