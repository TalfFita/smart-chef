import { defineStore } from 'pinia'
import { ref } from 'vue'
import http from '@/api/http'
import type { AnotacionPrivada, AnotacionEstilo } from '@/types'
import { useAsyncState } from '@/composables/useAsyncState'

export const useAnotacionStore = defineStore('anotacion', () => {
  // Estado
  const anotacionesPrivadas = ref<AnotacionPrivada[]>([])
  const anotacionesEstilo = ref<AnotacionEstilo[]>([])
  const { cargando, error, runAsync } = useAsyncState()

  async function cargarPrivadas(recetaId: number): Promise<void> {
    anotacionesPrivadas.value = await runAsync(async () => {
      const { data } = await http.get<AnotacionPrivada[]>(`/recetas/${recetaId}/anotaciones/privadas`)
      return data
    }, 'Error al cargar anotaciones privadas')
  }

  async function crearPrivada(recetaId: number, datos: Partial<AnotacionPrivada>): Promise<void> {
    const data = await runAsync(async () => {
      const { data } = await http.post<AnotacionPrivada>(`/recetas/${recetaId}/anotaciones/privadas`, datos)
      return data
    }, 'Error al crear anotación privada')
    anotacionesPrivadas.value.push(data)
  }

  async function actualizarPrivada(id: number, datos: Partial<AnotacionPrivada>): Promise<void> {
    const data = await runAsync(async () => {
      const { data } = await http.patch<AnotacionPrivada>(`/anotaciones/privadas/${id}`, datos)
      return data
    }, 'Error al actualizar anotación privada')
    const idx = anotacionesPrivadas.value.findIndex((a) => a.id === id)
    if (idx !== -1) anotacionesPrivadas.value[idx] = data
  }

  async function eliminarPrivada(id: number): Promise<void> {
    await runAsync(async () => {
      await http.delete(`/anotaciones/privadas/${id}`)
    }, 'Error al eliminar anotación privada')
    anotacionesPrivadas.value = anotacionesPrivadas.value.filter((a) => a.id !== id)
  }

  async function cargarEstilo(recetaId: number): Promise<void> {
    anotacionesEstilo.value = await runAsync(async () => {
      const { data } = await http.get<AnotacionEstilo[]>(`/recetas/${recetaId}/anotaciones/estilo`)
      return data
    }, 'Error al cargar anotaciones de estilo')
  }

  return {
    anotacionesPrivadas,
    anotacionesEstilo,
    cargando,
    error,
    cargarPrivadas,
    crearPrivada,
    actualizarPrivada,
    eliminarPrivada,
    cargarEstilo,
  }
})
