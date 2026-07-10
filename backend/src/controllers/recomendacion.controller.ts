/**
 * recomendacion.controller.ts -- Controlador del motor de recomendación
 *
 * Endpoints:
 *   GET /recomendacion?categoria=&estilo=&modo=&tags_preferidos=  (RF04, RF05)
 *
 * Requiere autenticación: el usuario debe estar logueado para recibir
 * recomendaciones personalizadas.
 *
 * Query params:
 *   categoria       -- CategoriaMenu (obligatorio, R1 nunca se relaja)
 *   estilo          -- EstiloCulinario (opcional, R2 -- se relaja si no hay resultados)
 *   modo            -- ModoPreparacion (opcional, R3 -- se relaja primero)
 *   tags_preferidos -- array de strings para scoring Fase 2 (opcional)
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import recomendacionService from '../services/recomendacion.service';
import { CategoriaMenu, EstiloCulinario, ModoPreparacion } from '@prisma/client';

// Esquema de validación

const recomendacionQuerySchema = z.object({
  categoria: z.nativeEnum(CategoriaMenu, {
    errorMap: () => ({ message: `categoria debe ser uno de: ${Object.values(CategoriaMenu).join(', ')}` }),
  }),
  // estilo y modo son opcionales -- si no se envían, el motor arranca desde R1
  estilo: z.nativeEnum(EstiloCulinario, {
    errorMap: () => ({ message: `estilo debe ser uno de: ${Object.values(EstiloCulinario).join(', ')}` }),
  }).optional(),
  modo: z.nativeEnum(ModoPreparacion, {
    errorMap: () => ({ message: `modo debe ser uno de: ${Object.values(ModoPreparacion).join(', ')}` }),
  }).optional(),
  // tags_preferidos puede llegar como array repetido (?tags_preferidos=a&tags_preferidos=b)
  // o como string único -- Zod acepta ambas formas con preprocess
  tags_preferidos: z.preprocess(
    (val) => (Array.isArray(val) ? val : val ? [val] : []),
    z.array(z.string())
  ).optional(),
});

// Controlador

const recomendacionController = {

  /**
   * GET /recomendacion?categoria=PRINCIPAL&estilo=MEDITERRANEO&modo=TRADICIONAL&tags_preferidos=horno&tags_preferidos=arroz
   * RF04, RF05.
   */
  async recomendar(req: Request, res: Response): Promise<void> {
    const resultado = recomendacionQuerySchema.safeParse(req.query);
    if (!resultado.success) {
      res.status(400).json({
        error: 'Parámetros de recomendación inválidos',
        detalles: resultado.error.flatten().fieldErrors,
      });
      return;
    }

    const { categoria, estilo, modo, tags_preferidos } = resultado.data;

    try {
      const respuesta = await recomendacionService.recomendar({
        categoria,
        ...(estilo !== undefined && { estilo }),
        ...(modo   !== undefined && { modo }),
        tags_preferidos: tags_preferidos ?? [],
      });

      res.status(200).json(respuesta);
    } catch (error) {
      console.error('[recomendacion.controller] Error en recomendar:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },
};

export default recomendacionController;
