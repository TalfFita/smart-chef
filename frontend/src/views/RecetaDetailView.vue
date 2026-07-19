<template>
  <div class="detalle-fondo">

    <!-- ESTADO: cargando - skeleton shimmer -->
    <div v-if="recetaStore.cargando" class="skeleton-wrapper">
      <div class="skeleton-header" />
      <div class="skeleton-zona">
        <div class="skeleton-titulo" />
        <div class="skeleton-meta" />
        <div class="skeleton-bloque" />
        <div class="skeleton-bloque" />
      </div>
    </div>

    <!-- ESTADO: error -->
    <div v-else-if="recetaStore.error && !receta" class="estado-centrado">
      <v-icon size="48" color="var(--color-error)">mdi-alert-circle-outline</v-icon>
      <p class="error-msg">No se pudo cargar la receta</p>
      <button class="boton-primario" @click="cargarDetalle">Reintentar</button>
    </div>

    <!-- CONTENIDO PRINCIPAL -->
    <template v-else-if="receta">

      <!-- Banner fijo: modo "colocando nota" -- instrucción de drag -->
      <Transition name="banner">
        <div v-if="modoColocandoNota" class="banner-colocando">
          <v-icon size="20" color="white">mdi-gesture-swipe</v-icon>
          <span class="banner-texto">Pulsa y arrastra sobre el paso donde fijar la nota</span>
          <button class="banner-cerrar" @click="cancelarColocacion" aria-label="Cancelar">
            <v-icon size="20" color="white">mdi-close</v-icon>
          </button>
        </div>
      </Transition>

      <!-- SECCIÓN 1 - Header Bar sticky -->
      <header class="header-bar">
        <button class="btn-nav" @click="volver()" aria-label="Volver">
          <v-icon size="20" color="var(--color-texto-principal)">mdi-arrow-left</v-icon>
        </button>

        <!-- Acciones derechas: corazón + edición (solo autor) -->
        <div class="header-acciones">
          <!-- Botón de favorito: siempre visible para usuarios autenticados -->
          <button
            v-if="authStore.estaAutenticado"
            class="btn-nav"
            :class="{ 'btn-favorito--animando': animandoFavorito }"
            :aria-label="esFavorito ? 'Quitar de favoritos' : 'Guardar en favoritos'"
            @click="ejecutarToggleFavorito"
          >
            <v-icon
              size="22"
              :style="{ color: esFavorito ? 'var(--color-error)' : 'var(--color-texto-secundario)' }"
            >
              {{ esFavorito ? 'mdi-heart' : 'mdi-heart-outline' }}
            </v-icon>
          </button>

          <!-- Botón de edición: solo al autor Y solo si llega desde RecetarioView -->
          <button
            v-if="authStore.estaAutenticado && receta.autor_id === authStore.usuario?.id && route.query['from'] === 'recetario'"
            class="btn-nav"
            aria-label="Modificar receta"
            @click="ejecutarModificar"
          >
            <v-icon size="20" color="var(--color-texto-secundario)">mdi-brush-outline</v-icon>
          </button>

          <!-- Botón de borrado: solo al autor -->
          <button
            v-if="receta.autor_id === authStore.usuario?.id"
            class="btn-nav"
            aria-label="Borrar receta"
            @click="mostrandoConfirmBorrado = true"
          >
            <v-icon size="20" color="var(--color-texto-secundario)">mdi-trash-can-outline</v-icon>
          </button>
        </div>
      </header>

      <!-- SECCIÓN 2 + 2b - Header visual compartido (título, meta-row, etiquetas, ingredientes) -->
      <RecetaContenido
        :titulo="receta.titulo"
        :tiempo-min="receta.tiempo_preparacion"
        :estilo-culinario="receta.estilo_culinario"
        :modo-preparacion="receta.modo_preparacion"
        :categoria-menu="receta.categoria_menu"
        :dificultad="receta.dificultad"
        :tags="receta.tags"
        :ingredientes-texto="receta.ingredientes_texto ?? ''"
      />

      <!-- SECCIÓN 3 - Bloques de elaboración -->

      <!-- Sin bloques -->
      <p v-if="bloquesOrdenados.length === 0" class="estado-vacio">
        Esta receta no tiene pasos definidos aún
      </p>

      <!-- Lista de bloques -->
      <div v-else class="bloques-lista">
        <div
          v-for="bloque in bloquesOrdenados"
          :key="bloque.id"
          class="bloque"
          :class="{ 'bloque--drop-activo': bloqueDropActivoOrden === bloque.orden && arrastrando }"
          :data-bloque-orden="bloque.orden"
          @dblclick.stop="onBloqueDblClick(bloque.orden)"
          @touchend="onBloqueTouchEnd($event, bloque.orden)"
        >
          <!-- Cabecera del bloque -->
          <div class="bloque-cabecera">
            <span
              class="bloque-num"
              :style="{ background: infoTipo(bloque.tipo).acento }"
            >{{ bloque.orden }}</span>
            <v-icon size="20" color="var(--color-texto-secundario)">
              {{ infoTipo(bloque.tipo).icono }}
            </v-icon>
            <span class="bloque-tipo-label">{{ bloque.tipo }}</span>
            <span v-if="bloque.tiempo_estimado" class="chip-tiempo">
              <v-icon size="12" color="var(--color-texto-secundario)">mdi-clock-outline</v-icon>
              {{ bloque.tiempo_estimado }} min
            </span>
          </div>

          <!-- Contenido del bloque con palabras clave interactivas -->
          <div
            class="bloque-contenido"
            v-html="procesarContenidoBloque(bloque.contenido, anotacionesPorBloque(bloque.id))"
            @click.stop="manejarClickPalabraClave"
          />

          <!-- Post-its del bloque: círculos con long-press para reposicionar -->
          <TransitionGroup name="postit" tag="div" class="bloque-notas">
            <span
              v-for="nota in notasDeBloque(bloque.orden)"
              :key="nota.id"
              class="postit-circulo"
              :class="{ 'postit-circulo--arrastrando': anotacionReposicionandoId === nota.id }"
              :style="{
                background: nota.color,
                border: `1.5px solid ${colorBorde(nota.color)}`,
              }"
              @pointerdown.stop="onPointerDownPostit($event, nota.id)"
              @pointerup.stop="onPointerUpPostit($event, nota.id)"
              @pointercancel.stop="onPointerCancelPostit"
            />
          </TransitionGroup>

        </div>
      </div>

      <!-- Slider "ya lo he cocinado" (RF12) -->
      <div v-if="authStore.estaAutenticado" class="slider-zona">
        <SliderConfirmar
          :completado-hoy="cocinadoHoy"
          @confirmar="onSliderConfirmar"
        />
      </div>

      <!-- Botón de ayuda: debajo del slider, antes del footer. No solapa el track de arrastre -->
      <button
        class="btn-ayuda"
        aria-label="Ayuda sobre los gestos de esta vista"
        @click="infoGestosAbierto = true"
      >
        <v-icon size="16" color="var(--color-texto-terciario)">mdi-help-circle-outline</v-icon>
        <span class="btn-ayuda-texto">Cómo usar esta vista</span>
      </button>

      <!-- Espacio final para no quedar tapado por el footer -->
      <div class="espacio-final" />

    </template>

    <!-- FANTASMA del post-it durante el arrastre (position: fixed, flota sobre todo) -->
    <div
      v-show="arrastrando"
      class="postit-fantasma"
      :style="{
        left: fantasmaX + 'px',
        top: fantasmaY + 'px',
        background: colorFantasma,
        border: `2px solid ${colorBorde(colorFantasma)}`,
      }"
    />

    <!-- PANEL DE NOTA (bottom sheet) - creación o edición según anotacionEditandoId -->
    <Transition name="slide-up">
      <div
        v-if="panelNotaAbierto"
        class="panel-overlay"
        @click.self="cerrarPanel"
      >
        <div class="panel-nota">
          <div class="panel-handle" />
          <p class="panel-titulo">{{ panelTitulo }}</p>
          <p class="panel-subtitulo">{{ panelSubtitulo }}</p>

          <!-- Selector de 7 colores -->
          <div class="selector-colores">
            <button
              v-for="c in COLORES_NOTA"
              :key="c"
              class="color-circulo"
              :style="{ background: c }"
              :class="{ 'color-circulo--activo': colorNota === c }"
              :aria-label="`Color ${c}`"
              @click="colorNota = c"
            />
          </div>

          <!-- Textarea con fondo dinámico -->
          <textarea
            v-model="textoNota"
            class="nota-textarea"
            :style="{ background: colorNota }"
            placeholder="Escribe tu nota..."
          />

          <!-- Acciones -->
          <div class="panel-acciones">
            <button class="btn-cancelar" @click="cerrarPanel">Cancelar</button>
            <button class="boton-primario btn-aceptar" @click="aceptarNota">Aceptar</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Diálogo de confirmación de borrado de receta -->
    <ConfirmDialog
      v-if="receta"
      :visible="mostrandoConfirmBorrado"
      titulo="Borrar receta"
      :mensaje="`¿Seguro que quieres borrar &quot;${receta.titulo}&quot;?`"
      @cancelar="mostrandoConfirmBorrado = false"
      @confirmar="ejecutarBorrar"
    />

    <!-- PANEL - Ayuda de gestos (BottomSheet genérico) -->
    <BottomSheet
      :visible="infoGestosAbierto"
      titulo="Cómo usar esta vista"
      @cerrar="infoGestosAbierto = false"
    >
      <h3 class="info-titulo">Cómo usar esta vista</h3>
      <ul class="info-lista">
        <li class="info-item">
          <v-icon size="22" color="var(--color-primario)">mdi-cursor-default-click</v-icon>
          <div class="info-texto">
            <strong>Tap en una nota</strong>
            <span>La abre para leer, editar o eliminar</span>
          </div>
        </li>
        <li class="info-item">
          <v-icon size="22" color="var(--color-primario)">mdi-drag</v-icon>
          <div class="info-texto">
            <strong>Mantén pulsada una nota y arrástrala</strong>
            <span>La mueve a otro paso de la receta</span>
          </div>
        </li>
        <li class="info-item">
          <v-icon size="22" color="var(--color-primario)">mdi-gesture-double-tap</v-icon>
          <div class="info-texto">
            <strong>Doble-tap en un paso (zona vacía)</strong>
            <span>Crea una nota nueva directamente en ese paso</span>
          </div>
        </li>
        <li class="info-item">
          <v-icon size="22" color="var(--color-primario)">mdi-gesture-swipe-horizontal</v-icon>
          <div class="info-texto">
            <strong>Desliza el slider inferior</strong>
            <span>Marca la receta como cocinada hoy</span>
          </div>
        </li>
        <li class="info-item">
          <v-icon size="22" color="var(--color-primario)">mdi-heart-outline</v-icon>
          <div class="info-texto">
            <strong>Corazón del encabezado</strong>
            <span>Guarda o quita la receta de tus favoritos</span>
          </div>
        </li>
      </ul>
      <button class="info-cerrar boton-primario" @click="infoGestosAbierto = false">Entendido</button>
    </BottomSheet>

    <!-- Popup de palabras clave (Teleport para posicionamiento correcto) -->
    <Teleport to="body">
      <div
        v-if="popupPalabra"
        class="popup-palabra"
        :style="{ left: `${popupPalabra.x}px`, top: `${popupPalabra.y}px` }"
        @click.stop
      >
        <button class="popup-cerrar" @click="popupPalabra = null" aria-label="Cerrar">
          <v-icon size="14" color="var(--color-texto-terciario)">mdi-close</v-icon>
        </button>
        <p class="popup-titulo-kw">{{ popupPalabra.anotacion.palabra_clave }}</p>
        <p class="popup-desc">{{ popupPalabra.anotacion.explicacion }}</p>
      </div>
    </Teleport>

    <!-- MODAL de detalle del post-it -->
    <Teleport to="body">
      <Transition name="fade-overlay">
        <div
          v-if="anotacionViendoId !== null && notaViendo"
          class="modal-overlay"
          @click.self="onOverlayClick"
        >
          <div
            class="modal-postit"
            :style="{ background: notaViendo.color }"
          >
            <!-- Cabecera: punto de color + etiqueta + cerrar -->
            <div class="modal-cabecera">
              <span
                class="modal-color-dot"
                :style="{ background: colorBorde(notaViendo.color) }"
              />
              <span class="modal-label">Nota</span>
              <button class="modal-cerrar-btn" @click="cerrarVentanaPostIt" aria-label="Cerrar">
                <v-icon size="20" color="var(--color-texto-secundario)">mdi-close</v-icon>
              </button>
            </div>

            <!-- Texto de la nota -->
            <p class="modal-texto">{{ notaViendo.contenido }}</p>

            <!-- Pie: editar y eliminar -->
            <div class="modal-pie">
              <button class="modal-btn-editar" @click="editarNotaDesdeModal">
                <v-icon size="16" color="var(--color-texto-secundario)">mdi-pencil-outline</v-icon>
                Editar
              </button>
              <button
                class="modal-btn-eliminar"
                :class="{ 'modal-btn-eliminar--confirmar': confirmandoEliminar }"
                @click="eliminarNotaDesdeModal"
              >
                <v-icon
                  size="16"
                  :color="confirmandoEliminar ? 'var(--color-error)' : 'var(--color-texto-secundario)'"
                >
                  mdi-delete-outline
                </v-icon>
                {{ confirmandoEliminar ? '¿Seguro?' : 'Eliminar' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { AnotacionEstilo, AnotacionPrivada } from '@/types'
import { useAuthStore }      from '@/stores/auth.store'
import { useRecetaStore }    from '@/stores/receta.store'
import { useAnotacionStore } from '@/stores/anotacion.store'
import { useFavoritoStore }  from '@/stores/favorito.store'
import { useHistorialStore } from '@/stores/historial.store'
import { procesarContenidoBloque } from '@/utils/procesarBloques'
import { mostrarToast } from '@/composables/useToast'
import SliderConfirmar   from '@/components/SliderConfirmar.vue'
import BottomSheet       from '@/components/BottomSheet.vue'
import RecetaContenido   from '@/components/RecetaContenido.vue'
import ConfirmDialog     from '@/components/ConfirmDialog.vue'

const route  = useRoute()
const router = useRouter()

const authStore      = useAuthStore()
const recetaStore    = useRecetaStore()
const anotacionStore = useAnotacionStore()
const favoritoStore  = useFavoritoStore()
const historialStore = useHistorialStore()

// Constantes tipadas (excepciones permitidas a "sin colores hardcodeados")
const COLORES_NOTA = [
  '#FFF9C4', '#C8E6C9', '#BBDEFB',
  '#FFE0B2', '#F8BBD9', '#E1BEE7', '#B2EBF2',
] as const

interface InfoTipo {
  icono: string
  acento: string
}

const TIPOS_BLOQUE: Readonly<Record<string, InfoTipo>> = {
  PREPARAR: { icono: 'mdi-knife',                acento: '#E8F5E9' },
  ELABORAR: { icono: 'mdi-bowl-mix-outline',      acento: '#FFF8E1' },
  COCINAR:  { icono: 'mdi-pot-steam-outline',     acento: '#FFF3E0' },
  ESPERAR:  { icono: 'mdi-timer-sand',            acento: '#E3F2FD' },
  FIN:      { icono: 'mdi-silverware-fork-knife', acento: 'var(--color-primario-suave)' },
}

const FALLBACK_TIPO: InfoTipo = { icono: 'mdi-square-outline', acento: '#F5F5F5' }

function infoTipo(tipo: string | undefined): InfoTipo {
  if (!tipo) return FALLBACK_TIPO
  return TIPOS_BLOQUE[tipo.toUpperCase()] ?? FALLBACK_TIPO
}

// Oscurece un color hex multiplicando cada canal por 0.7
function colorBorde(hex: string): string {
  if (hex.length !== 7 || hex[0] !== '#') return hex
  const r = Math.round(parseInt(hex.slice(1, 3), 16) * 0.7)
  const g = Math.round(parseInt(hex.slice(3, 5), 16) * 0.7)
  const b = Math.round(parseInt(hex.slice(5, 7), 16) * 0.7)
  return `rgb(${r}, ${g}, ${b})`
}

// ID de la receta
const recetaId = computed((): number => {
  const param = route.params['id']
  return Number(Array.isArray(param) ? param[0] : param)
})

// Datos reactivos
const receta = computed(() => recetaStore.recetaActual)

const bloquesOrdenados = computed(() => {
  if (!receta.value?.bloques) return []
  return [...receta.value.bloques].sort((a, b) => a.orden - b.orden)
})

function anotacionesPorBloque(bloqueId: number): AnotacionEstilo[] {
  return anotacionStore.anotacionesEstilo.filter(a => a.bloque_id === bloqueId)
}

function notasDeBloque(orden: number): AnotacionPrivada[] {
  return anotacionStore.anotacionesPrivadas.filter(n => n.posicion_bloque === orden)
}

// Favorito
const esFavorito = computed(() => favoritoStore.esFavorito(recetaId.value))

// Cocinado hoy (opción B: derivado del store de historial ya cargado)
const cocinadoHoy = computed((): boolean => {
  const hoy = new Date().toISOString().split('T')[0]!
  return historialStore.entradas.some(
    (e) => e.receta_id === recetaId.value && e.cocinado_el.split('T')[0] === hoy
  )
})

// Estado reactivo principal
const panelNotaAbierto    = ref<boolean>(false)
const modoColocandoNota   = ref<boolean>(false)
const colorNota           = ref<string>('#FFF9C4')
const textoNota           = ref<string>('')
// Favorito: controla la animación de bounce
const animandoFavorito    = ref<boolean>(false)
// Borrado de receta: controla la visibilidad del diálogo de confirmación
const mostrandoConfirmBorrado = ref<boolean>(false)
// Panel informativo de gestos disponibles en la vista
const infoGestosAbierto   = ref<boolean>(false)
// Bloque preseleccionado al abrir el panel desde doble-tap (null = flujo de arrastre)
const bloquePreseleccionado = ref<number | null>(null)

// Estado del drag & drop
const arrastrando          = ref<boolean>(false)
const fantasmaX            = ref<number>(0)
const fantasmaY            = ref<number>(0)
const bloqueDestino        = ref<number>(1)
const bloqueDropActivoOrden = ref<number | null>(null)

// Estado del modal, edición y reposicionamiento del post-it
const anotacionViendoId        = ref<number | null>(null)
const anotacionEditandoId      = ref<number | null>(null)
const anotacionReposicionandoId = ref<number | null>(null)
const confirmandoEliminar      = ref<boolean>(false)
let timerEliminar:  ReturnType<typeof setTimeout> | null = null
let timerLongPress:  ReturnType<typeof setTimeout> | null = null
let longPressFired   = false
let longPressX       = 0
let longPressY       = 0
let pointerDownTime  = 0  // marca de tiempo del último pointerdown sobre un post-it
// Marca de tiempo de apertura del modal de post-it. El browser genera un click
// sintético ~300ms tras un touchend; si ese click aterriza sobre el overlay
// (z-index:300, cubre toda la pantalla), dispararía el cierre inmediato del modal.
// Ignoramos cierres que llegan antes de 350ms desde la apertura.
let modalAbiertoEn   = 0

// Doble-tap en bloque: estado de detección inter-tap
let ultimoTapBloqueTiempo = 0
let ultimoTapBloqueOrden  = -1

// Tap limpio: suelta antes de TAP_MAX_MS → abre detalle
// Zona intermedia (TAP_MAX_MS..LONG_PRESS_MS): no hace nada
// Long-press: ≥ LONG_PRESS_MS → modo fantasma (reposicionar)
const TAP_MAX_MS    = 350
const LONG_PRESS_MS = 500

const notaViendo = computed<AnotacionPrivada | null>(() => {
  if (anotacionViendoId.value === null) return null
  return anotacionStore.anotacionesPrivadas.find(n => n.id === anotacionViendoId.value) ?? null
})

// Color del fantasma: usa el de la nota que se reposiciona, o el de la nota nueva
const colorFantasma = computed<string>(() => {
  if (anotacionReposicionandoId.value !== null) {
    return anotacionStore.anotacionesPrivadas
      .find(n => n.id === anotacionReposicionandoId.value)?.color ?? colorNota.value
  }
  return colorNota.value
})

// Título y subtítulo del panel según si es creación o edición
const panelTitulo = computed(() =>
  anotacionEditandoId.value !== null ? 'Editar nota' : 'Nueva nota'
)
const panelSubtitulo = computed(() =>
  anotacionEditandoId.value !== null
    ? 'Modifica el color o el texto'
    : 'Elige color y escribe tu nota'
)

// Acciones del header
function volver(): void {
  if (route.query['from'] === 'recetario') {
    router.push('/recetario')
  } else {
    router.back()
  }
}

async function ejecutarToggleFavorito(): Promise<void> {
  // Disparar animación de bounce inmediatamente (el store ya hace update optimista)
  animandoFavorito.value = true
  setTimeout(() => { animandoFavorito.value = false }, 450)
  try {
    if (esFavorito.value) await favoritoStore.eliminar(recetaId.value)
    else await favoritoStore.añadir(recetaId.value)
  } catch {
    // El store ya revirtió el estado optimista; mostrar feedback de error
    mostrarToast('Error al actualizar favorito. Inténtalo de nuevo.', 'error')
  }
}

function ejecutarModificar(): void {
  router.push(`/crear?editar=${recetaId.value}`)
}

async function ejecutarBorrar(): Promise<void> {
  mostrandoConfirmBorrado.value = false
  const titulo = receta.value?.titulo ?? ''
  try {
    await recetaStore.eliminar(recetaId.value)
    mostrarToast(`Receta "${titulo}" borrada correctamente`, 'success')
    router.push('/recetario')
  } catch (error) {
    console.error('[RecetaDetailView] Error al borrar:', error)
    mostrarToast('Error al borrar la receta. Inténtalo de nuevo.', 'error')
  }
}

// Doble-tap en bloque - capa táctil (@touchend, móvil)
// Usa touchend (no touchstart) para que preventDefault no bloquee el scroll.
// El timing se mide de finger-lift a finger-lift (evita colisión mismo-tap).
function onBloqueTouchEnd(e: TouchEvent, bloqueOrden: number): void {
  // El navegador marca el touchend como no cancelable cuando ya está resolviendo
  // un scroll en curso (p.ej. long-press sobre una nota cancelado por deslizar
  // antes de completar los 500ms) -- llamar preventDefault() ahí es un no-op que
  // solo genera el aviso de consola "[Intervention] Ignored attempt to cancel...".
  // Comportamiento esperado, no un error: nos limitamos a no invocarlo entonces.
  if (e.cancelable) e.preventDefault()
  // Mientras hay un drag activo (reposicionar post-it o colocar uno nuevo),
  // NO cortar la propagación: el touchend tiene que poder llegar al listener
  // de document registrado en iniciarReposicionamiento/onPointerDown (misma
  // cadena de burbujeo, ya que el touch mantiene como target el elemento
  // original del touchstart, normalmente dentro de este mismo .bloque), o el
  // drag nunca se cierra ni persiste la nueva posición.
  if (arrastrando.value) return
  e.stopPropagation()
  if (modoColocandoNota.value || longPressFired) return
  if ((e.target as HTMLElement).closest('.postit-circulo')) return

  const ahora = Date.now()
  if (ahora - ultimoTapBloqueTiempo < 500 && ultimoTapBloqueOrden === bloqueOrden) {
    ultimoTapBloqueTiempo = 0
    ultimoTapBloqueOrden  = -1
    bloquePreseleccionado.value = bloqueOrden
    panelNotaAbierto.value = true
  } else {
    ultimoTapBloqueTiempo = ahora
    ultimoTapBloqueOrden  = bloqueOrden
  }
}

// Doble-click en bloque - desktop (@dblclick nativo)
function onBloqueDblClick(bloqueOrden: number): void {
  if (arrastrando.value || modoColocandoNota.value) return
  bloquePreseleccionado.value = bloqueOrden
  panelNotaAbierto.value = true
}

// Slider "ya lo he cocinado"
async function onSliderConfirmar(): Promise<void> {
  try {
    await historialStore.marcarCocinada(recetaId.value)
    mostrarToast('¡Receta marcada como cocinada!', 'success')
  } catch {
    mostrarToast('No se pudo registrar como cocinada. Inténtalo de nuevo.', 'error')
  }
}

// Panel de nota (creación / edición)
function cerrarPanel(): void {
  panelNotaAbierto.value = false
  anotacionEditandoId.value = null
  bloquePreseleccionado.value = null
  textoNota.value = ''
  colorNota.value = '#FFF9C4'
}

async function aceptarNota(): Promise<void> {
  if (!textoNota.value.trim()) return

  if (anotacionEditandoId.value !== null) {
    // Modo edición: actualizar y refrescar desde BD (el PATCH devuelve { count }, no el objeto)
    try {
      await anotacionStore.actualizarPrivada(anotacionEditandoId.value, {
        contenido: textoNota.value.trim(),
        color: colorNota.value,
      })
      await anotacionStore.cargarPrivadas(recetaId.value)
      anotacionEditandoId.value = null
      panelNotaAbierto.value = false
      textoNota.value = ''
      colorNota.value = '#FFF9C4'
      mostrarToast('Nota actualizada correctamente', 'success')
    } catch {
      // No se limpia el estado: el panel sigue abierto con el texto tal
      // cual lo dejó el usuario, para que pueda reintentar sin perderlo.
      mostrarToast('No se pudo actualizar la nota. Inténtalo de nuevo.', 'error')
    }
  } else if (bloquePreseleccionado.value !== null) {
    // Modo doble-tap: bloque ya conocido, crear directamente sin drag
    try {
      await anotacionStore.crearPrivada(recetaId.value, {
        contenido:       textoNota.value.trim(),
        color:           colorNota.value,
        posicion_bloque: bloquePreseleccionado.value,
      })
      await anotacionStore.cargarPrivadas(recetaId.value)
      mostrarToast('Nota añadida correctamente', 'success')
    } catch {
      mostrarToast('No se pudo guardar la nota. Inténtalo de nuevo.', 'error')
    }
    cerrarPanel()
  } else {
    // Fallback: modo colocación por arrastre (bloquePreseleccionado no fue asignado)
    panelNotaAbierto.value = false
    modoColocandoNota.value = true
  }
}

function cancelarColocacion(): void {
  modoColocandoNota.value = false
  arrastrando.value = false
  bloqueDropActivoOrden.value = null
  textoNota.value = ''
  colorNota.value = '#FFF9C4'
}

// Drag & drop del post-it

function actualizarPosicion(clientX: number, clientY: number): void {
  fantasmaX.value = clientX - 24
  fantasmaY.value = clientY - 24

  // Detectar el bloque bajo el cursor mediante posición absoluta
  const el = document.elementFromPoint(clientX, clientY)
  const bloqueEl = (el as HTMLElement | null)?.closest('[data-bloque-orden]') as HTMLElement | null
  if (bloqueEl) {
    const orden = Number(bloqueEl.dataset['bloqueOrden'])
    if (!isNaN(orden)) {
      bloqueDestino.value = orden
      bloqueDropActivoOrden.value = orden
      return
    }
  }
  bloqueDropActivoOrden.value = null
}

function onPointerDown(e: MouseEvent | TouchEvent): void {
  if (!modoColocandoNota.value) return
  const clientX = 'touches' in e ? (e as TouchEvent).touches[0]!.clientX : (e as MouseEvent).clientX
  const clientY = 'touches' in e ? (e as TouchEvent).touches[0]!.clientY : (e as MouseEvent).clientY
  arrastrando.value = true
  actualizarPosicion(clientX, clientY)
}

function onPointerMove(e: MouseEvent | TouchEvent): void {
  if (!arrastrando.value) return
  if ('touches' in e) e.preventDefault()
  const clientX = 'touches' in e ? (e as TouchEvent).touches[0]!.clientX : (e as MouseEvent).clientX
  const clientY = 'touches' in e ? (e as TouchEvent).touches[0]!.clientY : (e as MouseEvent).clientY
  actualizarPosicion(clientX, clientY)
}

async function onPointerUp(): Promise<void> {
  if (!arrastrando.value) return
  const dropValido = bloqueDropActivoOrden.value !== null
  arrastrando.value = false
  bloqueDropActivoOrden.value = null

  if (anotacionReposicionandoId.value !== null) {
    // Rama reposicionamiento: actualizar posicion_bloque de la nota existente
    const id = anotacionReposicionandoId.value
    // Solo guardar si se soltó sobre un bloque válido; si no, la nota vuelve a su sitio
    if (dropValido) {
      try {
        await anotacionStore.actualizarPrivada(id, { posicion_bloque: bloqueDestino.value })
        await anotacionStore.cargarPrivadas(recetaId.value)
      } catch { /* el store registra el error */ }
    }
    // Mantener el círculo invisible 0.2s para que el store tenga tiempo de actualizarse
    // antes de que reaparezca. Evita el flash en el bloque anterior.
    setTimeout(() => { anotacionReposicionandoId.value = null }, 200)
    // Liberar el flag de long-press: el gesto de reposicionamiento ha terminado
    // limpiamente, así que el doble-tap de creación debe volver a funcionar.
    longPressFired = false
    // Desregistrar los listeners que se añadieron manualmente en iniciarReposicionamiento
    document.removeEventListener('mousemove', onPointerMove)
    document.removeEventListener('mouseup',   onPointerUp)
    document.removeEventListener('touchmove', onPointerMove)
    document.removeEventListener('touchend',  onPointerUp)
  } else {
    // Rama creación: crear nota nueva con la posición del bloque
    try {
      await anotacionStore.crearPrivada(recetaId.value, {
        contenido:       textoNota.value.trim(),
        color:           colorNota.value,
        posicion_bloque: bloqueDestino.value,
      })
      await anotacionStore.cargarPrivadas(recetaId.value)
      mostrarToast('Nota añadida correctamente', 'success')
    } catch {
      mostrarToast('No se pudo guardar la nota. Inténtalo de nuevo.', 'error')
    }
    textoNota.value = ''
    colorNota.value = '#FFF9C4'
    modoColocandoNota.value = false
    // El watch de modoColocandoNota desregistra los listeners de creación
  }
}

// Registrar/desregistrar todos los listeners cuando cambia el modo de colocación
watch(modoColocandoNota, (activo) => {
  if (activo) {
    document.addEventListener('mousedown',  onPointerDown)
    document.addEventListener('mousemove',  onPointerMove)
    document.addEventListener('mouseup',    onPointerUp)
    document.addEventListener('touchstart', onPointerDown, { passive: false })
    document.addEventListener('touchmove',  onPointerMove, { passive: false })
    document.addEventListener('touchend',   onPointerUp)
  } else {
    document.removeEventListener('mousedown',  onPointerDown)
    document.removeEventListener('mousemove',  onPointerMove)
    document.removeEventListener('mouseup',    onPointerUp)
    document.removeEventListener('touchstart', onPointerDown)
    document.removeEventListener('touchmove',  onPointerMove)
    document.removeEventListener('touchend',   onPointerUp)
  }
})

// Long-press y reposicionamiento de post-it

function onPointerDownPostit(e: PointerEvent, id: number): void {
  // Si estamos colocando una nota nueva, ignorar -- el mousedown global gestiona el drag
  if (modoColocandoNota.value) return
  longPressFired  = false
  longPressX      = e.clientX
  longPressY      = e.clientY
  pointerDownTime = Date.now()
  timerLongPress  = setTimeout(() => {
    longPressFired = true
    timerLongPress = null
    iniciarReposicionamiento(id)
  }, LONG_PRESS_MS)
}

function onPointerUpPostit(_e: PointerEvent, id: number): void {
  // Limpiar siempre el timer, independientemente de la rama que se ejecute
  if (timerLongPress !== null) {
    clearTimeout(timerLongPress)
    timerLongPress = null
  }
  // Si el long-press ya arrancó, onPointerUp global gestiona el drop
  if (longPressFired) return
  const elapsed = Date.now() - pointerDownTime
  // Tap limpio (< TAP_MAX_MS): abrir ventana de detalle
  if (elapsed < TAP_MAX_MS) {
    verPostIt(id)
  }
  // Zona intermedia (TAP_MAX_MS..LONG_PRESS_MS): no hace nada
}

function onPointerCancelPostit(): void {
  if (timerLongPress !== null) {
    clearTimeout(timerLongPress)
    timerLongPress = null
  }
  // Si el reposicionamiento ya había comenzado, cancelarlo limpiamente
  if (arrastrando.value && anotacionReposicionandoId.value !== null) {
    arrastrando.value = false
    anotacionReposicionandoId.value = null
    bloqueDropActivoOrden.value = null
    longPressFired = false
    document.removeEventListener('mousemove', onPointerMove)
    document.removeEventListener('mouseup',   onPointerUp)
    document.removeEventListener('touchmove', onPointerMove)
    document.removeEventListener('touchend',  onPointerUp)
  }
}

function iniciarReposicionamiento(id: number): void {
  const nota = anotacionStore.anotacionesPrivadas.find(n => n.id === id)
  anotacionReposicionandoId.value = id
  arrastrando.value = true
  // Posición inicial del bloque origen como destino por defecto
  bloqueDestino.value = nota?.posicion_bloque ?? 1
  fantasmaX.value = longPressX - 20
  fantasmaY.value = longPressY - 20
  // Feedback táctil si el navegador lo soporta
  if (navigator.vibrate) navigator.vibrate(50)
  // Registrar solo move y up (el down ya ocurrió en el post-it)
  document.addEventListener('mousemove', onPointerMove)
  document.addEventListener('mouseup',   onPointerUp)
  document.addEventListener('touchmove', onPointerMove, { passive: false })
  document.addEventListener('touchend',  onPointerUp)
}

// Modal de detalle del post-it

function verPostIt(id: number): void {
  anotacionViendoId.value = id
  confirmandoEliminar.value = false
  modalAbiertoEn = Date.now()
  if (timerEliminar !== null) {
    clearTimeout(timerEliminar)
    timerEliminar = null
  }
}

// Handler exclusivo para el click en el overlay del modal.
// Ignora el click sintético que el browser genera ~300ms tras un touchend:
// ese click aterriza sobre el overlay (posición fixed inset-0) y cerraría
// el modal justo cuando acaba de abrirse via gesture táctil.
function onOverlayClick(): void {
  if (Date.now() - modalAbiertoEn < 350) return
  cerrarVentanaPostIt()
}

function cerrarVentanaPostIt(): void {
  anotacionViendoId.value = null
  anotacionEditandoId.value = null
  confirmandoEliminar.value = false
  if (timerEliminar !== null) {
    clearTimeout(timerEliminar)
    timerEliminar = null
  }
}

function editarNotaDesdeModal(): void {
  const nota = notaViendo.value
  if (!nota) return
  anotacionEditandoId.value = nota.id
  textoNota.value = nota.contenido
  colorNota.value = nota.color
  anotacionViendoId.value = null
  panelNotaAbierto.value = true
}

async function eliminarNotaDesdeModal(): Promise<void> {
  if (!confirmandoEliminar.value) {
    // Primera pulsación: mostrar confirmación 1,5 s
    confirmandoEliminar.value = true
    timerEliminar = setTimeout(() => {
      confirmandoEliminar.value = false
      timerEliminar = null
    }, 1500)
    return
  }
  // Segunda pulsación dentro del timeout: eliminar
  const id = anotacionViendoId.value
  if (id !== null) {
    try {
      await anotacionStore.eliminarPrivada(id)
      mostrarToast('Nota eliminada correctamente', 'success')
      cerrarVentanaPostIt()
    } catch {
      // No se cierra el modal: la nota sigue ahí, el usuario puede reintentar
      mostrarToast('No se pudo eliminar la nota. Inténtalo de nuevo.', 'error')
    }
  }
}

// Popup de palabras clave
interface PopupPalabra {
  anotacion: AnotacionEstilo
  x: number
  y: number
}
const popupPalabra = ref<PopupPalabra | null>(null)

function manejarClickPalabraClave(e: MouseEvent): void {
  if (modoColocandoNota.value) return
  const target = e.target as HTMLElement
  if (!target.classList.contains('palabra-clave')) return
  const id = Number(target.dataset['id'])
  const anotacion = anotacionStore.anotacionesEstilo.find(a => a.id === id)
  if (anotacion) {
    const x = Math.min(e.clientX, window.innerWidth - 260)
    const y = e.clientY + 16
    popupPalabra.value = { anotacion, x, y }
  }
}

function cerrarPopup(): void {
  popupPalabra.value = null
}

// Carga inicial
async function cargarDetalle(): Promise<void> {
  await recetaStore.cargarDetalle(recetaId.value)
}

onMounted(async () => {
  await cargarDetalle()

  if (authStore.estaAutenticado) {
    await anotacionStore.cargarEstilo(recetaId.value)
    await anotacionStore.cargarPrivadas(recetaId.value)
    if (favoritoStore.favoritos.length === 0) {
      await favoritoStore.cargarFavoritos()
    }
    // Historial necesario para cocinadoHoy -- carga perezosa con isLoaded
    if (!historialStore.isLoaded) {
      await historialStore.cargarHistorial()
    }
  }

  document.addEventListener('click', cerrarPopup)
})

onUnmounted(() => {
  document.removeEventListener('click', cerrarPopup)
  // Listeners de modo creación (registrados por el watch de modoColocandoNota)
  document.removeEventListener('mousedown',  onPointerDown)
  document.removeEventListener('mousemove',  onPointerMove)
  document.removeEventListener('mouseup',    onPointerUp)
  document.removeEventListener('touchstart', onPointerDown)
  document.removeEventListener('touchmove',  onPointerMove)
  document.removeEventListener('touchend',   onPointerUp)
  // Timers activos
  if (timerEliminar  !== null) clearTimeout(timerEliminar)
  if (timerLongPress !== null) clearTimeout(timerLongPress)
})
</script>

<style scoped>
/* -- Contenedor raíz -------------------------------------------------------- */
.detalle-fondo {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  background: var(--color-secundario);
  display: flex;
  flex-direction: column;
  position: relative;
}

/* -- Skeleton loaders ------------------------------------------------------- */
@keyframes shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}

.skeleton-wrapper {
  display: flex;
  flex-direction: column;
}

.skeleton-header {
  height: 64px;
  background: var(--color-superficie);
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.06);
}

