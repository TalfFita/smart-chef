/**
 * receta.controller.ts -- Controlador de recetas
 *
 * Endpoints:
 *   GET  /recetas           -- catálogo completo (RF03)
 *   GET  /recetas?q=texto   -- búsqueda por relevancia (RF11)
 *   GET  /recetas/trending  -- recetas más guardadas como favorito
 *   GET  /recetas/:id       -- detalle de una receta (RF03)
 *   POST /recetas           -- crear receta con bloques (RF09, requiere auth)
 *   PUT  /recetas/:id       -- editar receta propia (RF09, requiere auth + ownership)
 *   DELETE /recetas/:id     -- eliminar (borrado lógico) receta propia (requiere auth + ownership)
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import recetaService, { RecetaNoEncontradaError, RecetaNoAutorizadaError } from '../services/receta.service';
import recomendacionService from '../services/recomendacion.service';
import { CategoriaMenu, EstiloCulinario, ModoPreparacion, Dificultad, TipoBloque } from '@prisma/client';

// Esquema de validación para crear receta

const bloqueSchema = z.object({
  tipo_bloque: z.nativeEnum(TipoBloque),
  orden: z.number().int().positive(),
  contenido: z.string().min(10, 'El contenido del bloque debe tener al menos 10 caracteres'),
  tiempo_estimado: z.number().int().positive().nullable().optional(),
});

const crearRecetaSchema = z.object({
  titulo: z.string().min(3, 'El título debe tener al menos 3 caracteres').max(200).trim(),
  categoria_menu: z.nativeEnum(CategoriaMenu),
  estilo_culinario: z.nativeEnum(EstiloCulinario),
  modo_preparacion: z.nativeEnum(ModoPreparacion),
  dificultad: z.nativeEnum(Dificultad),
  tiempo_preparacion: z.number().int().positive('El tiempo debe ser un número positivo de minutos'),
  ingredientes_texto: z.string().min(1, 'Los ingredientes no pueden estar vacíos').trim(),
  tags: z.array(z.string().min(1)).min(3, 'Debes añadir al menos 3 tags'),
  bloques: z.array(bloqueSchema).min(1, 'La receta debe tener al menos un bloque'),
});

// Controlador

const recetaController = {

  /**
   * GET /recetas
   * GET /recetas?q=texto
   *
   * Si viene el query param ?q=, ejecuta búsqueda por relevancia (RF11).
   * Si no, devuelve el catálogo completo (RF03).
   */
  async listar(req: Request, res: Response): Promise<void> {
    try {
      const q = req.query['q'];
      if (typeof q === 'string' && q.trim().length > 0) {
        // Búsqueda por relevancia (RF11)
        const resultados = await recomendacionService.buscar(q);
        res.status(200).json(resultados);
        return;
      }

      // Catálogo completo (RF03)
      const recetas = await recetaService.obtenerTodas();
      res.status(200).json(recetas);
    } catch (error) {
      console.error('[receta.controller] Error en listar:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * GET /recetas/trending
   * GET /recetas/trending?limit=N
   *
   * Devuelve las N recetas más guardadas como favorito (por defecto 10).
   * Público, sin autenticación.
   */
  async getTrending(req: Request, res: Response): Promise<void> {
    const limitParam = req.query['limit'];
    const limit = typeof limitParam === 'string' ? parseInt(limitParam, 10) : 10;

    if (isNaN(limit) || limit < 1) {
      res.status(400).json({ error: 'El parámetro limit debe ser un número positivo' });
      return;
    }

    try {
      const recetas = await recetaService.getTrending(limit);
      res.status(200).json(recetas);
    } catch (error) {
      console.error('[receta.controller] Error en getTrending:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * GET /recetas/:id
   *
   * Detalle completo de una receta con bloques y anotaciones. RF03.
   */
  async obtenerPorId(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params['id'] ?? '', 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'ID de receta inválido' });
      return;
    }

    try {
      const receta = await recetaService.obtenerPorId(id);
      res.status(200).json(receta);
    } catch (error) {
      if (error instanceof RecetaNoEncontradaError) {
        res.status(404).json({ error: error.message });
        return;
      }
      console.error('[receta.controller] Error en obtenerPorId:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * POST /recetas
   *
   * Crea una receta nueva con sus bloques. Requiere auth (JWT).
   * autor_id se extrae del token, no del body. RF09.
   */
  async crear(req: Request, res: Response): Promise<void> {
    const resultado = crearRecetaSchema.safeParse(req.body);
    if (!resultado.success) {
      res.status(400).json({
        error: 'Datos de receta inválidos',
        detalles: resultado.error.flatten().fieldErrors,
      });
      return;
    }

    try {
      const autor_id = req.usuario!.sub;
      const input = {
        ...resultado.data,
        bloques: resultado.data.bloques.map((b) => ({
          ...b,
          tiempo_estimado: b.tiempo_estimado ?? null,
        })),
      };
      const receta = await recetaService.crear(input, autor_id);
      res.status(201).json(receta);
    } catch (error) {
      console.error('[receta.controller] Error en crear:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },
  /**
   * PUT /recetas/:id
   *
   * Actualiza una receta existente reemplazando todos sus bloques.
   * Solo el autor puede editar su propia receta. RF09.
   */
  async actualizar(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params['id'] ?? '', 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'ID de receta inválido' });
      return;
    }

    const resultado = crearRecetaSchema.safeParse(req.body);
    if (!resultado.success) {
      res.status(400).json({
        error: 'Datos de receta inválidos',
        detalles: resultado.error.flatten().fieldErrors,
      });
      return;
    }

    try {
      const autor_id = req.usuario!.sub;
      const input = {
        ...resultado.data,
        bloques: resultado.data.bloques.map((b) => ({
          ...b,
          tiempo_estimado: b.tiempo_estimado ?? null,
        })),
      };
      const receta = await recetaService.actualizar(id, input, autor_id);
      res.status(200).json(receta);
    } catch (error) {
      if (error instanceof RecetaNoEncontradaError) {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error instanceof RecetaNoAutorizadaError) {
        res.status(403).json({ error: error.message });
        return;
      }
      console.error('[receta.controller] Error en actualizar:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * DELETE /recetas/:id
   *
   * Elimina (borrado lógico) una receta existente.
   * Solo el autor puede eliminar su propia receta.
   */
  async eliminar(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params['id'] ?? '', 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'ID de receta inválido' });
      return;
    }

    try {
      const autor_id = req.usuario!.sub;
      const resultado = await recetaService.eliminar(id, autor_id);
      res.status(200).json(resultado);
    } catch (error) {
      if (error instanceof RecetaNoEncontradaError) {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error instanceof RecetaNoAutorizadaError) {
        res.status(403).json({ error: error.message });
        return;
      }
      console.error('[receta.controller] Error en eliminar:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },
};

export default recetaController;
