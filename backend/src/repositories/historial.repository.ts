/**
 * historial.repository.ts -- Repositorio del historial de cocina
 *
 * Único punto de acceso a la tabla "historial_cocina".
 * Sin unique constraint: el mismo usuario puede registrar la misma
 * receta múltiples veces en días distintos.
 */

import prisma from '../lib/prisma';

// Repositorio

const historialRepository = {

  /**
   * Crea una nueva entrada en el historial.
   * cocinado_el se rellena automáticamente con @default(now()) en el schema.
   */
  async create(usuario_id: number, receta_id: number) {
    return prisma.historialCocina.create({
      data: { usuario_id, receta_id },
      include: {
        receta: {
          select: {
            id: true,
            titulo: true,
            categoria_menu: true,
            estilo_culinario: true,
            dificultad: true,
            tiempo_preparacion: true,
            tags: true,
            eliminado_en: true,
          },
        },
      },
    });
  },

  /**
   * Devuelve todas las entradas del historial de un usuario,
   * ordenadas por fecha de cocinado descendente (más reciente primero).
   * Incluye los campos relevantes de la receta para el listado.
   */
  async findByUsuario(usuario_id: number) {
    return prisma.historialCocina.findMany({
      where: { usuario_id },
      orderBy: { cocinado_el: 'desc' },
      include: {
        receta: {
          select: {
            id: true,
            titulo: true,
            categoria_menu: true,
            estilo_culinario: true,
            dificultad: true,
            tiempo_preparacion: true,
            tags: true,
            eliminado_en: true,
          },
        },
      },
    });
  },
};

export default historialRepository;
