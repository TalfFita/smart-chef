/**
 * recomendacion.service.ts -- Motor de recomendación
 *
 * Núcleo académico del TFG. Implementa un constraint-based recommender
 * system en dos fases según Felfernig et al. (2014).
 *
 * FASE 1 -- Filtrado por restricciones hard (secuencial):
 *   R1: categoria_menu   -- obligatorio, nunca se relaja
 *   R2: estilo_culinario -- se relaja si no hay resultados tras R3
 *   R3: modo_preparacion -- se relaja primero si no hay resultados
 *
 *   Estrategia de relajación progresiva:
 *     Intento 1: R1 + R2 + R3  → si vacío →
 *     Intento 2: R1 + R2       → si vacío →
 *     Intento 3: R1             → siempre devuelve algo (hay recetas de todas las categorías)
 *
 * FASE 2 -- Scoring ponderado en memoria:
 *   Sobre los candidatos supervivientes de Fase 1, cada tag de la receta
 *   que coincida con las preferencias del usuario suma su peso.
 *   La receta con mayor puntuación = recomendación principal.
 *   El resto = alternativas ordenadas de mayor a menor puntuación.
 *
 * La respuesta siempre incluye el campo "criterios_relajados" para
 * trazabilidad (RNF07).
 */

import recetaRepository from '../repositories/receta.repository';
import { CategoriaMenu, EstiloCulinario, ModoPreparacion } from '@prisma/client';
import { formatearTiempo } from '../utils/tiempo.utils';

// Pesos del scoring (Fase 2)
// Documentados como constantes explícitas para justificarlos en la defensa.
// Cada tag de la receta que coincida con un tag de preferencia del usuario
// suma el peso correspondiente. Si la receta tiene el tag varias veces
// (no debería por diseño) solo se cuenta una vez.

const PESO_TAG_COINCIDENTE = 10;

// Tipos

/**
 * Parámetros de entrada del motor, provenientes de los query params del endpoint.
 */
export interface ParametrosRecomendacion {
  categoria: CategoriaMenu;
  estilo?: EstiloCulinario;      // opcional -- si no llega, R2 no se aplica ni se relaja
  modo?: ModoPreparacion;        // opcional -- si no llega, R3 no se aplica ni se relaja
  tags_preferidos?: string[];    // opcional -- si no viene, Fase 2 puntúa todo a 0
}

/**
 * Receta con su puntuación calculada en Fase 2.
 * Se usa internamente para ordenar antes de construir la respuesta.
 */
interface RecetaPuntuada {
  receta: Awaited<ReturnType<typeof recetaRepository.findByCriteria>>[number];
  puntuacion: number;
}

/**
 * Respuesta completa del motor de recomendación.
 */
export interface RespuestaRecomendacion {
  principal: RecetaFormateada | null;
  alternativas: RecetaFormateada[];
  criterios_relajados: boolean;
}

/**
 * Receta con los campos para la respuesta JSON.
 * tiempo_preparacion se devuelve como número entero de minutos (igual que el
 * resto de endpoints); el template de RecetaCard añade " min" en el cliente.
 * tiempo_estimado de cada bloque sí se formatea a string legible.
 */
export interface RecetaFormateada {
  id: number;
  titulo: string;
  categoria_menu: string;
  estilo_culinario: string;
  modo_preparacion: string;
  dificultad: string;
  tiempo_preparacion: number;
  ingredientes_texto: string;
  tags: string[];
  puntuacion: number;
  bloques: BloqueFormateado[];
  anotaciones_estilo: AnotacionEstiloFormateada[];
}

export interface BloqueFormateado {
  id: number;
  tipo_bloque: string;
  orden: number;
  contenido: string;
  tiempo_estimado: string | null;  // formateado, null si no aplica
  anotaciones_estilo: AnotacionEstiloFormateada[];
}

export interface AnotacionEstiloFormateada {
  id: number;
  palabra_clave: string;
  explicacion: string;
}

// Utilidades

/**
 * Calcula la puntuación de una receta en Fase 2.
 * Cuenta cuántos tags de la receta están en las preferencias del usuario
 * y multiplica por el peso definido.
 */
function calcularPuntuacion(tags_receta: string[], tags_preferidos: string[]): number {
  if (tags_preferidos.length === 0) return 0;

  const preferidosSet = new Set(tags_preferidos.map((t) => t.toLowerCase()));
  const coincidencias = tags_receta.filter((t) => preferidosSet.has(t.toLowerCase())).length;

  return coincidencias * PESO_TAG_COINCIDENTE;
}

/**
 * Transforma una receta de Prisma al formato de respuesta,
 * aplicando el formateo de tiempos y la puntuación calculada.
 */
function formatearReceta(
  receta: Awaited<ReturnType<typeof recetaRepository.findByCriteria>>[number],
  puntuacion: number
): RecetaFormateada {
  return {
    id: receta.id,
    titulo: receta.titulo,
    categoria_menu: receta.categoria_menu,
    estilo_culinario: receta.estilo_culinario,
    modo_preparacion: receta.modo_preparacion,
    dificultad: receta.dificultad,
    tiempo_preparacion: receta.tiempo_preparacion,
    ingredientes_texto: receta.ingredientes_texto,
    tags: receta.tags,
    puntuacion,
    bloques: receta.bloques.map((b) => ({
      id: b.id,
      tipo_bloque: b.tipo_bloque,
      orden: b.orden,
      contenido: b.contenido,
      tiempo_estimado: b.tiempo_estimado !== null ? formatearTiempo(b.tiempo_estimado) : null,
      anotaciones_estilo: b.anotaciones_estilo.map((a) => ({
        id: a.id,
        palabra_clave: a.palabra_clave,
        explicacion: a.explicacion,
      })),
    })),
    anotaciones_estilo: receta.anotaciones_estilo.map((a) => ({
      id: a.id,
      palabra_clave: a.palabra_clave,
      explicacion: a.explicacion,
    })),
  };
}

