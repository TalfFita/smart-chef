/**
 * RecetaNoEncontradaError.ts -- Error de dominio compartido
 *
 * Se lanza cuando una receta referenciada por su ID no existe (o está
 * borrada lógicamente, en el caso del guard de idempotencia del DELETE).
 * Compartido por receta.service.ts, anotacion.service.ts,
 * favorito.service.ts e historial.service.ts -- los 4 controllers la
 * capturan con instanceof y responden 404 con error.message.
 *
 * El mensaje es parametrizable: receta.service.ts lo usa con el ID
 * (`Receta con id ${id} no encontrada`); el resto usa el mensaje
 * genérico `La receta no existe`.
 */
export class RecetaNoEncontradaError extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'RecetaNoEncontradaError';
  }
}