.skeleton-zona {
  padding: var(--espacio-md);
  display: flex;
  flex-direction: column;
  gap: var(--espacio-md);
}

.skeleton-titulo,
.skeleton-meta,
.skeleton-bloque {
  border-radius: var(--tarjeta-secundaria-radio);
  background: linear-gradient(
    90deg,
    var(--color-primario-suave) 25%,
    #ede9e6 50%,
    var(--color-primario-suave) 75%
  );
  background-size: 800px 100%;
  animation: shimmer 1.4s infinite linear;
}

.skeleton-titulo { height: 28px; width: 65%; }
.skeleton-meta   { height: 16px; width: 45%; }
.skeleton-bloque { height: 120px; width: 100%; }

/* -- Estado de error centrado ----------------------------------------------- */
.estado-centrado {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--espacio-md);
  padding: var(--espacio-md);
}

.error-msg {
  font-size: var(--texto-sm);
  color: var(--color-texto-secundario);
  margin: 0;
}

/* -- Banner "colocando nota" ----------------------------------------------- */
.banner-colocando {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 48px;
  background: var(--color-primario);
  color: var(--color-superficie);
  display: flex;
  align-items: center;
  gap: var(--espacio-sm);
  padding: 0 var(--espacio-md);
  z-index: 100;
}

