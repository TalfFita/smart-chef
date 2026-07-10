import type { AnotacionEstilo } from '@/types'

// Escapa caracteres HTML para evitar XSS en el contenido de los bloques
function escaparHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Convierte el texto de un bloque en HTML seguro,
 * envolviendo cada palabra clave de las anotaciones de estilo en un <span> interactivo.
 *
 * @param contenido   - Texto plano del bloque
 * @param anotaciones - Anotaciones de estilo cuyo bloque_id coincide con el bloque actual
 * @returns HTML escapado con los spans de palabras clave inyectados
 */
export function procesarContenidoBloque(
  contenido: string,
  anotaciones: AnotacionEstilo[]
): string {
  // Primero escapamos todo el contenido para prevenir XSS
  let html = escaparHtml(contenido)

  for (const anotacion of anotaciones) {
    // Escapamos la palabra clave para buscarla en el contenido ya escapado
    const keyEscapado = escaparHtml(anotacion.palabra_clave)
    // Escapamos caracteres especiales de regex
    const patron = keyEscapado.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(patron, 'gi')

    html = html.replace(
      regex,
      (match) =>
        `<span class="palabra-clave" data-id="${anotacion.id}">${match}</span>`
    )
  }

  return html
}
