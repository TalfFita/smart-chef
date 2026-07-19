/**
 * historial.service.ts -- Lógica de negocio del historial de cocina
 *
 * Responsabilidades:
 *   - Registrar que un usuario ha cocinado una receta
 *   - Devolver el historial completo de un usuario
 *
 * No accede a Prisma directamente: usa historialRepository.
 * No gestiona HTTP: eso lo hace historial.controller.ts.
 */

import historialRepository from '../repositories/historial.repository';
import recetaRepository from '../repositories/receta.repository';

// Errores de dominio

export class RecetaNoExisteParaHistorialError extends Error {
  constructor() {
    super('La receta no existe');
    this.name = 'RecetaNoExisteParaHistorialError';
  }
}

// Servicio

const historialService = {

  /**
   * Registra que el usuario ha cocinado una receta.
   * Verifica que la receta exista antes de crear la entrada.
   */
  async marcarCocinada(usuario_id: number, receta_id: number) {
    const receta = await recetaRepository.findById(receta_id);
    if (!receta) throw new RecetaNoExisteParaHistorialError();

    return historialRepository.create(usuario_id, receta_id);
  },

  /**
   * Devuelve el historial de recetas cocinadas por el usuario,
   * ordenado por fecha descendente.
   */
  async getHistorial(usuario_id: number) {
    return historialRepository.findByUsuario(usuario_id);
  },
};

export default historialService;
