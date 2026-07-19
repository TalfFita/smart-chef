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


/**
 * favorito.routes.ts -- en el mismo fichero para no multiplicar archivos triviales
 * GET    /favoritos           RF06 (auth)
 * POST   /favoritos/:recetaId RF06 (auth)
 * DELETE /favoritos/:recetaId RF06 (auth)
 */
// Nota: este fichero exporta solo recomendacionRouter.
// favoritoRoutes y anotacionRoutes se definen en sus propios ficheros.
