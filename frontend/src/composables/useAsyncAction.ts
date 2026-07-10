import { mostrarToast } from '@/composables/useToast'

interface OpcionesEjecutar<T> {
  mensajeExito?: string | ((resultado: T) => string)
  mensajeError?: string | ((error: unknown) => string)
  onExito?: (resultado: T) => void
  onError?: (error: unknown) => void
}

// Ejecuta una acción async de una vista dando feedback por toast.
// A diferencia de runAsync (useAsyncState, para stores): no trackea
// cargando/error persistente y NO relanza el error -- lo captura y
// avisa por toast, igual que hacían estos try/catch a mano.
export function useAsyncAction() {
  async function ejecutar<T>(fn: () => Promise<T>, opciones: OpcionesEjecutar<T> = {}): Promise<void> {
    try {
      const resultado = await fn()
      const msg = typeof opciones.mensajeExito === 'function' ? opciones.mensajeExito(resultado) : opciones.mensajeExito
      if (msg) mostrarToast(msg, 'success')
      opciones.onExito?.(resultado)
    } catch (e) {
      opciones.onError?.(e)
      const msg = typeof opciones.mensajeError === 'function'
        ? opciones.mensajeError(e)
        : (opciones.mensajeError ?? 'Ha ocurrido un error. Inténtalo de nuevo.')
      mostrarToast(msg, 'error')
    }
  }

  return { ejecutar }
}
