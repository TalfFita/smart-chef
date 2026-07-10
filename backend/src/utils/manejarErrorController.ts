/**
 * manejarErrorController.ts -- Manejo centralizado de errores en controllers
 *
 * Colapsa el cuerpo del catch de cada método de controller: mapea las
 * clases de error de dominio conocidas a su status HTTP y, para
 * cualquier otro caso, cae al fallback 500 con log en consola.
 * No sustituye el try/catch de cada método -- solo su cuerpo.
 */

import { Response } from 'express';
import { RecetaNoEncontradaError } from '../errors/RecetaNoEncontradaError';
import { RecetaNoAutorizadaError } from '../services/receta.service';
import { AnotacionNoEncontradaError, NoAutorizadoError } from '../services/anotacion.service';

export function manejarErrorController(error: unknown, res: Response, contexto: string): void {
  if (error instanceof RecetaNoEncontradaError) {
    res.status(404).json({ error: error.message });
    return;
  }
  if (error instanceof RecetaNoAutorizadaError) {
    res.status(403).json({ error: error.message });
    return;
  }
  if (error instanceof AnotacionNoEncontradaError) {
    res.status(404).json({ error: error.message });
    return;
  }
  if (error instanceof NoAutorizadoError) {
    res.status(403).json({ error: error.message });
    return;
  }
  console.error(`${contexto}:`, error);
  res.status(500).json({ error: 'Error interno del servidor' });
}
