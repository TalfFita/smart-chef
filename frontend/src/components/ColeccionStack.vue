<template>
  <section class="coleccion">

    <!-- -- Cabecera ----------------------------------------------------------- -->
    <div
      class="coleccion-cabecera"
      :class="{ 'coleccion-cabecera--clicable': recetas.length > 0 && !expandido }"
      @click="onClickColeccion"
    >
      <div class="cabecera-izquierda">
        <v-icon size="20" color="var(--color-primario)">{{ icono }}</v-icon>
        <span class="coleccion-contador">{{ recetas.length }}</span>
      </div>
      <h2 class="coleccion-titulo">{{ titulo }}</h2>
      <button
        v-if="expandido && recetas.length > 0"
        class="btn-colapsar"
        aria-label="Cerrar colección"
        @click.stop="contraer"
      >
        <v-icon size="18" color="var(--color-texto-terciario)">mdi-chevron-up</v-icon>
        <span class="btn-colapsar__label">Cerrar</span>
      </button>
    </div>

    <!-- -- Vacío --------------------------------------------------------------- -->
    <p v-if="recetas.length === 0" class="mensaje-vacio">{{ mensajeVacio }}</p>

    <!-- -- Pila colapsada ------------------------------------------------------ -->
    <!--
      La frente (más nueva) se sitúa abajo (position: relative → fija altura).
      Las traseras son position: absolute, cada una visible solo en su franja
      superior mediante overflow: hidden y height: PEEK_HEIGHT.
      El padding-top del contenedor reserva el espacio para esas franjas.
    -->
    <div
      v-if="!expandido && recetas.length > 0"
      class="pila"
      :style="{ paddingTop: pilaPaddingTop }"
      role="button"
      :aria-label="`Ver colección: ${recetas.length} recetas`"
      @click="onClickColeccion"
    >
      <div
        v-for="(receta, i) in recetasPilaInvertida"
        :key="receta.id"
        class="pila-item"
        :class="{ 'pila-item--frente': i === recetasPilaInvertida.length - 1 }"
        :style="estiloCapaPila(i, recetasPilaInvertida.length)"
      >
        <RecetaCard :receta="receta" :origen="origen" />
      </div>
    </div>

    <!-- -- Lista expandida ------------------------------------------------------ -->
    <div v-else-if="expandido" class="lista-expandida">
      <div
        v-for="(receta, i) in recetas"
        :key="receta.id"
        class="lista-item"
        :style="{ animationDelay: `${i * 80}ms` }"
      >
        <RecetaCard :receta="receta" :origen="origen" />
      </div>
    </div>

  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Receta } from '@/types'
import RecetaCard from '@/components/RecetaCard.vue'

interface Props {
  titulo:       string
  icono:        string
  recetas:      Receta[]
  mensajeVacio: string
  origen?:      string
}

const props = defineProps<Props>()
const router = useRouter()

const expandido = ref(false)

// Máximo de tarjetas en la pila: frente + hasta 2 tiras visibles por encima
const MAX_PILA  = 3
// Altura visible de cada tira trasera (suficiente para ver título + padding)
const PEEK_HEIGHT = 48  // px
// Reducción horizontal por nivel → efecto de perspectiva y profundidad
const INSET_X     = 5   // px

// Recetas que entran en la pila (máximo MAX_PILA)
const recetasPila = computed(() => props.recetas.slice(0, MAX_PILA))

// Renderizado de atrás a frente: i=0 es la más antigua (al fondo/arriba),
// i=N-1 es la más nueva (al frente/abajo, position: relative).
const recetasPilaInvertida = computed(() => [...recetasPila.value].reverse())

// Espacio en la parte superior del contenedor para las franjas que asoman
const pilaPaddingTop = computed(
  () => `${(recetasPila.value.length - 1) * PEEK_HEIGHT}px`
)

function expandir(): void {
  expandido.value = true
}

function contraer(): void {
  expandido.value = false
}

function onClickColeccion(): void {
  if (props.recetas.length === 0) return
  if (props.recetas.length === 1) {
    const receta = props.recetas[0]
    const path = `/recetas/${receta.id}`
    router.push(props.origen ? `${path}?from=${props.origen}` : path)
    return
  }
  if (!expandido.value) expandir()
}

