<template>
  <div class="bloque-heatmap tarjeta">
    <p class="bloque-titulo">
      <v-icon size="20" color="var(--color-primario)">mdi-calendar-check</v-icon>
      Tu actividad
    </p>

    <!-- Navegación de mes -->
    <div class="heatmap-nav">
      <button class="btn-mes" @click="mesAnterior" aria-label="Mes anterior">
        <v-icon size="18">mdi-chevron-left</v-icon>
      </button>
      <span class="nombre-mes">{{ nombreMes }}</span>
      <button class="btn-mes" @click="mesSiguiente" aria-label="Mes siguiente">
        <v-icon size="18">mdi-chevron-right</v-icon>
      </button>
    </div>

    <!-- Grid responsive -- el ancho de celda se calcula con ResizeObserver -->
    <div ref="heatmapRef" class="heatmap-contenedor">
      <div
        class="heatmap-grid"
        :style="{
          gridTemplateColumns: `repeat(7, ${celdaSize}px)`,
          gap: `${CELDA_GAP}px`,
        }"
      >
        <!-- Etiquetas L M X J V S D -->
        <span
          v-for="etiqueta in ETIQUETAS_SEMANA"
          :key="etiqueta"
          class="heatmap-etiqueta"
          :style="{ width: `${celdaSize}px`, height: `${celdaSize}px` }"
        >
          {{ etiqueta }}
        </span>

        <!-- Celdas del mes -->
        <div
          v-for="(celda, idx) in diasHeatmap"
          :key="idx"
          class="heatmap-celda"
          :style="{
            width: `${celdaSize}px`,
            height: `${celdaSize}px`,
            backgroundColor: colorDia(celda.fechaStr),
          }"
          :class="{
            'heatmap-celda--vacia':        celda.dia === null,
            'heatmap-celda--activa':       tieneActividad(celda.fechaStr),
            'heatmap-celda--seleccionada': celda.fechaStr === diaSeleccionado,
          }"
          :title="celda.fechaStr
            ? `${celda.dia} - ${entradasPorDia[celda.fechaStr]?.length ?? 0} recetas`
            : ''"
          @click="celda.fechaStr && tieneActividad(celda.fechaStr)
            ? seleccionarDia(celda.fechaStr)
            : undefined"
        />
      </div>
    </div>

    <!-- Leyenda de niveles de color -->
    <div class="heatmap-leyenda">
      <span class="leyenda-texto">Menos</span>
      <span class="leyenda-cuadro" style="background: var(--heatmap-vacio)" />
      <span class="leyenda-cuadro" style="background: var(--heatmap-nivel1)" />
      <span class="leyenda-cuadro" style="background: var(--heatmap-nivel2)" />
      <span class="leyenda-cuadro" style="background: var(--heatmap-nivel3)" />
      <span class="leyenda-texto">Más</span>
    </div>

    <!-- Recetas del día seleccionado -->
    <template v-if="diaSeleccionado && recetasDelDia.length > 0">
      <div class="heatmap-nav-dias">
        <button
          class="heatmap-nav-btn"
          :disabled="indiceDiaActual <= 0"
          @click="irDiaAnterior"
        >‹</button>
        <span class="heatmap-nav-label">{{ diaSeleccionado }}</span>
        <button
          class="heatmap-nav-btn"
          :disabled="indiceDiaActual >= diasConRecetas.length - 1"
          @click="irDiaSiguiente"
        >›</button>
      </div>
      <p class="subtitulo-dia">Cocinaste el {{ diaFormateado }}</p>
      <div class="lista-recetas">
        <RecetaCard
          v-for="receta in recetasDelDia"
          :key="receta.id"
          :receta="receta"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Receta, EntradaHistorial } from '@/types'
import { useAuthStore }      from '@/stores/auth.store'
import { useHistorialStore } from '@/stores/historial.store'
import RecetaCard from '@/components/RecetaCard.vue'

const authStore      = useAuthStore()
const historialStore = useHistorialStore()

const CELDA_GAP        = 3
const ETIQUETAS_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const

const heatmapRef = ref<HTMLElement | null>(null)
const celdaSize  = ref<number>(14)
let   resizeObserver: ResizeObserver | null = null

function calcularCeldaSize(): void {
  if (!heatmapRef.value) return
  const ancho = heatmapRef.value.clientWidth
  celdaSize.value = Math.floor((ancho - (7 - 1) * CELDA_GAP) / 7)
}

const mesHeatmap      = ref<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
const diaSeleccionado = ref<string | null>(null)

const nombreMes = computed(() =>
  mesHeatmap.value.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
)

interface CeldaHeatmap {
  dia:      number | null
  fechaStr: string | null
}

const diasHeatmap = computed((): CeldaHeatmap[] => {
  const año    = mesHeatmap.value.getFullYear()
  const mes    = mesHeatmap.value.getMonth()
  const total  = new Date(año, mes + 1, 0).getDate()
  const offset = (new Date(año, mes, 1).getDay() + 6) % 7

  const celdas: CeldaHeatmap[] = Array.from({ length: offset }, () => ({
    dia: null, fechaStr: null,
  }))

  for (let d = 1; d <= total; d++) {
    const mm = String(mes + 1).padStart(2, '0')
    const dd = String(d).padStart(2, '0')
    celdas.push({ dia: d, fechaStr: `${año}-${mm}-${dd}` })
  }

  return celdas
})

