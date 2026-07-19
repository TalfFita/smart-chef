/**
 * bloque.repository.ts -- Repositorio de bloques de receta
 *
 * Único punto de acceso a la tabla "bloques_receta".
 * Los bloques son el contenido estructurado de cada receta.
 * En la creación inicial (RF09) los bloques se crean de forma anidada
 * desde receta.repository.ts. Este repositorio gestiona operaciones
 * posteriores: consulta, edición y reordenado.
 *
 * Métodos:
 *   create       -- añadir un bloque a una receta existente (RF09)
 *   findByReceta -- obtener bloques de una receta ordenados (RF03, RF09)
 *   update       -- editar contenido o tiempo de un bloque (RF09)
 *   delete       -- eliminar un bloque (RF09)
 *   reorder      -- actualizar el campo "orden" de múltiples bloques (RF09)
 */

import prisma from '../lib/prisma';
import { TipoBloque } from '@prisma/client';

// Tipos

export interface BloqueCreateInput {
  receta_id: number;
  tipo_bloque: TipoBloque;
  orden: number;
  contenido: string;
  tiempo_estimado?: number | null;
}

export interface BloqueUpdateInput {
  tipo_bloque?: TipoBloque;
  orden?: number;
  contenido?: string;
  tiempo_estimado?: number | null;
}

/**
 * Par id-orden para operaciones de reordenado.
 * El frontend envía el array de bloques con sus nuevos órdenes
 * tras una operación de drag & drop.
 */
export interface BloqueOrden {
  id: number;
  orden: number;
}

// Repositorio

const bloqueRepository = {

  /**
   * Crea un bloque nuevo en una receta existente.
   * Se usa cuando el usuario añade un bloque adicional tras la creación
   * inicial de la receta.
   */
  async create(datos: BloqueCreateInput) {
    return prisma.bloqueReceta.create({
      data: {
        receta_id: datos.receta_id,
        tipo_bloque: datos.tipo_bloque,
        orden: datos.orden,
        contenido: datos.contenido,
        tiempo_estimado: datos.tiempo_estimado ?? null,
      },
    });
  },

  /**
   * Devuelve todos los bloques de una receta ordenados por el campo "orden".
   * Incluye las anotaciones de estilo vinculadas a cada bloque.
   */
  async findByReceta(receta_id: number) {
    return prisma.bloqueReceta.findMany({
      where: { receta_id },
      orderBy: { orden: 'asc' },
      include: {
        anotaciones_estilo: true,
      },
    });
  },

  /**
   * Actualiza los campos de un bloque concreto.
   * Solo actualiza los campos que vengan definidos en el input.
   */
  async update(id: number, datos: BloqueUpdateInput) {
    return prisma.bloqueReceta.update({
      where: { id },
      data: {
        ...(datos.tipo_bloque !== undefined && { tipo_bloque: datos.tipo_bloque }),
        ...(datos.orden !== undefined && { orden: datos.orden }),
        ...(datos.contenido !== undefined && { contenido: datos.contenido }),
        ...(datos.tiempo_estimado !== undefined && { tiempo_estimado: datos.tiempo_estimado }),
      },
    });
  },

  /**
   * Elimina un bloque por su ID.
   * El onDelete: Cascade del schema garantiza que las anotaciones
   * de estilo vinculadas a este bloque se eliminan automáticamente.
   */
  async delete(id: number) {
    return prisma.bloqueReceta.delete({
      where: { id },
    });
  },

  /**
   * Actualiza el campo "orden" de múltiples bloques en una transacción.
   * Se llama después de un drag & drop en el frontend para persistir
   * el nuevo orden sin reordenar los datos en memoria.
   *
   * Usa prisma.$transaction para garantizar que todos los updates
   * se aplican o ninguno (atomicidad).
   */
  async reorder(bloques: BloqueOrden[]) {
    const operaciones = bloques.map((b) =>
      prisma.bloqueReceta.update({
        where: { id: b.id },
        data: { orden: b.orden },
      })
    );

    return prisma.$transaction(operaciones);
  },
};

export default bloqueRepository;