/**
 * Calcula el estilo posicional de cada tarjeta en la pila.
 *
 * i = índice en recetasPilaInvertida (0 = más antigua/fondo, N-1 = frente).
 * posDesdeFrente = 0 → frente (abajo), N-1 → fondo (arriba del todo).
 *
 * Frente (posDesdeFrente === 0):
 *   - position: relative (lo da .pila-item--frente vía CSS)
 *   - Sin transform; fija la altura del contenedor.
 *
 * Tiras traseras (posDesdeFrente > 0):
 *   - position: absolute + overflow: hidden (lo da .pila-item vía CSS)
 *   - top calculado para que asomen exactamente PEEK_HEIGHT px por encima de la frente.
 *   - La más antigua (posDesdeFrente = N-1) aparece en top: 0 (arriba del todo).
 *   - Cada nivel se estrecha INSET_X px por lado y pierde un poco de opacidad.
 */
function estiloCapaPila(i: number, total: number): Record<string, string> {
  const posDesdeFrente = total - 1 - i

  if (posDesdeFrente === 0) {
    return { zIndex: String(i + 1) }
  }

  // top = (total - 1 - posDesdeFrente) * PEEK_HEIGHT
  //   posDesdeFrente=1 (1 detrás):  top = (N-2) * PEEK_HEIGHT
  //   posDesdeFrente=2 (2 detrás):  top = (N-3) * PEEK_HEIGHT → 0 para N=3
  const top = (total - 1 - posDesdeFrente) * PEEK_HEIGHT

  return {
    top:     `${top}px`,
    left:    `${posDesdeFrente * INSET_X}px`,
    right:   `${posDesdeFrente * INSET_X}px`,
    opacity: String(Math.max(0.45, 1 - posDesdeFrente * 0.22)),
    zIndex:  String(i + 1),
  }
}
</script>

<style scoped>
.coleccion {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-sm);
}

/* -- Cabecera ---------------------------------------------------------------- */
.coleccion-cabecera {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--espacio-sm);
  user-select: none;
  padding: var(--espacio-xs) 0;
}

.coleccion-cabecera--clicable { cursor: pointer; }

.cabecera-izquierda {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--espacio-sm);
  flex: 0 0 auto;
}

.coleccion-titulo {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  max-width: calc(100% - 200px);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
  font-size: var(--texto-md);
  font-weight: 700;
  color: var(--color-texto-principal);
  margin: 0;
}

.coleccion-contador {
  font-size: var(--texto-xs);
  font-weight: 700;
  color: var(--color-primario);
  background: var(--color-primario-suave);
  border-radius: 20px;
  padding: 2px 10px;
}

.btn-colapsar {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: 1.5px solid #E0E0E0;
  border-radius: 20px;
  padding: 4px 12px;
  cursor: pointer;
  transition: background 0.15s;
  flex-shrink: 0;
}
.btn-colapsar:hover { background: #F5F5F5; }

.btn-colapsar__label {
  font-size: var(--texto-xs);
  color: var(--color-texto-secundario);
  font-weight: 500;
}

/* -- Estado vacío ----------------------------------------------------------- */
.mensaje-vacio {
  font-size: var(--texto-sm);
  color: var(--color-texto-terciario);
  margin: 0;
  padding: var(--espacio-xs) 0 var(--espacio-sm);
  line-height: 1.5;
  text-align: center;
}

/* -- Pila colapsada --------------------------------------------------------- */
.pila {
  position: relative;
  cursor: pointer;
  filter: drop-shadow(0 4px 16px rgba(0, 0, 0, 0.10));
  transition: filter 0.15s ease;
}
.pila:active {
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.07));
}

/* Tiras traseras: absolutas, recortadas a su altura de peek */
.pila-item {
  position: absolute;
  left: 0;
  right: 0;
  height: 80px;       /* = PEEK_HEIGHT: solo se ve la franja del título */
  overflow: hidden;
  border-radius: 16px 16px 0 0;
}

/* Frente: en flujo normal, fija la altura del contenedor */
.pila-item--frente {
  position: relative;
  height: auto;
  overflow: visible;
  /* pointer-events: none desactiva la navegación de RecetaCard en modo pila */
}

/* Dentro de la pila, RecetaCard no navega -- el click lo gestiona .pila */
.pila :deep(.receta-card) {
  pointer-events: none;
}

/* -- Lista expandida -------------------------------------------------------- */
.lista-expandida {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-sm);
}

.lista-item {
  opacity: 0;
  animation: aparecer 300ms ease-out forwards;
}

@keyframes aparecer {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
