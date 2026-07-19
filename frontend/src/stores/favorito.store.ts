import { defineStore } from 'pinia'
import { ref } from 'vue'
import http from '@/api/http'
import type { Receta } from '@/types'

export const useFavoritoStore = defineStore('favorito', () => {
  // Estado
  const favoritos = ref<Receta[]>([])
  const cargando = ref(false)
  const error = ref<string | null>(null)

  async function cargarFavoritos(): Promise<void> {
    cargando.value = true
    error.value = null
    try {
      const { data } = await http.get<Receta[]>('/favoritos')
      favoritos.value = data
    } catch (e) {
      error.value = 'Error al cargar favoritos'
      throw e
    } finally {
      cargando.value = false
    }
  }

  async function añadir(recetaId: number): Promise<void> {
    error.value = null
    // Actualización optimista: el id basta para que esFavorito() devuelva true
    // antes de que responda el servidor, dando feedback visual inmediato.
    const placeholder = { id: recetaId } as unknown as Receta
    favoritos.value.push(placeholder)
    try {
      // La ruta del backend es POST /favoritos/:recetaId (no acepta body)
      const { data } = await http.post<Receta>(`/favoritos/${recetaId}`)
      // Reemplazar el placeholder con la receta completa devuelta por el servidor
      const idx = favoritos.value.findIndex(r => r.id === recetaId)
      if (idx !== -1) favoritos.value.splice(idx, 1, data)
    } catch (e) {
      // Revertir estado optimista si la petición falla
      favoritos.value = favoritos.value.filter(r => r.id !== recetaId)
      error.value = 'Error al añadir favorito'
      throw e
    }
  }

  async function eliminar(recetaId: number): Promise<void> {
    error.value = null
    // Actualización optimista: quitar de inmediato
    const prevFavoritos = [...favoritos.value]
    favoritos.value = favoritos.value.filter(r => r.id !== recetaId)
    try {
      await http.delete(`/favoritos/${recetaId}`)
    } catch (e) {
      // Revertir estado optimista si la petición falla
      favoritos.value = prevFavoritos
      error.value = 'Error al eliminar favorito'
      throw e
    }
  }

  // Comprobación local sin llamada al servidor
  function esFavorito(recetaId: number): boolean {
    return favoritos.value.some(r => r.id === recetaId)
  }

  return { favoritos, cargando, error, cargarFavoritos, añadir, eliminar, esFavorito }
})
