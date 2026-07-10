// Tipos compartidos de Smart Chef

export interface Usuario {
  id: number
  nombre: string
  email: string
}

export interface BloqueReceta {
  id: number
  tipo: string
  contenido: string
  orden: number
  tiempo_estimado?: number
}

export interface AnotacionEstilo {
  id: number
  bloque_id: number | null
  palabra_clave: string
  // El campo en Prisma se llama "explicacion" -- el backend lo devuelve con ese nombre
  explicacion: string
}

export interface AnotacionPrivada {
  id: number
  receta_id: number
  contenido: string
  color: string
  posicion_bloque?: number
}

export interface Receta {
  id: number
  titulo: string
  categoria_menu: string
  estilo_culinario: string
  modo_preparacion: string
  dificultad: string
  tiempo_preparacion: number
  ingredientes_texto: string
  tags: string[]
  autor_id: number
  bloques?: BloqueReceta[]
  anotaciones_estilo?: AnotacionEstilo[]
  eliminado_en?: string | null
}

export interface EntradaHistorial {
  id: number
  receta_id: number
  cocinado_el: string
  receta: Pick<Receta, 'id' | 'titulo' | 'categoria_menu' | 'estilo_culinario' | 'dificultad' | 'tiempo_preparacion' | 'tags' | 'eliminado_en'>
}

export interface Recetario {
  misRecetas: Receta[]
  guardadas: Receta[]
  conNotas: Receta[]
}

export interface ResultadoRecomendacion {
  principal: Receta
  alternativas: Receta[]
  criterios_relajados: boolean
}

// Creación de recetas (RF09)

export type TipoBloque = 'PREPARAR' | 'ELABORAR' | 'COCINAR' | 'ESPERAR' | 'FIN'

/** Bloque en construcción (sin id de BD -- existe solo mientras se edita la receta) */
export interface BloqueEnConstruccion {
  tipo: TipoBloque
  orden: number
  contenido: string
  tiempo_estimado: number | null
}

/** Payload completo para POST /recetas */
export interface CrearRecetaPayload {
  titulo: string
  categoria_menu: string
  estilo_culinario: string
  modo_preparacion: string
  dificultad: string
  tiempo_preparacion: number
  ingredientes_texto: string
  tags: string[]
  bloques: {
    tipo_bloque: string
    orden: number
    contenido: string
    tiempo_estimado: number | null
  }[]
}
