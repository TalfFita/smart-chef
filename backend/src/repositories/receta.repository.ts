/**
 * receta.repository.ts -- Repositorio de recetas
 *
 * Único punto de acceso a la tabla "recetas" y sus relaciones.
 * No contiene lógica de negocio: solo operaciones de consulta y escritura.
 *
 * Métodos:
 *   findAll          -- catálogo completo (RF03)
 *   findById         -- detalle con bloques y anotaciones (RF03)
 *   findByCriteria   -- filtrado por restricciones para el motor (RF04, RF05)
 *   findByQuery      -- búsqueda por texto para el buscador (RF11)
 *   findTrending     -- recetas ordenadas por nº de favoritos
 *   create           -- crear receta con bloques anidados (RF09)
 *   softDelete       -- borrado lógico (eliminado_en = ahora)
 */

import prisma from '../lib/prisma';
import {
  CategoriaMenu,
  EstiloCulinario,
  ModoPreparacion,
  Prisma,
} from '@prisma/client';

// Tipos

/**
 * Criterios de filtrado para el motor de recomendación (Fase 1).
 * categoria_menu es obligatorio (R1). estilo y modo son opcionales
 * porque pueden relajarse progresivamente.
 */
export interface CriteriosRecomendacion {
  categoria_menu: CategoriaMenu;
  estilo_culinario?: EstiloCulinario;
  modo_preparacion?: ModoPreparacion;
}

/**
 * Datos necesarios para crear un bloque al crear una receta.
 */
export interface BloqueCreateInput {
  tipo_bloque: string;
  orden: number;
  contenido: string;
  tiempo_estimado?: number | null;
}

/**
 * Datos necesarios para crear una receta completa con sus bloques.
 */
export interface RecetaCreateInput {
  titulo: string;
  categoria_menu: CategoriaMenu;
  estilo_culinario: EstiloCulinario;
  modo_preparacion: ModoPreparacion;
  dificultad: string;
  tiempo_preparacion: number;
  ingredientes_texto: string;
  tags: string[];
  autor_id: number;
  bloques: BloqueCreateInput[];
}

/**
 * Datos para actualizar una receta existente (sin autor_id -- ya verificado).
 * Los bloques se reemplazan completamente (deleteMany + create).
 */
export interface RecetaUpdateInput {
  titulo: string;
  categoria_menu: CategoriaMenu;
  estilo_culinario: EstiloCulinario;
  modo_preparacion: ModoPreparacion;
  dificultad: string;
  tiempo_preparacion: number;
  ingredientes_texto: string;
  tags: string[];
  bloques: BloqueCreateInput[];
}

// Include estándar

/**
 * Include para el detalle completo de una receta:
 * bloques ordenados + anotaciones de estilo públicas.
 * Se reutiliza en findById y findByCriteria.
 */
const includeDetalle = {
  bloques: {
    orderBy: { orden: 'asc' as const },
    include: {
      anotaciones_estilo: true,
    },
  },
  anotaciones_estilo: {
    where: { bloque_id: null }, // solo las vinculadas a la receta en general
  },
} satisfies Prisma.RecetaInclude;

// Repositorio

