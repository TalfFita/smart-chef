import { defineStore } from 'pinia'
import { ref } from 'vue'
import http from '@/api/http'
import type { AnotacionPrivada, AnotacionEstilo } from '@/types'

export const useAnotacionStore = defineStore('anotacion', () => {
  // Estado
  const anotacionesPrivadas = ref<AnotacionPrivada[]>([])
  const anotacionesEstilo = ref<AnotacionEstilo[]>([])
  const cargando = ref(false)
  const error = ref<string | null>(null)

  async function cargarPrivadas(recetaId: number): Promise<void> {
    cargando.value = true
    error.value = null
    try {
      const { data } = await http.get<AnotacionPrivada[]>(`/recetas/${recetaId}/anotaciones/privadas`)
      anotacionesPrivadas.value = data
    } catch (e) {
      error.value = 'Error al cargar anotaciones privadas'
      throw e
    } finally {
      cargando.value = false
    }
  }

  async function crearPrivada(recetaId: number, datos: Partial<AnotacionPrivada>): Promise<void> {
    cargando.value = true
    error.value = null
    try {
      const { data } = await http.post<AnotacionPrivada>(`/recetas/${recetaId}/anotaciones/privadas`, datos)
      anotacionesPrivadas.value.push(data)
    } catch (e) {
      error.value = 'Error al crear anotación privada'
      throw e
    } finally {
      cargando.value = false
    }
  }

  async function actualizarPrivada(id: number, datos: Partial<AnotacionPrivada>): Promise<void> {
    cargando.value = true
    error.value = null
    try {
      const { data } = await http.patch<AnotacionPrivada>(`/anotaciones/privadas/${id}`, datos)
      const idx = anotacionesPrivadas.value.findIndex((a) => a.id === id)
      if (idx !== -1) anotacionesPrivadas.value[idx] = data
    } catch (e) {
      error.value = 'Error al actualizar anotación privada'
      throw e
    } finally {
      cargando.value = false
    }
  }

  async function eliminarPrivada(id: number): Promise<void> {
    cargando.value = true
    error.value = null
    try {
      await http.delete(`/anotaciones/privadas/${id}`)
      anotacionesPrivadas.value = anotacionesPrivadas.value.filter((a) => a.id !== id)
    } catch (e) {
      error.value = 'Error al eliminar anotación privada'
      throw e
    } finally {
      cargando.value = false
    }
  }

  async function cargarEstilo(recetaId: number): Promise<void> {
    cargando.value = true
    error.value = null
    try {
      const { data } = await http.get<AnotacionEstilo[]>(`/recetas/${recetaId}/anotaciones/estilo`)
      anotacionesEstilo.value = data
    } catch (e) {
      error.value = 'Error al cargar anotaciones de estilo'
      throw e
    } finally {
      cargando.value = false
    }
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
