import { defineStore } from 'pinia'
import { ref } from 'vue'
import http from '@/api/http'
import type { EntradaHistorial } from '@/types'

export const useHistorialStore = defineStore('historial', () => {
  // Estado
  const entradas  = ref<EntradaHistorial[]>([])
  const isLoaded  = ref(false)
  const cargando  = ref(false)
  const error     = ref<string | null>(null)

  async function cargarHistorial(): Promise<void> {
    cargando.value = true
    error.value = null
    try {
      const { data } = await http.get<EntradaHistorial[]>('/historial')
      entradas.value = data
      isLoaded.value = true
    } catch (e) {
      error.value = 'Error al cargar el historial'
      throw e
    } finally {
      cargando.value = false
    }
  }

  async function marcarCocinada(recetaId: number): Promise<void> {
    cargando.value = true
    error.value = null
    try {
      const { data } = await http.post<EntradaHistorial>('/historial', { receta_id: recetaId })
      entradas.value.unshift(data)
    } catch (e) {
      error.value = 'Error al registrar en el historial'
      throw e
    } finally {
      cargando.value = false
    }
  }

  return { entradas, isLoaded, cargando, error, cargarHistorial, marcarCocinada }
})