const entradasPorDia = computed((): Record<string, EntradaHistorial[]> => {
  const mapa: Record<string, EntradaHistorial[]> = {}
  historialStore.entradas.forEach(entrada => {
    const clave = entrada.cocinado_el.split('T')[0]
    if (!mapa[clave]) mapa[clave] = []
    mapa[clave].push(entrada)
  })
  return mapa
})

const recetasDelDia = computed((): Receta[] => {
  if (!diaSeleccionado.value) return []
  return (entradasPorDia.value[diaSeleccionado.value] ?? []).map(
    (e): Receta => ({
      ...e.receta,
      autor_id:          0,
      modo_preparacion:  '',
      ingredientes_texto: '',
    })
  )
})

const diaFormateado = computed((): string => {
  if (!diaSeleccionado.value) return ''
  const [año, mes, dia] = diaSeleccionado.value.split('-').map(Number)
  return new Date(año, mes - 1, dia).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'long',
  })
})

function tieneActividad(fechaStr: string | null): boolean {
  return fechaStr !== null && (entradasPorDia.value[fechaStr]?.length ?? 0) > 0
}

function colorDia(fechaStr: string | null): string {
  if (!fechaStr) return 'transparent'
  const n = entradasPorDia.value[fechaStr]?.length ?? 0
  if (n === 0) return 'var(--heatmap-vacio)'
  if (n === 1) return 'var(--heatmap-nivel1)'
  if (n === 2) return 'var(--heatmap-nivel2)'
  return 'var(--heatmap-nivel3)'
}

function mesAnterior(): void {
  const m = mesHeatmap.value
  mesHeatmap.value = new Date(m.getFullYear(), m.getMonth() - 1, 1)
  diaSeleccionado.value = null
}

function mesSiguiente(): void {
  const m = mesHeatmap.value
  mesHeatmap.value = new Date(m.getFullYear(), m.getMonth() + 1, 1)
  diaSeleccionado.value = null
}

function seleccionarDia(fechaStr: string): void {
  diaSeleccionado.value = diaSeleccionado.value === fechaStr ? null : fechaStr
}

const diasConRecetas = computed((): string[] => {
  const set = new Set<string>()
  historialStore.entradas.forEach(e => {
    set.add(new Date(e.cocinado_el).toISOString().split('T')[0])
  })
  return [...set].sort()
})

const indiceDiaActual = computed((): number =>
  diaSeleccionado.value
    ? diasConRecetas.value.indexOf(diaSeleccionado.value)
    : -1
)

function irDiaAnterior(): void {
  if (indiceDiaActual.value > 0)
    diaSeleccionado.value = diasConRecetas.value[indiceDiaActual.value - 1] ?? null
}

function irDiaSiguiente(): void {
  if (indiceDiaActual.value < diasConRecetas.value.length - 1)
    diaSeleccionado.value = diasConRecetas.value[indiceDiaActual.value + 1] ?? null
}

onMounted(() => {
  if (authStore.estaAutenticado) {
    historialStore.cargarHistorial()
  }

  resizeObserver = new ResizeObserver(calcularCeldaSize)
  if (heatmapRef.value) {
    resizeObserver.observe(heatmapRef.value)
    calcularCeldaSize()
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})
</script>

<style scoped>
.bloque-heatmap {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-md);
}

.bloque-titulo {
  display: flex;
  align-items: center;
  gap: var(--espacio-xs);
  font-size: var(--texto-base);
  font-weight: 600;
  color: var(--color-texto-principal);
  margin: 0;
}

.heatmap-nav {
  display: flex;
  justify-content:center;
  align-items: center;
  gap: var(--espacio-md);
}

.btn-mes {
  background: var(--color-superficie);
  border: 1.5px solid var(--color-borde-input);
  border-radius: var(--espacio-sm);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.nombre-mes {
  font-size: var(--texto-base);
  font-weight: 600;
  color: var(--color-texto-secundario);
  text-transform: capitalize;
}

.heatmap-contenedor {
  width: 100%;
}

.heatmap-grid {
  display: grid;
}

.heatmap-etiqueta {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--texto-xs);
  color: var(--color-texto-terciario);
  font-weight: 500;
}

.heatmap-celda {
  border-radius: 2px;
  transition: opacity 0.1s;
}

.heatmap-celda--vacia {
  background-color: transparent !important;
  pointer-events: none;
}

.heatmap-celda--activa {
  cursor: pointer;
}

.heatmap-celda--activa:hover {
  opacity: 0.75;
}

.heatmap-celda--seleccionada {
  outline: 2px solid var(--color-primario);
  outline-offset: 1px;
}

.heatmap-leyenda {
  display: flex;
  align-items: center;
  gap: var(--espacio-xs);
}

.leyenda-texto {
  font-size: var(--texto-xs);
  color: var(--color-texto-terciario);
}

.leyenda-cuadro {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  flex-shrink: 0;
}

.heatmap-nav-dias {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 0.5rem 0;
  margin-bottom: 0.5rem;
}

.heatmap-nav-btn {
  background: var(--color-superficie);
  border: 1px solid var(--color-borde, #EDE8E3);
  border-radius: 50%;
  width: 36px;
  height: 36px;
  font-size: 1.25rem;
  cursor: pointer;
  color: var(--color-primario);
  display: flex;
  align-items: center;
  justify-content: center;
}

.heatmap-nav-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

.heatmap-nav-label {
  font-size: var(--texto-sm);
  color: var(--color-texto-secundario);
  min-width: 120px;
  text-align: center;
}

.subtitulo-dia {
  font-size: var(--texto-sm);
  font-weight: 600;
  color: var(--color-texto-secundario);
  margin: 0;
  text-transform: capitalize;
}

.lista-recetas {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
