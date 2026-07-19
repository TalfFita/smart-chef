/**
 * anotacionEstilo.repository.ts -- Repositorio de anotaciones de estilo
 *
 * Único punto de acceso a la tabla "anotaciones_estilo".
 * Las anotaciones de estilo son PÚBLICAS: cualquier usuario autenticado
 * puede leerlas. Solo el autor de la receta puede crearlas o borrarlas
 * (esa restricción la gestiona el servicio, no el repositorio).
 *
 * Una anotación puede estar vinculada a un bloque concreto (bloque_id)
 * o a la receta en general (bloque_id null).
 *
 * Métodos:
 *   create       -- crear anotación de estilo sobre palabra clave (RF10)
 *   findByReceta -- todas las anotaciones de una receta (RF03, RF10)
 *   findByBloque -- anotaciones vinculadas a un bloque concreto (RF10)
 *   delete       -- eliminar anotación (RF10)
 */

import prisma from '../lib/prisma';

// Tipos

export interface AnotacionEstiloCreateInput {
  receta_id: number;
  bloque_id?: number | null;
  palabra_clave: string;
  explicacion: string;
}

// Repositorio

const anotacionEstiloRepository = {

  /**
   * Crea una anotación de estilo sobre una palabra clave del texto.
   * bloque_id es opcional: null significa que la anotación es sobre
   * la receta en general, no sobre un bloque específico.
   */
  async create(datos: AnotacionEstiloCreateInput) {
    return prisma.anotacionEstilo.create({
      data: {
        receta_id: datos.receta_id,
        bloque_id: datos.bloque_id ?? null,
        palabra_clave: datos.palabra_clave,
        explicacion: datos.explicacion,
      },
    });
  },

  /**
   * Devuelve todas las anotaciones de estilo de una receta,
   * tanto las vinculadas a bloques como las de la receta en general.
   * Ordena por bloque_id para mostrar primero las generales (null primero).
   */
  async findByReceta(receta_id: number) {
    return prisma.anotacionEstilo.findMany({
      where: { receta_id },
      orderBy: [
        { bloque_id: 'asc' }, // null primero en PostgreSQL con nulls first
        { created_at: 'asc' },
      ],
    });
  },

  /**
   * Devuelve las anotaciones de estilo vinculadas a un bloque concreto.
   */
  async findByBloque(bloque_id: number) {
    return prisma.anotacionEstilo.findMany({
      where: { bloque_id },
      orderBy: { created_at: 'asc' },
    });
  },

  /**
   * Elimina una anotación de estilo por su ID.
   * La verificación de que el usuario que borra es el autor de la receta
   * se hace en el servicio, no aquí.
   */
  async delete(id: number) {
    return prisma.anotacionEstilo.delete({
      where: { id },
    });
  },
};

export default anotacionEstiloRepository;
