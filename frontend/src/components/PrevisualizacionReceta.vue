<template>
  <div class="previa-contenedor">

    <!-- Banner de previsualización -->
    <div class="previa-banner">
      <v-icon size="14" color="var(--color-primario)">mdi-eye-outline</v-icon>
      <span>Vista previa - así verán tu receta otros usuarios</span>
    </div>

    <!-- Cabecera e ingredientes -->
    <RecetaContenido
      :titulo="titulo"
      :tiempo-min="tiempoTotal"
      :estilo-culinario="estilo"
      :modo-preparacion="modoPreparacion"
      :categoria-menu="categoriaMenu"
      :dificultad="dificultad"
      :tags="tags"
      :ingredientes-texto="ingredientesTexto"
    />

    <!-- Bloques de elaboración -->
    <div class="bloques-lista">
      <div
        v-for="bloque in bloquesOrdenados"
        :key="bloque.orden"
        class="bloque"
      >
        <div class="bloque-cabecera">
          <span class="bloque-num" :style="{ background: infoTipo(bloque.tipo).acento }">
            {{ bloque.orden }}
          </span>
          <v-icon size="20" color="var(--color-texto-secundario)">
            {{ infoTipo(bloque.tipo).icono }}
          </v-icon>
          <span class="bloque-tipo-label">{{ bloque.tipo }}</span>
          <div class="flex-spacer" />
          <span v-if="bloque.tiempo_estimado" class="chip-tiempo">
            <v-icon size="12" color="var(--color-texto-secundario)">mdi-clock-outline</v-icon>
            {{ bloque.tiempo_estimado }} min
          </span>
        </div>
        <p class="bloque-contenido" :class="{ 'bloque-contenido--vacio': !bloque.contenido.trim() }">
          {{ bloque.contenido.trim() || 'Sin contenido' }}
        </p>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { BloqueEnConstruccion } from '@/types'
import RecetaContenido from '@/components/RecetaContenido.vue'

interface InfoTipoBloque { icono: string; acento: string }

const TIPOS_INFO: Record<string, InfoTipoBloque> = {
  PREPARAR: { icono: 'mdi-knife',                acento: '#E8F5E9' },
  ELABORAR: { icono: 'mdi-bowl-mix-outline',      acento: '#FFF8E1' },
  COCINAR:  { icono: 'mdi-pot-steam-outline',     acento: '#FFF3E0' },
  ESPERAR:  { icono: 'mdi-timer-sand',            acento: '#E3F2FD' },
  FIN:      { icono: 'mdi-silverware-fork-knife', acento: 'var(--color-primario-suave)' },
}
const FALLBACK: InfoTipoBloque = { icono: 'mdi-square-outline', acento: '#F5F5F5' }

function infoTipo(tipo: string): InfoTipoBloque {
  return TIPOS_INFO[tipo] ?? FALLBACK
}

const props = defineProps<{
  titulo:            string
  ingredientesTexto: string
  bloques:           BloqueEnConstruccion[]
  categoriaMenu:     string
  dificultad:        string
  estilo:            string
  modoPreparacion:   string
  tags:              string[]
  tiempoTotal:       number
}>()

const bloquesOrdenados = computed(() =>
  [...props.bloques].sort((a, b) => a.orden - b.orden)
)
</script>

<style scoped>
.previa-contenedor {
  padding: var(--espacio-md);
  display: flex;
  flex-direction: column;
  gap: var(--espacio-md);
}

/* Banner */
.previa-banner {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--color-primario-suave);
  border-radius: 10px;
  padding: 8px var(--espacio-md);
  font-size: var(--texto-xs);
  color: var(--color-primario);
  font-weight: 500;
}

/* Bloques */
.bloques-lista {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-md);
}

.bloque {
  background: var(--color-superficie);
  border: 1.5px solid var(--color-primario-suave);
  border-radius: 12px;
  padding: var(--espacio-md);
}

.bloque-cabecera {
  display: flex;
  align-items: center;
  gap: var(--espacio-sm);
}

.bloque-num {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--texto-xs);
  font-weight: 700;
  color: var(--color-texto-principal);
  flex-shrink: 0;
}

.bloque-tipo-label {
  font-size: var(--texto-xs);
  color: var(--color-texto-terciario);
  letter-spacing: 1px;
  text-transform: uppercase;
  font-weight: 600;
}

.flex-spacer { flex: 1; }

.bloque-contenido {
  margin-top: 10px;
  font-size: var(--texto-base);
  line-height: 1.7;
  color: var(--color-texto-principal);
  white-space: pre-wrap;
  margin-bottom: 0;
}

.bloque-contenido--vacio {
  color: var(--color-texto-terciario);
  font-style: italic;
  font-size: var(--texto-sm);
}
</style>