.banner-texto {
  flex: 1;
  font-size: var(--texto-sm);
  font-weight: 500;
}

.banner-cerrar {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 6px;
}

.banner-enter-active,
.banner-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.banner-enter-from,
.banner-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

/* -- Sección 1 -- Header bar sticky ----------------------------------------- */
.header-bar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--color-crema);
  padding: 12px var(--espacio-md);
  
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.06);
}

.header-acciones {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Animación de bounce del corazón al guardar/quitar favorito */
@keyframes corazon-bounce {
  0%   { transform: scale(1); }
  25%  { transform: scale(1.5); }
  55%  { transform: scale(1.15); }
  75%  { transform: scale(1.3); }
  100% { transform: scale(1); }
}

.btn-favorito--animando {
  animation: corazon-bounce 0.4s ease;
}

.btn-nav {
  width: 40px;
  height: 40px;
  background: var(--color-crema);
  border: none;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s;
  flex-shrink: 0;
}

.btn-nav:hover {
  background: var(--color-primario-suave);
}


/* -- Sección 3 -- Bloques de elaboración ------------------------------------ */
.estado-vacio {
  padding: var(--espacio-xl) var(--espacio-md);
  text-align: center;
  font-size: var(--texto-sm);
  color: var(--color-texto-terciario);
}

/* [CAMBIO 1] El contenedor usa el fondo de página para que se vean los gaps */
.bloques-lista {
  background: var(--color-secundario);
  padding: var(--espacio-md);
  display: flex;
  flex-direction: column;
}

/* [CAMBIO 1] Bloques como tarjetas con borde, radio y margen entre ellos */
.bloque {
  padding: var(--espacio-md);
  background: var(--color-superficie);
  border: 1.5px solid var(--color-primario-suave);
  border-radius: 12px;
  margin-bottom: 6px;
  position: relative;
  transition: border-color 0.15s, background 0.15s;
  box-shadow: var(--tarjeta-secundaria-sombra);
}

/* [CAMBIO 2] Bloque activo bajo el cursor mientras se arrastra */
.bloque--drop-activo {
  border-color: var(--color-primario);
  background: var(--color-primario-suave);
}

/* Cabecera del bloque */
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
  flex: 1;
  text-align: end;
  font-size: var(--texto-xs);
  color: var(--color-texto-terciario);
  letter-spacing: 1px;
  text-transform: uppercase;
  font-weight: 600;
}

