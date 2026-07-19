/**
 * favorito.repository.ts -- Repositorio de favoritos
 *
 * Único punto de acceso a la tabla "favoritos".
 * La constraint @@unique([usuario_id, receta_id]) en el schema
 * garantiza que no se dupliquen. Si se intenta añadir dos veces,
 * Prisma lanza un error P2002 que el servicio debe capturar.
 *
 * Métodos:
 *   add                      -- marcar receta como favorita (RF06)
 *   remove                   -- desmarcar receta como favorita (RF06)
 *   findByUsuario            -- listar favoritos del usuario (RF06)
 *   existsByUsuarioYReceta   -- comprobar si ya es favorita (RF06)
 */

import prisma from '../lib/prisma';

// Repositorio

const favoritoRepository = {

  /**
   * Marca una receta como favorita para un usuario.
   * Si la combinación ya existe, Prisma lanzará P2002 (unique constraint).
   * El servicio es responsable de manejar ese error.
   */
  async add(usuario_id: number, receta_id: number) {
    return prisma.favorito.create({
      data: { usuario_id, receta_id },
    });
  },

  /**
   * Elimina el favorito de un usuario para una receta concreta.
   * Usa deleteMany para evitar error si no existe (deleteMany no lanza
   * excepción cuando no encuentra registros, a diferencia de delete).
   */
  async remove(usuario_id: number, receta_id: number) {
    return prisma.favorito.deleteMany({
      where: { usuario_id, receta_id },
    });
  },

  /**
   * Devuelve todas las recetas marcadas como favoritas por un usuario,
   * con el detalle completo de cada receta (bloques y anotaciones incluidos).
   *
   * Excluye recetas borradas (eliminado_en != null). Prisma no permite un
   * `where` dentro de un `include` para una relación to-one (favorito.receta
   * es N:1), así que se filtra el resultado en memoria tras la consulta en
   * vez de intentar anidarlo en el include.
   */
  async findByUsuario(usuario_id: number) {
    const favoritos = await prisma.favorito.findMany({
      where: { usuario_id },
      orderBy: { created_at: 'desc' },
      include: {
        receta: {
          include: {
            bloques: {
              orderBy: { orden: 'asc' },
            },
            anotaciones_estilo: true,
          },
        },
      },
    });
    return favoritos.filter((f) => f.receta.eliminado_en === null);
  },

  /**
   * Comprueba si una receta ya está marcada como favorita por un usuario.
   * Devuelve true o false. Usado para no lanzar error de duplicado
   * sin necesidad de intentar el INSERT.
   */
  async existsByUsuarioYReceta(usuario_id: number, receta_id: number): Promise<boolean> {
    const favorito = await prisma.favorito.findFirst({
      where: { usuario_id, receta_id },
      select: { id: true },
    });
    return favorito !== null;
  },
};

export default favoritoRepository;
