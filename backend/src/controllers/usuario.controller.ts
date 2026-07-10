/**
 * usuario.controller.ts -- Controlador de rutas del usuario autenticado.
 *
 * Endpoints:
 *   GET /usuarios/me/recetario -- colecciones del recetario personal (auth)
 */

import { Request, Response } from 'express';
import { obtenerRecetario } from '../services/recetario.service';

const usuarioController = {

  /**
   * GET /usuarios/me/recetario
   *
   * Devuelve las 3 colecciones del recetario personal del usuario autenticado:
   *   misRecetas -- recetas creadas por el usuario
   *   guardadas  -- recetas marcadas como favorito
   *   conNotas   -- recetas con al menos una anotación privada del usuario
   */
  async getRecetario(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = req.usuario!.sub;
      const recetario = await obtenerRecetario(usuarioId);
      res.status(200).json(recetario);
    } catch (error) {
      console.error('[usuario.controller] Error en getRecetario:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },
};

export default usuarioController;
