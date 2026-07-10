import { defineStore } from 'pinia'
import { ref } from 'vue'
import http from '@/api/http'
import type { Receta, Recetario, CrearRecetaPayload } from '@/types'
import { useAsyncState } from '@/composables/useAsyncState'

export const useRecetaStore = defineStore('receta', () => {
  // Estado
  const recetas = ref<Receta[]>([])
  const recetaActual = ref<Receta | null>(null)
  const recetario = ref<Recetario | null>(null)
  const { cargando, error, runAsync } = useAsyncState()

  async function cargarCatalogo(): Promise<void> {
    recetas.value = await runAsync(async () => {
      const { data } = await http.get<Receta[]>('/recetas')
      return data
    }, 'Error al cargar el catálogo')
  }

  async function cargarDetalle(id: number): Promise<void> {
    recetaActual.value = await runAsync(async () => {
      const { data } = await http.get<Receta>(`/recetas/${id}`)
      return data
    }, 'Error al cargar el detalle de la receta')
  }

  async function buscar(q: string): Promise<void> {
    recetas.value = await runAsync(async () => {
      const { data } = await http.get<Receta[]>('/recetas', { params: { q } })
      return data
    }, 'Error en la búsqueda')
  }

  async function cargarRecetario(): Promise<void> {
    recetario.value = await runAsync(async () => {
      const { data } = await http.get<Recetario>('/usuarios/me/recetario')
      return data
    }, 'Error al cargar el recetario')
  }

  async function crearRecetaCompleta(payload: CrearRecetaPayload): Promise<Receta> {
    return runAsync(async () => {
      const { data } = await http.post<Receta>('/recetas', payload)
      return data
    }, 'Error al crear la receta')
  }

  async function actualizarReceta(id: number, payload: CrearRecetaPayload): Promise<Receta> {
    return runAsync(async () => {
      const { data } = await http.put<Receta>(`/recetas/${id}`, payload)
      return data
    }, 'Error al actualizar la receta')
  }

  async function eliminar(id: number): Promise<void> {
    await runAsync(async () => {
      await http.delete(`/recetas/${id}`)
    }, 'Error al borrar la receta')
    recetas.value = recetas.value.filter(r => r.id !== id)
  }

  return { recetas, recetaActual, recetario, cargando, error, cargarCatalogo, cargarDetalle, buscar, crearRecetaCompleta, actualizarReceta, eliminar, cargarRecetario }
})
