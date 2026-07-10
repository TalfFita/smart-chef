/**
 * receta.service.ts -- Lógica de negocio de recetas
 *
 * No accede a Prisma directamente: usa recetaRepository.
 * No gestiona HTTP: eso lo hace receta.controller.ts.
 */

import recetaRepository, { RecetaCreateInput, RecetaUpdateInput } from '../repositories/receta.repository';
import { CategoriaMenu, EstiloCulinario, ModoPreparacion, Dificultad, TipoBloque } from '@prisma/client';
import { formatearTiempo } from '../utils/tiempo.utils';
import { RecetaNoEncontradaError } from '../errors/RecetaNoEncontradaError';

// Errores de dominio

export class RecetaNoAutorizadaError extends Error {
  constructor(id: number) {
    super(`No tienes permiso para editar la receta ${id}`);
    this.name = 'RecetaNoAutorizadaError';
  }
}

// Tipos

export interface BloqueInput {
  tipo_bloque: TipoBloque;
  orden: number;
  contenido: string;
  tiempo_estimado?: number | null;
}

export interface CrearRecetaInput {
  titulo: string;
  categoria_menu: CategoriaMenu;
  estilo_culinario: EstiloCulinario;
  modo_preparacion: ModoPreparacion;
  dificultad: Dificultad;
  tiempo_preparacion: number;
  ingredientes_texto: string;
  tags: string[];
  bloques: BloqueInput[];
}

// Servicio

const recetaService = {

  /**
   * Devuelve el catálogo completo de recetas formateado.
   * RF03.
   */
  async obtenerTodas() {
    const recetas = await recetaRepository.findAll();
    return recetas.map(formatearReceta);
  },

  /**
   * Devuelve el detalle de una receta por ID.
   * Lanza RecetaNoEncontradaError si no existe.
   * Si existe pero está eliminada (eliminado_en no nulo), devuelve un
   * payload mínimo en vez del detalle completo -- sin bloques ni contenido --
   * para que el frontend pueda mostrar el estado "eliminada" sin acceder
   * a su vista de detalle funcional.
   * RF03.
   */
  async obtenerPorId(id: number) {
    const receta = await recetaRepository.findById(id);
    if (!receta) throw new RecetaNoEncontradaError(`Receta con id ${id} no encontrada`);
    if (receta.eliminado_en) {
      return { id: receta.id, titulo: receta.titulo, eliminada: true };
    }
    return formatearReceta(receta);
  },

  /**
   * Devuelve las recetas más populares ordenadas por número de favoritos.
   * limit por defecto 10, configurable via query param.
   */
  async getTrending(limit: number) {
    const recetas = await recetaRepository.findTrending(limit);
    return recetas.map((r) => ({
      id: r.id,
      titulo: r.titulo,
      categoria_menu: r.categoria_menu,
      estilo_culinario: r.estilo_culinario,
      modo_preparacion: r.modo_preparacion,
      dificultad: r.dificultad,
      tiempo_preparacion: formatearTiempo(r.tiempo_preparacion),
      tags: r.tags,
      autor_id: r.autor_id,
      _count: r._count.favoritos,
    }));
  },

  /**
   * Crea una receta nueva con sus bloques.
   * autor_id viene del JWT verificado en el middleware.
   * RF09.
   */
  async crear(datos: CrearRecetaInput, autor_id: number) {
    const input: RecetaCreateInput = {
      ...datos,
      autor_id,
      bloques: datos.bloques.map((b) => ({
        tipo_bloque: b.tipo_bloque,
        orden: b.orden,
        contenido: b.contenido,
        tiempo_estimado: b.tiempo_estimado ?? null,
      })),
    };
    const receta = await recetaRepository.create(input);
    return formatearReceta(receta);
  },
  /**
   * Actualiza una receta existente.
   * Verifica ownership: solo el autor puede editar su receta.
   * RF09 (modo edición).
   */
  async actualizar(id: number, datos: CrearRecetaInput, autor_id: number) {
    const receta = await recetaRepository.findById(id);
    if (!receta) throw new RecetaNoEncontradaError(`Receta con id ${id} no encontrada`);
    if (receta.autor_id !== autor_id) throw new RecetaNoAutorizadaError(id);

    const input: RecetaUpdateInput = {
      ...datos,
      bloques: datos.bloques.map((b) => ({
        tipo_bloque:     b.tipo_bloque,
        orden:           b.orden,
        contenido:       b.contenido,
        tiempo_estimado: b.tiempo_estimado ?? null,
      })),
    };
    const actualizada = await recetaRepository.update(id, input);
    return formatearReceta(actualizada);
  },

  /**
   * Elimina (borrado lógico) una receta existente.
   * Verifica ownership: solo el autor puede eliminar su receta.
   * No borra la fila -- marca eliminado_en. Favoritos, anotaciones privadas
   * de terceros e historial sobre esta receta permanecen intactos.
   */
  async eliminar(id: number, autor_id: number) {
    const receta = await recetaRepository.findById(id);
    if (!receta) throw new RecetaNoEncontradaError(`Receta con id ${id} no encontrada`);
    // Guard de idempotencia: un 2º DELETE sobre una receta ya borrada
    // responde igual que si el ID no existiera.
    if (receta.eliminado_en) throw new RecetaNoEncontradaError(`Receta con id ${id} no encontrada`);
    if (receta.autor_id !== autor_id) throw new RecetaNoAutorizadaError(id);

    await recetaRepository.softDelete(id);
    return { mensaje: 'Receta eliminada correctamente', titulo: receta.titulo };
  },
};

// Utilidad interna

function formatearReceta(receta: Awaited<ReturnType<typeof recetaRepository.findById>>) {
  if (!receta) return null;
  return {
    id: receta.id,
    titulo: receta.titulo,
    categoria_menu: receta.categoria_menu,
    estilo_culinario: receta.estilo_culinario,
    modo_preparacion: receta.modo_preparacion,
    dificultad: receta.dificultad,
    // Devolvemos el número de minutos tal cual -- el frontend añade " min" en el template
    tiempo_preparacion: receta.tiempo_preparacion,
    ingredientes_texto: receta.ingredientes_texto,
    tags: receta.tags,
    autor_id: receta.autor_id,
    created_at: receta.created_at,
    bloques: receta.bloques.map((b) => ({
      id: b.id,
      // Renombramos tipo_bloque → tipo para que coincida con el tipo BloqueReceta del frontend
      tipo: b.tipo_bloque,
      orden: b.orden,
      contenido: b.contenido,
      // Devolvemos número o undefined -- el frontend añade " min"
      tiempo_estimado: b.tiempo_estimado ?? undefined,
      anotaciones_estilo: b.anotaciones_estilo.map((a) => ({
        id: a.id,
        bloque_id: a.bloque_id,
        palabra_clave: a.palabra_clave,
        explicacion: a.explicacion,
      })),
    })),
    anotaciones_estilo: receta.anotaciones_estilo.map((a) => ({
      id: a.id,
      bloque_id: a.bloque_id,
      palabra_clave: a.palabra_clave,
      explicacion: a.explicacion,
    })),
  };
}

export default recetaService;