const recetaRepository = {

  /**
   * Devuelve todas las recetas del catálogo con sus bloques y anotaciones.
   * Ordena por fecha de creación descendente (más reciente primero).
   * Usado por RF03.
   */
  async findAll() {
    return prisma.receta.findMany({
      where: { eliminado_en: null },
      orderBy: { created_at: 'desc' },
      include: includeDetalle,
    });
  },

  /**
   * Devuelve una receta por su ID con detalle completo.
   * Devuelve null si no existe.
   * Usado por RF03 (detalle) y RF09 (confirmación de creación).
   */
  async findById(id: number) {
    return prisma.receta.findUnique({
      where: { id },
      include: includeDetalle,
    });
  },

  /**
   * Filtra recetas según los criterios del motor de recomendación (Fase 1).
   *
   * R1 (categoria_menu) siempre está presente -- nunca se relaja.
   * R2 (estilo_culinario) y R3 (modo_preparacion) son opcionales:
   * el servicio los omite cuando aplica relajación progresiva.
   *
   * Devuelve las recetas con sus bloques para que el servicio pueda
   * calcular el scoring de Fase 2 sobre los candidatos supervivientes.
   *
   * Usado por RF04 y RF05.
   */
  async findByCriteria(criterios: CriteriosRecomendacion) {
    const where: Prisma.RecetaWhereInput = {
      eliminado_en: null,
      categoria_menu: criterios.categoria_menu,
    };

    if (criterios.estilo_culinario !== undefined) {
      where.estilo_culinario = criterios.estilo_culinario;
    }

    if (criterios.modo_preparacion !== undefined) {
      where.modo_preparacion = criterios.modo_preparacion;
    }

    return prisma.receta.findMany({
      where,
      include: includeDetalle,
    });
  },

  /**
   * Búsqueda de recetas por texto libre (RF11).
   *
   * Devuelve todas las recetas que contengan el término de búsqueda en
   * al menos uno de estos campos (insensible a mayúsculas via mode: 'insensitive'):
   *   - titulo
   *   - tags (array)
   *   - ingredientes_texto (texto libre)
   *   - contenido de cualquier bloque
   *
   * El scoring ponderado por relevancia (título > tags > bloques)
   * se calcula en memoria en recomendacion.service.ts, no aquí.
   * Este método devuelve los candidatos; el servicio los ordena.
   *
   * Usado por RF11.
   */
  async findByQuery(query: string) {
    const termino = query.trim().toLowerCase();

    return prisma.receta.findMany({
      where: {
        eliminado_en: null,
        OR: [
          {
            titulo: {
              contains: termino,
              mode: 'insensitive',
            },
          },
          {
            tags: {
              hasSome: [termino],
            },
          },
          {
            ingredientes_texto: {
              contains: termino,
              mode: 'insensitive',
            },
          },
          {
            bloques: {
              some: {
                contenido: {
                  contains: termino,
                  mode: 'insensitive',
                },
              },
            },
          },
        ],
      },
      include: includeDetalle,
    });
  },

  /**
   * Devuelve las recetas más guardadas como favorito.
   * Ordena por número de favoritos descendente y toma los primeros `limit`.
   * Incluye _count.favoritos para que el servicio lo exponga en la respuesta.
   */
  async findTrending(limit: number) {
    return prisma.receta.findMany({
      where: { eliminado_en: null },
      take: limit,
      orderBy: {
        favoritos: { _count: 'desc' },
      },
      include: {
        _count: { select: { favoritos: true } },
      },
    });
  },

  /**
   * Devuelve las recetas creadas por un usuario concreto (autor_id = usuarioId).
   * Ordena por fecha de creación descendente.
   * Usado por recetario.service para la colección "Mis recetas".
   */
  async findByAutor(usuarioId: number) {
    return prisma.receta.findMany({
      where: { autor_id: usuarioId, eliminado_en: null },
      orderBy: { created_at: 'desc' },
    });
  },

  /**
   * Actualiza una receta existente reemplazando sus bloques completos.
   * Elimina todos los BloqueReceta previos (cascade elimina sus anotaciones_estilo)
   * y crea los nuevos en una sola operación de Prisma.
   * Usado por RF09 (edición de receta propia).
   */
  async update(id: number, datos: RecetaUpdateInput) {
    return prisma.receta.update({
      where: { id },
      data: {
        titulo:              datos.titulo,
        categoria_menu:      datos.categoria_menu,
        estilo_culinario:    datos.estilo_culinario,
        modo_preparacion:    datos.modo_preparacion,
        dificultad:          datos.dificultad as any,
        tiempo_preparacion:  datos.tiempo_preparacion,
        ingredientes_texto:  datos.ingredientes_texto,
        tags:                datos.tags,
        bloques: {
          deleteMany: {},
          create: datos.bloques.map((b) => ({
            tipo_bloque:     b.tipo_bloque as any,
            orden:           b.orden,
            contenido:       b.contenido,
            tiempo_estimado: b.tiempo_estimado ?? null,
          })),
        },
      },
      include: includeDetalle,
    });
  },

  /**
   * Devuelve las recetas en las que el usuario tiene al menos una anotación
   * privada. Usa la relación inversa de Prisma (some) sin necesidad de JOIN
   * explícito. Ordena por fecha de creación descendente.
   * Usado por recetario.service para la colección "Con mis notas".
   */
  async findByUsuarioConNotas(usuarioId: number) {
    return prisma.receta.findMany({
      where: {
        eliminado_en: null,
        anotaciones_privadas: { some: { usuario_id: usuarioId } },
      },
      orderBy: { created_at: 'desc' },
    });
  },

  /**
   * Crea una receta nueva con sus bloques en una sola operación anidada.
   * autor_id viene del JWT: es el usuario autenticado que crea la receta.
   * Devuelve la receta creada con detalle completo.
   * Usado por RF09.
   */
  async create(datos: RecetaCreateInput) {
    return prisma.receta.create({
      data: {
        titulo: datos.titulo,
        categoria_menu: datos.categoria_menu,
        estilo_culinario: datos.estilo_culinario,
        modo_preparacion: datos.modo_preparacion,
        dificultad: datos.dificultad as any,
        tiempo_preparacion: datos.tiempo_preparacion,
        ingredientes_texto: datos.ingredientes_texto,
        tags: datos.tags,
        autor_id: datos.autor_id,
        bloques: {
          create: datos.bloques.map((b) => ({
            tipo_bloque: b.tipo_bloque as any,
            orden: b.orden,
            contenido: b.contenido,
            tiempo_estimado: b.tiempo_estimado ?? null,
          })),
        },
      },
      include: includeDetalle,
    });
  },

  /**
   * Borrado lógico: marca la receta como eliminada (eliminado_en = ahora)
   * en vez de borrarla de la base de datos. No afecta a los onDelete: Cascade
   * existentes -- bloques, anotaciones, favoritos e historial permanecen intactos.
   * Usado por DELETE /recetas/:id.
   */
  async softDelete(id: number) {
    return prisma.receta.update({
      where: { id },
      data: { eliminado_en: new Date() },
      select: { id: true, titulo: true },
    });
  },
};

export default recetaRepository;
