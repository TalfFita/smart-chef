/**
 * historial.controller.ts -- Controlador del historial de cocina
 *
 * Endpoints (todos requieren auth):
 *   POST /historial  -- registrar receta cocinada
 *   GET  /historial  -- listar historial del usuario autenticado
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import historialService from '../services/historial.service';
import { RecetaNoEncontradaError } from '../errors/RecetaNoEncontradaError';

// Esquema de validación

const marcarCocinadaSchema = z.object({
  receta_id: z.number().int().positive('receta_id debe ser un entero positivo'),
});

// Controlador

const historialController = {

  /**
   * POST /historial
   *
   * Registra que el usuario autenticado ha cocinado una receta.
   * Body: { receta_id: number }
   * Responde con la entrada creada incluyendo datos de la receta.
   */
  async marcarCocinada(req: Request, res: Response): Promise<void> {
    const resultado = marcarCocinadaSchema.safeParse(req.body);
    if (!resultado.success) {
      res.status(400).json({ error: 'Datos inválidos', detalles: resultado.error.flatten().fieldErrors });
      return;
    }

    try {
      const usuario_id = req.usuario!.sub;
      const entrada = await historialService.marcarCocinada(usuario_id, resultado.data.receta_id);
      res.status(201).json(entrada);
    } catch (error) {
      if (error instanceof RecetaNoEncontradaError) {
        res.status(404).json({ error: error.message });
        return;
      }
      console.error('[historial.controller] Error en marcarCocinada:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * GET /historial
   *
   * Devuelve el historial de recetas cocinadas del usuario autenticado,
   * ordenado por fecha descendente, con datos básicos de cada receta.
   */
  async getHistorial(req: Request, res: Response): Promise<void> {
    try {
      const usuario_id = req.usuario!.sub;
      const historial = await historialService.getHistorial(usuario_id);
      res.status(200).json(historial);
    } catch (error) {
      console.error('[historial.controller] Error en getHistorial:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },
};

export default historialController;
