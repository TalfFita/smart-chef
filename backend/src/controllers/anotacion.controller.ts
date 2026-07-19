/**
 * anotacion.controller.ts -- Controlador de anotaciones
 *
 * Anotaciones PRIVADAS (todos los endpoints requieren auth):
 *   POST   /recetas/:recetaId/anotaciones/privadas         -- crear (RF07)
 *   GET    /recetas/:recetaId/anotaciones/privadas         -- listar las mías (RF07)
 *   GET    /anotaciones/privadas                           -- todas las mías (RF07)
 *   PATCH  /anotaciones/privadas/:id                       -- editar (RF07)
 *   DELETE /anotaciones/privadas/:id                       -- eliminar (RF07)
 *
 * Anotaciones de ESTILO (requieren auth):
 *   POST   /recetas/:recetaId/anotaciones/estilo           -- crear (RF10, solo autor)
 *   GET    /recetas/:recetaId/anotaciones/estilo           -- listar (RF10, público)
 *   DELETE /recetas/:recetaId/anotaciones/estilo/:id       -- eliminar (RF10, solo autor)
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import anotacionService, {
  AnotacionNoEncontradaError,
  NoAutorizadoError,
  RecetaNoExisteError,
} from '../services/anotacion.service';

// Esquemas de validación

const crearPrivadaSchema = z.object({
  contenido: z.string().min(1, 'El contenido es obligatorio').max(2000),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'El color debe ser un código hex válido (ej: #FFD700)'),
  posicion_bloque: z.number().int().positive().nullable().optional(),
});

const actualizarPrivadaSchema = z.object({
  contenido: z.string().min(1).max(2000).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'El color debe ser un código hex válido')
    .optional(),
  posicion_bloque: z.number().int().positive().nullable().optional(),
}).refine(
  (d) => d.contenido !== undefined || d.color !== undefined || d.posicion_bloque !== undefined,
  { message: 'Debe proporcionar al menos un campo a actualizar' }
);

const crearEstiloSchema = z.object({
  bloque_id: z.number().int().positive().nullable().optional(),
  palabra_clave: z.string().min(1, 'La palabra clave es obligatoria').max(100).trim(),
  explicacion: z
    .string()
    .min(10, 'La explicación debe tener al menos 10 caracteres')
    .max(1000)
    .trim(),
});

// Controlador

const anotacionController = {

  // Privadas

  async crearPrivada(req: Request, res: Response): Promise<void> {
    const receta_id = parseInt(req.params['recetaId'] ?? '', 10);
    if (isNaN(receta_id)) { res.status(400).json({ error: 'ID de receta inválido' }); return; }

    const resultado = crearPrivadaSchema.safeParse(req.body);
    if (!resultado.success) {
      res.status(400).json({ error: 'Datos inválidos', detalles: resultado.error.flatten().fieldErrors });
      return;
    }

    try {
      const usuario_id = req.usuario!.sub;
      const anotacion = await anotacionService.crearPrivada(
        usuario_id,
        receta_id,
        resultado.data.contenido,
        resultado.data.color,
        resultado.data.posicion_bloque
      );
      res.status(201).json(anotacion);
    } catch (error) {
      if (error instanceof RecetaNoExisteError) { res.status(404).json({ error: error.message }); return; }
      console.error('[anotacion.controller] Error en crearPrivada:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  async listarPrivadasPorReceta(req: Request, res: Response): Promise<void> {
    const receta_id = parseInt(req.params['recetaId'] ?? '', 10);
    if (isNaN(receta_id)) { res.status(400).json({ error: 'ID de receta inválido' }); return; }

    try {
      const usuario_id = req.usuario!.sub;
      const anotaciones = await anotacionService.listarPrivadasPorReceta(usuario_id, receta_id);
      res.status(200).json(anotaciones);
    } catch (error) {
      console.error('[anotacion.controller] Error en listarPrivadasPorReceta:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  async listarTodasPrivadas(req: Request, res: Response): Promise<void> {
    try {
      const usuario_id = req.usuario!.sub;
      const anotaciones = await anotacionService.listarTodasPrivadas(usuario_id);
      res.status(200).json(anotaciones);
    } catch (error) {
      console.error('[anotacion.controller] Error en listarTodasPrivadas:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  async actualizarPrivada(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params['id'] ?? '', 10);
    if (isNaN(id)) { res.status(400).json({ error: 'ID de anotación inválido' }); return; }

    const resultado = actualizarPrivadaSchema.safeParse(req.body);
    if (!resultado.success) {
      res.status(400).json({ error: 'Datos inválidos', detalles: resultado.error.flatten().fieldErrors });
      return;
    }

    try {
      const usuario_id = req.usuario!.sub;
      const { contenido, color, posicion_bloque } = resultado.data;
      const datos: { contenido?: string; color?: string; posicion_bloque?: number | null } = {};
      if (contenido      !== undefined) datos.contenido      = contenido;
      if (color          !== undefined) datos.color          = color;
      if (posicion_bloque !== undefined) datos.posicion_bloque = posicion_bloque;
      await anotacionService.actualizarPrivada(id, usuario_id, datos);
      res.status(200).json({ mensaje: 'Anotación actualizada' });
    } catch (error) {
      if (error instanceof AnotacionNoEncontradaError) { res.status(404).json({ error: error.message }); return; }
      console.error('[anotacion.controller] Error en actualizarPrivada:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  async eliminarPrivada(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params['id'] ?? '', 10);
    if (isNaN(id)) { res.status(400).json({ error: 'ID de anotación inválido' }); return; }

    try {
      const usuario_id = req.usuario!.sub;
      await anotacionService.eliminarPrivada(id, usuario_id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof AnotacionNoEncontradaError) { res.status(404).json({ error: error.message }); return; }
      console.error('[anotacion.controller] Error en eliminarPrivada:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // De estilo

  async crearEstilo(req: Request, res: Response): Promise<void> {
    const receta_id = parseInt(req.params['recetaId'] ?? '', 10);
    if (isNaN(receta_id)) { res.status(400).json({ error: 'ID de receta inválido' }); return; }

    const resultado = crearEstiloSchema.safeParse(req.body);
    if (!resultado.success) {
      res.status(400).json({ error: 'Datos inválidos', detalles: resultado.error.flatten().fieldErrors });
      return;
    }

    try {
      const usuario_id = req.usuario!.sub;
      const anotacion = await anotacionService.crearEstilo(
        usuario_id,
        receta_id,
        resultado.data.bloque_id ?? null,
        resultado.data.palabra_clave,
        resultado.data.explicacion
      );
      res.status(201).json(anotacion);
    } catch (error) {
      if (error instanceof RecetaNoExisteError) { res.status(404).json({ error: error.message }); return; }
      if (error instanceof NoAutorizadoError) { res.status(403).json({ error: error.message }); return; }
      console.error('[anotacion.controller] Error en crearEstilo:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  async listarEstiloPorReceta(req: Request, res: Response): Promise<void> {
    const receta_id = parseInt(req.params['recetaId'] ?? '', 10);
    if (isNaN(receta_id)) { res.status(400).json({ error: 'ID de receta inválido' }); return; }

    try {
      const anotaciones = await anotacionService.listarEstiloPorReceta(receta_id);
      res.status(200).json(anotaciones);
    } catch (error) {
      console.error('[anotacion.controller] Error en listarEstiloPorReceta:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  async eliminarEstilo(req: Request, res: Response): Promise<void> {
    const receta_id = parseInt(req.params['recetaId'] ?? '', 10);
    const id = parseInt(req.params['id'] ?? '', 10);
    if (isNaN(receta_id) || isNaN(id)) { res.status(400).json({ error: 'IDs inválidos' }); return; }

    try {
      const usuario_id = req.usuario!.sub;
      await anotacionService.eliminarEstilo(id, receta_id, usuario_id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof RecetaNoExisteError) { res.status(404).json({ error: error.message }); return; }
      if (error instanceof NoAutorizadoError) { res.status(403).json({ error: error.message }); return; }
      console.error('[anotacion.controller] Error en eliminarEstilo:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },
};

export default anotacionController;
