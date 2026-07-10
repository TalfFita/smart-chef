import { ref } from 'vue'

export function useAsyncState() {
  const cargando = ref(false)
  const error = ref<string | null>(null)

  async function runAsync<T>(fn: () => Promise<T>, mensajeError: string): Promise<T> {
    cargando.value = true
    error.value = null
    try {
      return await fn()
    } catch (e) {
      error.value = mensajeError
      throw e
    } finally {
      cargando.value = false
    }
  }

  return { cargando, error, runAsync }
}
