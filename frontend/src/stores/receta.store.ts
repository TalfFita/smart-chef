import { defineStore } from 'pinia'
import { ref } from 'vue'
import http from '@/api/http'
import type { Receta, Recetario, CrearRecetaPayload } from '@/types'

export const useRecetaStore = defineStore('receta', () => {
  // Estado
  const recetas = ref<Receta[]>([])
  const recetaActual = ref<Receta | null>(null)
  const recetario = ref<Recetario | null>(null)
  const cargando = ref(false)
  const error = ref<string | null>(null)

  async function cargarCatalogo(): Promise<void> {
    cargando.value = true
    error.value = null
    try {
      const { data } = await http.get<Receta[]>('/recetas')
      recetas.value = data
    } catch (e) {
      error.value = 'Error al cargar el catálogo'
      throw e
    } finally {
      cargando.value = false
    }
  }

  async function cargarDetalle(id: number): Promise<void> {
    cargando.value = true
    error.value = null
    try {
      const { data } = await http.get<Receta>(`/recetas/${id}`)
      recetaActual.value = data
    } catch (e) {
      error.value = 'Error al cargar el detalle de la receta'
      throw e
    } finally {
      cargando.value = false
    }
  }

  async function buscar(q: string): Promise<void> {
    cargando.value = true
    error.value = null
    try {
      const { data } = await http.get<Receta[]>('/recetas', { params: { q } })
      recetas.value = data
    } catch (e) {
      error.value = 'Error en la búsqueda'
      throw e
    } finally {
      cargando.value = false
    }
  }

  async function cargarRecetario(): Promise<void> {
    cargando.value = true
    error.value = null
    try {
      const { data } = await http.get<Recetario>('/usuarios/me/recetario')
      recetario.value = data
    } catch (e) {
      error.value = 'Error al cargar el recetario'
      throw e
    } finally {
      cargando.value = false
    }
  }

  async function crearReceta(datos: Partial<Receta>): Promise<Receta> {
    cargando.value = true
    error.value = null
    try {
      const { data } = await http.post<Receta>('/recetas', datos)
      recetas.value.push(data)
      return data
    } catch (e) {
      error.value = 'Error al crear la receta'
      throw e
    } finally {
      cargando.value = false
    }
  }

  async function crearRecetaCompleta(payload: CrearRecetaPayload): Promise<Receta> {
    cargando.value = true
    error.value = null
    try {
      const { data } = await http.post<Receta>('/recetas', payload)
      return data
    } catch (e) {
      error.value = 'Error al crear la receta'
      throw e
    } finally {
      cargando.value = false
    }
  }

  async function actualizarReceta(id: number, payload: CrearRecetaPayload): Promise<Receta> {
    cargando.value = true
    error.value = null
    try {
      const { data } = await http.put<Receta>(`/recetas/${id}`, payload)
      return data
    } catch (e) {
      error.value = 'Error al actualizar la receta'
      throw e
    } finally {
      cargando.value = false
    }
  }

  async function eliminar(id: number): Promise<void> {
    cargando.value = true
    error.value = null
    try {
      await http.delete(`/recetas/${id}`)
      recetas.value = recetas.value.filter(r => r.id !== id)
    } catch (e) {
      console.error('[receta.store] Error al eliminar:', e)
      error.value = 'Error al borrar la receta'
      throw e
    } finally {
      cargando.value = false
    }
  }

  return { recetas, recetaActual, recetario, cargando, error, cargarCatalogo, cargarDetalle, buscar, crearReceta, crearRecetaCompleta, actualizarReceta, eliminar, cargarRecetario }
})