// Motor principal

const recomendacionService = {

  /**
   * Ejecuta el motor de recomendación en dos fases.
   *
   * Fase 1: Filtrado secuencial con relajación progresiva.
   *   Siempre empieza con R1+R2+R3. Si no hay resultados, relaja R3.
   *   Si sigue vacío, relaja R2. R1 nunca se relaja.
   *
   * Fase 2: Scoring ponderado sobre los candidatos de Fase 1.
   *   Ordena por puntuación descendente. La primera es la recomendación
   *   principal; el resto son alternativas.
   *
   * Siempre devuelve una respuesta válida aunque no haya candidatos
   * (recomendacion_principal: null, alternativas: []).
   */
  async recomendar(params: ParametrosRecomendacion): Promise<RespuestaRecomendacion> {
    let hubo_relajacion = false;
    let candidatos: Awaited<ReturnType<typeof recetaRepository.findByCriteria>> = [];

    // Fase 1: filtrado con relajación progresiva
    // Se construyen los criterios solo con los parámetros que el usuario envió.
    // La relajación solo ocurre sobre restricciones que realmente estaban activas.

    // Intento 1: R1 + R2 (si llega) + R3 (si llega)
    candidatos = await recetaRepository.findByCriteria({
      categoria_menu: params.categoria,
      ...(params.estilo  && { estilo_culinario:  params.estilo }),
      ...(params.modo    && { modo_preparacion:  params.modo   }),
    });

    // Relajar R3 solo si estaba activo y no hay resultados
    if (candidatos.length === 0 && params.modo) {
      hubo_relajacion = true;
      candidatos = await recetaRepository.findByCriteria({
        categoria_menu: params.categoria,
        ...(params.estilo && { estilo_culinario: params.estilo }),
      });
    }

    // Relajar R2 solo si estaba activo y sigue sin haber resultados
    if (candidatos.length === 0 && params.estilo) {
      hubo_relajacion = true;
      candidatos = await recetaRepository.findByCriteria({
        categoria_menu: params.categoria,
      });
    }

    // Sin candidatos tras relajar todo -- no debería ocurrir con el seed
    if (candidatos.length === 0) {
      return {
        principal: null,
        alternativas: [],
        criterios_relajados: false,
      };
    }

    // Fase 2: scoring ponderado en memoria

    const tags_preferidos = params.tags_preferidos ?? [];

    const puntuadas: RecetaPuntuada[] = candidatos.map((receta) => ({
      receta,
      puntuacion: calcularPuntuacion(receta.tags, tags_preferidos),
    }));

    // Ordenar por puntuación descendente; empate → más reciente primero
    puntuadas.sort((a, b) => {
      if (b.puntuacion !== a.puntuacion) return b.puntuacion - a.puntuacion;
      return b.receta.created_at.getTime() - a.receta.created_at.getTime();
    });

    const [primera, ...resto] = puntuadas;

    return {
      principal: formatearReceta(primera.receta, primera.puntuacion),
      alternativas: resto.map((p) => formatearReceta(p.receta, p.puntuacion)),
      criterios_relajados: hubo_relajacion,
    };
  },

  /**
   * Búsqueda de recetas por texto libre con scoring ponderado (RF11).
   *
   * El repositorio devuelve los candidatos que contienen el término
   * en título, tags, ingredientes_texto o bloques. Este servicio los ordena
   * por relevancia aplicando pesos distintos según dónde aparece el término.
   *
   * Pesos:
   *   Coincidencia en título          → 40 puntos
   *   Coincidencia en tags            → 30 puntos
   *   Coincidencia en bloques         → 10 puntos
   *
   * ingredientes_texto no suma puntos de scoring -- es informativo.
   * Una receta puede acumular puntos de varias categorías.
   */
  async buscar(query: string): Promise<RecetaFormateada[]> {
    const termino = query.trim().toLowerCase();

    if (!termino) return [];

    const candidatos = await recetaRepository.findByQuery(termino);

    if (candidatos.length === 0) return [];

    // Calcular puntuación por relevancia para cada candidato
    const puntuadas = candidatos.map((receta) => {
      let puntuacion = 0;

      // Peso alto: coincidencia en título
      if (receta.titulo.toLowerCase().includes(termino)) {
        puntuacion += 40;
      }

      // Peso medio-alto: coincidencia en tags
      const enTags = receta.tags.some((t) => t.toLowerCase().includes(termino));
      if (enTags) puntuacion += 30;

      // Peso bajo: coincidencia en contenido de bloques
      const enBloques = receta.bloques.some((b) =>
        b.contenido.toLowerCase().includes(termino)
      );
      if (enBloques) puntuacion += 10;

      return { receta, puntuacion };
    });

    // Ordenar por puntuación descendente
    puntuadas.sort((a, b) => b.puntuacion - a.puntuacion);

    return puntuadas.map((p) => formatearReceta(p.receta, p.puntuacion));
  },
};

export default recomendacionService;