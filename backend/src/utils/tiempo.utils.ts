/**
 * tiempo.utils.ts -- Formateo de tiempos en minutos
 *
 * Compartido por receta.service.ts y recomendacion.service.ts para
 * formatear tiempo_preparacion de recetas y tiempo_estimado de bloques.
 */

/**
 * Convierte minutos a string legible.
 * ≤ 90 min → "45 min"
 * > 90 min → "1h 30min", "2h 05min", etc.
 */
export function formatearTiempo(minutos: number): string {
  if (minutos <= 90) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  if (mins === 0) return `${horas}h`;
  return `${horas}h ${mins.toString().padStart(2, '0')}min`;
}
