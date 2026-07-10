/**
 * favorito.repository.ts -- Repositorio de favoritos
 *
 * Único punto de acceso a la tabla "favoritos".
 * La constraint @@unique([usuario_id, receta_id]) en el schema
 * garantiza que no se dupliquen a nivel de base de datos. El servicio
 * evita el duplicado con una comprobación previa (existsByUsuarioYReceta)
 * antes de llamar a add -- no captura el error P2002 de Prisma.
 */

import prisma from '../lib/prisma';

// Repositorio

const favoritoRepository = {

  /**
   * Marca una receta como favorita para un usuario.
   * El servicio comprueba antes con existsByUsuarioYReceta que la
   * combinación no existe -- este método asume que ya se verificó.
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
