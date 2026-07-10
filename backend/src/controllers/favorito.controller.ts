/**
 * favorito.controller.ts -- Controlador de favoritos
 *
 * Endpoints (todos requieren auth):
 *   GET    /favoritos           -- listar favoritos del usuario (RF06)
 *   POST   /favoritos/:recetaId -- añadir a favoritos (RF06)
 *   DELETE /favoritos/:recetaId -- quitar de favoritos (RF06)
 */

import { Request, Response } from 'express';
import favoritoService, {
  YaEsFavoritoError,
  NoEsFavoritoError,
} from '../services/favorito.service';
import { RecetaNoEncontradaError } from '../errors/RecetaNoEncontradaError';

const favoritoController = {

  /**
   * GET /favoritos
   * Lista todas las recetas favoritas del usuario autenticado.
   */
  async listar(req: Request, res: Response): Promise<void> {
    try {
      const usuario_id = req.usuario!.sub;
      const favoritos = await favoritoService.listar(usuario_id);
      res.status(200).json(favoritos);
    } catch (error) {
      console.error('[favorito.controller] Error en listar:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * POST /favoritos/:recetaId
   * Añade una receta a favoritos del usuario autenticado.
   */
  async añadir(req: Request, res: Response): Promise<void> {
    const receta_id = parseInt(req.params['recetaId'] ?? '', 10);
    if (isNaN(receta_id)) {
      res.status(400).json({ error: 'ID de receta inválido' });
      return;
    }

    try {
      const usuario_id = req.usuario!.sub;
      const favorito = await favoritoService.añadir(usuario_id, receta_id);
      res.status(201).json(favorito);
    } catch (error) {
      if (error instanceof YaEsFavoritoError) {
        res.status(409).json({ error: error.message });
        return;
      }
      if (error instanceof RecetaNoEncontradaError) {
        res.status(404).json({ error: error.message });
        return;
      }
      console.error('[favorito.controller] Error en añadir:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * DELETE /favoritos/:recetaId
   * Quita una receta de favoritos del usuario autenticado.
   */
  async quitar(req: Request, res: Response): Promise<void> {
    const receta_id = parseInt(req.params['recetaId'] ?? '', 10);
    if (isNaN(receta_id)) {
      res.status(400).json({ error: 'ID de receta inválido' });
      return;
    }

    try {
      const usuario_id = req.usuario!.sub;
      await favoritoService.quitar(usuario_id, receta_id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof NoEsFavoritoError) {
        res.status(404).json({ error: error.message });
        return;
      }
      console.error('[favorito.controller] Error en quitar:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },
};

export default favoritoController;
