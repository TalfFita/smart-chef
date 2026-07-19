<template>
  <div
    class="bloque-card"
    :class="{
      'bloque-card--drag': estaArrastrando,
      'bloque-card--destino': esDestino,
    }"
    @pointerdown.stop="emit('iniciar-drag', $event)"
  >
    <!-- Indicador de posición de inserción (encima del bloque) -->
    <div v-if="esDestino" class="linea-insercion" />

    <!-- Cabecera -->
    <div class="bloque-cabecera">
      <span class="bloque-num" :style="{ background: infoTipo.acento }">
        {{ bloque.orden }}
      </span>
      <v-icon size="18" color="var(--color-texto-secundario)">{{ infoTipo.icono }}</v-icon>
      <span class="bloque-tipo-label">{{ bloque.tipo }}</span>
      <div class="flex-spacer" />
      <!-- Tag de tiempo (pill visual) -->
      <span v-if="bloque.tiempo_estimado" class="chip-tiempo">
        <v-icon size="12" color="var(--color-texto-secundario)">mdi-clock-outline</v-icon>
        {{ bloque.tiempo_estimado }} min
      </span>
      <!-- Handle de arrastre (solo bloques no fijos) -->
      <v-icon v-if="!esFijo" size="18" color="var(--color-texto-terciario)" class="drag-handle">
        mdi-drag-vertical
      </v-icon>
    </div>

    <!-- Contenido o placeholder -->
    <p
      class="bloque-contenido"
      :class="{ 'bloque-contenido--vacio': !bloque.contenido.trim() }"
    >
      {{ bloque.contenido.trim() || (esFijo ? 'Fin de la receta. ¡Buen provecho!' : 'Doble-tap para añadir el texto de este paso...') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { BloqueEnConstruccion } from '@/types'

interface InfoTipoBloque {
  icono: string
  acento: string
}

const TIPOS_INFO: Record<string, InfoTipoBloque> = {
  PREPARAR: { icono: 'mdi-knife',                acento: '#E8F5E9' },
  ELABORAR: { icono: 'mdi-bowl-mix-outline',      acento: '#FFF8E1' },
  COCINAR:  { icono: 'mdi-pot-steam-outline',     acento: '#FFF3E0' },
  ESPERAR:  { icono: 'mdi-timer-sand',            acento: '#E3F2FD' },
  FIN:      { icono: 'mdi-silverware-fork-knife', acento: 'var(--color-primario-suave)' },
}
const FALLBACK: InfoTipoBloque = { icono: 'mdi-square-outline', acento: '#F5F5F5' }

const props = defineProps<{
  bloque: BloqueEnConstruccion
  esFijo: boolean
  estaArrastrando: boolean
  esDestino: boolean
}>()

const emit = defineEmits<{
  (e: 'iniciar-drag', event: PointerEvent): void
}>()

const infoTipo = computed(() => TIPOS_INFO[props.bloque.tipo] ?? FALLBACK)
</script>

<style scoped>
.bloque-card {
  background: var(--color-superficie);
  border: 1.5px solid var(--color-primario-suave);
  border-radius: 12px;
  padding: var(--espacio-md);
  position: relative;
  transition: opacity 0.15s, box-shadow 0.15s;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  /* Sin esto, iOS Safari abre su selección/callout nativos al mantener
     pulsado, en vez de dejar que arranque el drag (ver useDragBloques). */
  -webkit-touch-callout: none;
}

.bloque-card--drag {
  opacity: 0.35;
}

.bloque-card--destino {
  border-color: var(--color-primario);
}

.linea-insercion {
  position: absolute;
  top: -5px;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--color-primario);
  border-radius: 2px;
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


.drag-handle {
  cursor: grab;
  padding: 2px;
}

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
