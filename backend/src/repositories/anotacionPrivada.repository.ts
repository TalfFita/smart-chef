/**
 * anotacionPrivada.repository.ts -- Repositorio de anotaciones privadas
 *
 * Único punto de acceso a la tabla "anotaciones_privadas".
 * Las anotaciones privadas son personales: solo las ve su propietario.
 * Todos los métodos reciben usuario_id para garantizar que un usuario
 * nunca accede a las anotaciones de otro.
 */

import prisma from '../lib/prisma';

// Tipos

export interface AnotacionPrivadaCreateInput {
  usuario_id: number;
  receta_id: number;
  contenido: string;
  color: string; // hex, ej: "#FFD700"
  posicion_bloque?: number | null;
}

export interface AnotacionPrivadaUpdateInput {
  contenido?: string;
  color?: string;
  posicion_bloque?: number | null;
}

// Repositorio

const anotacionPrivadaRepository = {

  /**
   * Crea una nueva anotación privada de un usuario sobre una receta.
   * Un usuario puede tener varias anotaciones sobre la misma receta.
   */
  async create(datos: AnotacionPrivadaCreateInput) {
    return prisma.anotacionPrivada.create({
      data: {
        usuario_id: datos.usuario_id,
        receta_id: datos.receta_id,
        contenido: datos.contenido,
        color: datos.color,
        posicion_bloque: datos.posicion_bloque ?? null,
      },
    });
  },

  /**
   * Devuelve todas las anotaciones privadas de un usuario sobre una receta concreta.
   * El filtro por usuario_id garantiza aislamiento entre usuarios.
   */
  async findByUsuarioYReceta(usuario_id: number, receta_id: number) {
    return prisma.anotacionPrivada.findMany({
      where: { usuario_id, receta_id },
      orderBy: { created_at: 'asc' },
    });
  },

  /**
   * Devuelve todas las anotaciones privadas de un usuario,
   * agrupadas con la información básica de cada receta.
   */
  async findByUsuario(usuario_id: number) {
    return prisma.anotacionPrivada.findMany({
      where: { usuario_id },
      orderBy: { updated_at: 'desc' },
      include: {
        receta: {
          select: {
            id: true,
            titulo: true,
            categoria_menu: true,
            estilo_culinario: true,
          },
        },
      },
    });
  },

  /**
   * Actualiza el contenido y/o color de una anotación privada.
   * El filtro por usuario_id evita que un usuario modifique
   * anotaciones ajenas aunque conozca el ID.
   * Usa updateMany para no lanzar error si no existe o no pertenece al usuario.
   */
  async update(id: number, usuario_id: number, datos: AnotacionPrivadaUpdateInput) {
    return prisma.anotacionPrivada.updateMany({
      where: { id, usuario_id },
      data: {
        ...(datos.contenido       !== undefined && { contenido:       datos.contenido }),
        ...(datos.color           !== undefined && { color:           datos.color }),
        ...(datos.posicion_bloque !== undefined && { posicion_bloque: datos.posicion_bloque }),
      },
    });
  },

  /**
   * Elimina una anotación privada.
   * El filtro por usuario_id garantiza que solo el propietario puede borrarla.
   */
  async delete(id: number, usuario_id: number) {
    return prisma.anotacionPrivada.deleteMany({
      where: { id, usuario_id },
    });
  },
};

export default anotacionPrivadaRepository;
