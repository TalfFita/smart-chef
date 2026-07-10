/**
 * anotacion.service.ts -- Lógica de negocio de anotaciones
 *
 * Gestiona dos tipos de anotaciones:
 *
 * Anotaciones PRIVADAS (RF07):
 *   - Solo las ve su propietario
 *   - Tienen contenido libre y color hex
 *   - CRUD completo
 *
 * Anotaciones de ESTILO (RF10):
 *   - Públicas: las ve cualquier usuario en el detalle de la receta
 *   - Vinculadas a una palabra clave del texto
 *   - Solo el autor de la receta puede crearlas o borrarlas
 */

import anotacionPrivadaRepository from '../repositories/anotacionPrivada.repository';
import anotacionEstiloRepository from '../repositories/anotacionEstilo.repository';
import recetaRepository from '../repositories/receta.repository';
import { RecetaNoEncontradaError } from '../errors/RecetaNoEncontradaError';

// Errores de dominio

export class AnotacionNoEncontradaError extends Error {
  constructor() {
    super('Anotación no encontrada');
    this.name = 'AnotacionNoEncontradaError';
  }
}

export class NoAutorizadoError extends Error {
  constructor() {
    super('No autorizado para realizar esta acción');
    this.name = 'NoAutorizadoError';
  }
}

// Servicio

const anotacionService = {

  // Anotaciones privadas

  /**
   * Crea una anotación privada del usuario sobre una receta.
   * RF07.
   */
  async crearPrivada(
    usuario_id: number,
    receta_id: number,
    contenido: string,
    color: string,
    posicion_bloque?: number | null
  ) {
    const receta = await recetaRepository.findById(receta_id);
    if (!receta) throw new RecetaNoEncontradaError('La receta no existe');

    return anotacionPrivadaRepository.create({
      usuario_id, receta_id, contenido, color,
      posicion_bloque: posicion_bloque ?? null,
    });
  },

  /**
   * Lista las anotaciones privadas del usuario sobre una receta.
   * RF07.
   */
  async listarPrivadasPorReceta(usuario_id: number, receta_id: number) {
    return anotacionPrivadaRepository.findByUsuarioYReceta(usuario_id, receta_id);
  },

  /**
   * Lista todas las anotaciones privadas del usuario.
   * RF07.
   */
  async listarTodasPrivadas(usuario_id: number) {
    return anotacionPrivadaRepository.findByUsuario(usuario_id);
  },

  /**
   * Actualiza una anotación privada. Solo el propietario puede editarla.
   * RF07.
   */
  async actualizarPrivada(
    id: number,
    usuario_id: number,
    datos: { contenido?: string; color?: string; posicion_bloque?: number | null }
  ) {
    const resultado = await anotacionPrivadaRepository.update(id, usuario_id, datos);
    // updateMany devuelve { count }. Si count=0, no era del usuario o no existía.
    if (resultado.count === 0) throw new AnotacionNoEncontradaError();
    return resultado;
  },

  /**
   * Elimina una anotación privada. Solo el propietario puede borrarla.
   * RF07.
   */
  async eliminarPrivada(id: number, usuario_id: number) {
    const resultado = await anotacionPrivadaRepository.delete(id, usuario_id);
    if (resultado.count === 0) throw new AnotacionNoEncontradaError();
    return resultado;
  },

  // Anotaciones de estilo

  /**
   * Crea una anotación de estilo sobre una palabra clave.
   * Solo el autor de la receta puede crearla.
   * RF10.
   */
  async crearEstilo(
    usuario_id: number,
    receta_id: number,
    bloque_id: number | null,
    palabra_clave: string,
    explicacion: string
  ) {
    // Verificar que la receta existe y que el usuario es el autor
    const receta = await recetaRepository.findById(receta_id);
    if (!receta) throw new RecetaNoEncontradaError('La receta no existe');
    if (receta.autor_id !== usuario_id) throw new NoAutorizadoError();

    return anotacionEstiloRepository.create({
      receta_id,
      bloque_id,
      palabra_clave,
      explicacion,
    });
  },

  /**
   * Lista las anotaciones de estilo de una receta (públicas).
   * Cualquier usuario autenticado puede verlas.
   * RF10.
   */
  async listarEstiloPorReceta(receta_id: number) {
    return anotacionEstiloRepository.findByReceta(receta_id);
  },

  /**
   * Elimina una anotación de estilo.
   * Solo el autor de la receta puede borrarla.
   * RF10.
   */
  async eliminarEstilo(id: number, receta_id: number, usuario_id: number) {
    const receta = await recetaRepository.findById(receta_id);
    if (!receta) throw new RecetaNoEncontradaError('La receta no existe');
    if (receta.autor_id !== usuario_id) throw new NoAutorizadoError();

    return anotacionEstiloRepository.delete(id);
  },
};

export default anotacionService;