.flex-spacer {
  flex: 1;
}

.bloque-contenido {
  margin-top: 12px;
  font-size: var(--texto-base);
  line-height: 1.8;
  color: var(--color-texto-principal);
  white-space: pre-wrap;
  text-align: justify;
}

:deep(.palabra-clave) {
  text-decoration: underline dotted var(--color-primario);
  cursor: pointer;
  color: var(--color-primario);
  font-weight: 500;
  transition: opacity 0.1s;
}

:deep(.palabra-clave:hover) {
  opacity: 0.7;
}

/* -- [CAMBIO 3] Post-its: solo círculos que abren modal ------------------- */
.bloque-notas {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: var(--espacio-sm);
}

.postit-circulo {
  display: inline-block;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  cursor: pointer;
  margin: 2px;
  transition: transform 150ms ease;
  /* El color y el borde se aplican vía inline style */

  /* Sin esto, un long-press en iOS Safari real (no en el emulador de Chrome)
     dispara la selección de texto / callout nativo del bloque contenedor
     antes de que salte el timer de LONG_PRESS_MS y arranque el drag. */
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}

.postit-circulo:hover {
  transform: scale(1.2);
}

.postit-circulo--arrastrando {
  opacity: 0;
  pointer-events: none;
}

/* Animación de entrada al colocar un post-it nuevo */
.postit-enter-active {
  transition: all 250ms ease-out;
}
.postit-enter-from {
  opacity: 0;
  transform: scale(1.8);
}

