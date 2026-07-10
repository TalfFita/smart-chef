<template>
  <!-- Estado completado hoy: check verde estático -->
  <div v-if="completadoHoy" class="slider-completado">
    <v-icon size="22" color="var(--color-exito)">mdi-check-circle-outline</v-icon>
    <span class="slider-completado-texto">Cocinado hoy</span>
  </div>

  <!-- Estado pendiente: track + thumb arrastrable -->
  <div
    v-else
    ref="trackRef"
    class="slider-track"
    aria-label="Desliza para marcar como cocinado"
  >
    <!-- Texto de fondo que desaparece conforme avanza el thumb -->
    <span
      class="slider-hint"
      :style="{ opacity: Math.max(0, 1 - (thumbX / maxThumbX) * 2) }"
    >
      Desliza para marcar como cocinado
    </span>

    <!-- Thumb arrastrable -->
    <div
      class="slider-thumb"
      :class="{ 'slider-thumb--volviendo': volviendo }"
      :style="{ transform: `translateX(${thumbX}px)` }"
      @pointerdown.prevent="onPointerDown"
    >
      <v-icon size="20" color="white">mdi-silverware-fork-knife</v-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'

defineProps<{
  completadoHoy: boolean
}>()

const emit = defineEmits<{
  (e: 'confirmar'): void
}>()

// Estado interno del gesto
const trackRef  = ref<HTMLElement | null>(null)
const thumbX    = ref(0)
const volviendo = ref(false)   // activa la transición CSS de retorno al origen

// Posición X del puntero en el pointerdown (para calcular delta)
let startPointerX  = 0
let startThumbX    = 0
let arrastrando    = false

// Ancho del recorrido disponible (track - thumb)
const THUMB_SIZE = 48
const maxThumbX  = computed((): number => {
  return (trackRef.value?.clientWidth ?? 200) - THUMB_SIZE - 4
})

// Handlers del gesto de arrastre

function onPointerDown(e: PointerEvent): void {
  arrastrando    = true
  volviendo.value = false
  startPointerX  = e.clientX
  startThumbX    = thumbX.value
  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  document.addEventListener('pointermove', onPointerMove)
  document.addEventListener('pointerup',   onPointerUp)
}

function onPointerMove(e: PointerEvent): void {
  if (!arrastrando) return
  const delta = e.clientX - startPointerX
  // Limitar entre 0 y maxThumbX
  thumbX.value = Math.max(0, Math.min(startThumbX + delta, maxThumbX.value))
}

function onPointerUp(): void {
  if (!arrastrando) return
  arrastrando = false
  document.removeEventListener('pointermove', onPointerMove)
  document.removeEventListener('pointerup',   onPointerUp)

  // Si superó el 80% del recorrido → confirmar
  if (thumbX.value >= maxThumbX.value * 0.8) {
    thumbX.value = maxThumbX.value
    emit('confirmar')
  } else {
    // Volver al origen con transición CSS
    volviendo.value = true
    thumbX.value    = 0
    setTimeout(() => { volviendo.value = false }, 300)
  }
}

onUnmounted(() => {
  document.removeEventListener('pointermove', onPointerMove)
  document.removeEventListener('pointerup',   onPointerUp)
})
</script>

<style scoped>
/* -- Estado completado --------------------------------------------------------- */
.slider-completado {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--espacio-sm);
  height: 56px;
  border-radius: var(--tarjeta-radio);
  background: #E8F5E9;
  border: 1.5px solid #A5D6A7;
}

.slider-completado-texto {
  font-size: var(--texto-base);
  font-weight: 600;
  color: var(--color-exito);
}

/* -- Track (el carril) -------------------------------------------------------- */
.slider-track {
  position: relative;
  height: 56px;
  background: var(--color-primario-suave);
  border-radius: var(--tarjeta-radio);
  border: 1.5px solid #E8C9B8;
  display: flex;
  align-items: center;
  overflow: hidden;
  user-select: none;
  touch-action: none;
}

/* -- Texto de ayuda ----------------------------------------------------------- */
.slider-hint {
  position: absolute;
  left: 0;
  right: 0;
  text-align: center;
  padding-left: 56px; /* dejar espacio al thumb */
  font-size: var(--texto-sm);
  font-weight: 500;
  color: var(--color-texto-secundario);
  pointer-events: none;
  transition: opacity 80ms linear;
}

/* -- Thumb (el control deslizante) -------------------------------------------- */
.slider-thumb {
  position: absolute;
  left: 2px;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--color-primario);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  box-shadow: 0 2px 8px rgba(201, 106, 58, 0.4);
  touch-action: none;
  will-change: transform;
}

.slider-thumb:active {
  cursor: grabbing;
}

/* Transición suave al volver al origen */
.slider-thumb--volviendo {
  transition: transform 0.28s cubic-bezier(0.32, 0.72, 0, 1);
}
</style>
