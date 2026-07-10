import { defineStore } from 'pinia'
import { ref } from 'vue'
import http from '@/api/http'
import type { ResultadoRecomendacion } from '@/types'

// Criterios de búsqueda de recomendación
interface CriteriosRecomendacion {
  categoria?: string
  estilo?: string
  modo?: string
  tags_preferidos?: string[]
}

export const useRecomendacionStore = defineStore('recomendacion', () => {
  // Estado
  const criterios = ref<CriteriosRecomendacion>({})
  const resultado = ref<ResultadoRecomendacion | null>(null)
  const cargando = ref(false)
  const error = ref<string | null>(null)

  async function recomendar(params: CriteriosRecomendacion): Promise<void> {
    cargando.value = true
    error.value = null
    criterios.value = params
    try {
      // tags_preferidos se serializa como array en query string
      const { data } = await http.get<ResultadoRecomendacion>('/recomendacion', { params })
      resultado.value = data
    } catch (e) {
      error.value = 'Error al obtener recomendación'
      throw e
    } finally {
      cargando.value = false
    }
  }

  function limpiarResultado(): void {
    resultado.value = null
  }

  return { criterios, resultado, cargando, error, recomendar, limpiarResultado }
})