/* -- Fantasma del post-it durante el drag ---------------------------------- */
.postit-fantasma {
  position: fixed;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  pointer-events: none;
  z-index: 9999;
  opacity: 0.5;
  transform: scale(1.2);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  transition: transform 120ms ease, opacity 120ms ease;
}

.slider-zona {
  padding: var(--espacio-sm) var(--espacio-md) var(--espacio-md);
  background: var(--color-secundario);
}

.espacio-final {
  height: calc(var(--footer-altura) + 24px);
  background: var(--color-secundario);
}

/* -- Panel de nota -- bottom sheet ------------------------------------------- */
.panel-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 200;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.panel-nota {
  background: var(--color-superficie);
  border-radius: 20px 20px 0 0;
  padding: var(--espacio-lg);
  padding-bottom: calc(var(--footer-altura) + var(--espacio-lg));
}

.panel-handle {
  width: 40px;
  height: 4px;
  background: var(--color-texto-terciario);
  border-radius: 2px;
  margin: 0 auto var(--espacio-md);
  opacity: 0.4;
}

.panel-titulo {
  font-size: var(--texto-md);
  font-weight: 700;
  color: var(--color-texto-principal);
  margin: 0 0 4px;
}

.panel-subtitulo {
  font-size: var(--texto-sm);
  color: var(--color-texto-terciario);
  margin: 0 0 var(--espacio-md);
}

.selector-colores {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.color-circulo {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  padding: 0;
  outline: none;
  transition: border-color 0.15s, transform 0.1s;
}

.color-circulo--activo {
  border-color: var(--color-primario);
  transform: scale(1.2);
}

.nota-textarea {
  display: block;
  width: 100%;
  min-height: 80px;
  border-radius: 12px;
  border: 1.5px solid var(--color-primario-suave);
  padding: 12px;
  font-size: var(--texto-base);
  font-family: inherit;
  resize: none;
  outline: none;
  box-sizing: border-box;
  margin-top: var(--espacio-md);
  transition: border-color 0.15s, background 0.2s;
}

.nota-textarea:focus {
  border-color: var(--color-primario);
}

.panel-acciones {
  display: flex;
  align-items: center;
  gap: var(--espacio-md);
  margin-top: var(--espacio-md);
}

.btn-cancelar {
  font-size: var(--texto-sm);
  color: var(--color-texto-terciario);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.btn-aceptar {
  flex: 1;
  height: 48px;
  font-size: var(--texto-base);
}

/* Transición slide-up del panel */
.slide-up-enter-active {
  transition: opacity 0.25s ease;
}
.slide-up-leave-active {
  transition: opacity 0.2s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
}
.slide-up-enter-active .panel-nota {
  animation: slideUp 0.28s cubic-bezier(0.32, 0.72, 0, 1) forwards;
}
.slide-up-leave-active .panel-nota {
  animation: slideDown 0.22s ease forwards;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}

@keyframes slideDown {
  from { transform: translateY(0); }
  to   { transform: translateY(100%); }
}

/* -- Botón de ayuda de gestos (enlace sutil entre slider y footer) ---------- */
.btn-ayuda {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--espacio-xs);
  width: 100%;
  background: none;
  border: none;
  padding: var(--espacio-sm) var(--espacio-md);
  cursor: pointer;
  font-family: inherit;
}

.btn-ayuda-texto {
  font-size: var(--texto-xs);
  color: var(--color-texto-terciario);
  font-weight: 500;
}

/* -- Panel informativo de gestos (slot dentro de BottomSheet) --------------- */
.info-titulo {
  font-size: var(--texto-md);
  font-weight: 700;
  color: var(--color-texto-principal);
  margin: 0 0 var(--espacio-md);
  text-align: center;
}

.info-lista {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--espacio-md);
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: var(--espacio-sm);
}

.info-texto {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.info-texto strong {
  font-size: var(--texto-base);
  font-weight: 600;
  color: var(--color-texto-principal);
  line-height: 1.3;
}

.info-texto span {
  font-size: var(--texto-sm);
  color: var(--color-texto-secundario);
  line-height: 1.4;
}

.info-cerrar {
  margin-top: var(--espacio-lg);
}
</style>

<!-- Estilos globales (Teleport rompe scoped): popup de palabras clave + modal post-it -->
<style>
/* -- Popup de palabras clave ----------------------------------------------- */
.popup-palabra {
  position: fixed;
  z-index: 1000;
  background: var(--tarjeta-fondo);
  border-radius: var(--tarjeta-secundaria-radio);
  box-shadow: var(--tarjeta-sombra-hover);
  padding: var(--tarjeta-padding);
  max-width: 240px;
  min-width: 160px;
}

.popup-cerrar {
  position: absolute;
  top: 6px;
  right: 6px;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0;
}

.popup-titulo-kw {
  font-size: var(--texto-sm);
  font-weight: 700;
  color: var(--color-primario);
  margin: 0 0 var(--espacio-xs);
  padding-right: 20px;
}

.popup-desc {
  font-size: var(--texto-sm);
  color: var(--color-texto-secundario);
  margin: 0;
  line-height: 1.5;
}

/* -- [CAMBIO 3] Modal de detalle del post-it ------------------------------- */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-postit {
  border-radius: 20px;
  padding: var(--espacio-lg);
  width: min(320px, calc(100vw - 32px));
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.modal-cabecera {
  display: flex;
  align-items: center;
  gap: var(--espacio-sm);
  margin-bottom: var(--espacio-sm);
}

.modal-color-dot {
  display: block;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
}

.modal-label {
  font-size: var(--texto-sm);
  color: var(--color-texto-secundario);
  flex: 1;
}

.modal-cerrar-btn {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 6px;
}

.modal-texto {
  font-size: var(--texto-base);
  line-height: 1.6;
  color: var(--color-texto-principal);
  margin: var(--espacio-sm) 0 var(--espacio-md);
  white-space: pre-wrap;
  padding: 1rem;
}

.modal-pie {
  display: flex;
  gap: var(--espacio-sm);
}

.modal-btn-editar,
.modal-btn-eliminar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: var(--texto-sm);
  font-family: inherit;
  background: rgba(255, 255, 255, 0.5);
  color: var(--color-texto-secundario);
  transition: background 0.15s;
}

.modal-btn-editar:hover,
.modal-btn-eliminar:hover {
  background: rgba(255, 255, 255, 0.7);
}

.modal-btn-eliminar--confirmar {
  background: rgba(229, 57, 53, 0.15);
  color: var(--color-error);
}

/* Transición del modal: fade + escala */
.fade-overlay-enter-active,
.fade-overlay-leave-active {
  transition: opacity 0.2s ease;
}
.fade-overlay-enter-from,
.fade-overlay-leave-to {
  opacity: 0;
}
.fade-overlay-enter-active .modal-postit {
  animation: scaleIn 0.22s cubic-bezier(0.32, 0.72, 0, 1) forwards;
}
.fade-overlay-leave-active .modal-postit {
  animation: scaleOut 0.18s ease forwards;
}

@keyframes scaleIn {
  from { transform: scale(0.85); opacity: 0; }
  to   { transform: scale(1);    opacity: 1; }
}

@keyframes scaleOut {
  from { transform: scale(1);    opacity: 1; }
  to   { transform: scale(0.85); opacity: 0; }
}
</style>
