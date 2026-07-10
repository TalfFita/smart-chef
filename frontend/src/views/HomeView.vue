<template>
  <div class="home vista-capa0">

    <!-- SECCIÓN 1: Header de la app -->
    <AppHeader titulo="Smart Chef" />

    <!-- SECCIÓN 2: Frase dinámica (typewriter) -- solo visible en INICIO -->
    <section v-if="pasoActual === Paso.INICIO" class="home__frase">
      <p class="home__typewriter">{{ textoMostrado }}<span v-if="escribiendo" class="cursor" aria-hidden="true">|</span></p>
    </section>

    <!-- SECCIÓN 3: Navegación de pasos -- solo visible cuando NO estamos en INICIO -->
    <nav v-if="pasoActual !== Paso.INICIO && caminoSeleccionado !== 'A'" class="home__nav-pasos">
      <button class="btn-volver" aria-label="Volver" @click="volver">
        <v-icon size="20" color="var(--color-texto-principal)">mdi-arrow-left</v-icon>
      </button>
      <div class="dots">
        <span
          v-for="(_, i) in totalDots"
          :key="i"
          class="dot"
          :class="{ 'dot--activo': i <= dotActivo - 1 }"
        />
      </div>
      <div />
    </nav>

    <!-- SECCIÓN 4: Contenido dinámico del flujo -->
    <main class="home__contenido">
      <Transition name="paso" mode="out-in">
        <div :key="pasoActual" class="paso-wrapper">

          <!-- INICIO - Tres caminos + crear receta -->
          <template v-if="pasoActual === Paso.INICIO">
            <div class="home__descubrir">
              <p class="home__descubrir-label">Encuentra tu próxima receta</p>
              <div class="opciones-lista">
                <button
                  class="tarjeta-opcion"
                  :class="{ 'tarjeta-opcion--pulsada': opcionPulsada === 'A' }"
                  @click="elegirCamino('A')"
                >
                  <v-icon size="28" color="var(--color-primario)">mdi-magnify</v-icon>
                  <div class="tarjeta-opcion__texto">
                    <span class="tarjeta-opcion__titulo">Sé lo que quiero</span>
                    <span class="tarjeta-opcion__sub">Busca por nombre o ingrediente</span>
                  </div>
                  <v-icon size="18" color="var(--color-texto-terciario)">mdi-chevron-right</v-icon>
                </button>

                <button
                  class="tarjeta-opcion"
                  :class="{ 'tarjeta-opcion--pulsada': opcionPulsada === 'B' }"
                  @click="elegirCamino('B')"
                >
                  <v-icon size="28" color="var(--color-primario)">mdi-tune-variant</v-icon>
                  <div class="tarjeta-opcion__texto">
                    <span class="tarjeta-opcion__titulo">Tengo preferencias</span>
                    <span class="tarjeta-opcion__sub">Te guío hasta la receta ideal</span>
                  </div>
                  <v-icon size="18" color="var(--color-texto-terciario)">mdi-chevron-right</v-icon>
                </button>

                <button
                  class="tarjeta-opcion"
                  :class="{ 'tarjeta-opcion--pulsada': opcionPulsada === 'C' }"
                  @click="elegirCamino('C')"
                >
                  <v-icon size="28" color="var(--color-primario)">mdi-dice-multiple-outline</v-icon>
                  <div class="tarjeta-opcion__texto">
                    <span class="tarjeta-opcion__titulo">Sorpréndeme</span>
                    <span class="tarjeta-opcion__sub">Déjate llevar por el azar</span>
                  </div>
                  <v-icon size="18" color="var(--color-texto-terciario)">mdi-chevron-right</v-icon>
                </button>
              </div>
            </div>

            <hr class="home__separador" />

            <div class="home__crear">
              <p class="home__crear-label">¿Tienes una receta propia?</p>
              <button class="btn-crear-receta" @click="router.push('/crear')">
                <v-icon>mdi-plus</v-icon>
                <span>Nueva receta</span>
              </button>
            </div>
          </template>

          <!-- A_BUSCAR - Input de búsqueda -->
          <template v-else-if="pasoActual === Paso.A_BUSCAR">
            <div class="cabecera">
              <h1 class="titulo">¿Qué buscas?</h1>
              <p class="subtitulo">Por nombre, ingrediente o técnica</p>
            </div>

            <div class="input-wrapper">
              <v-icon class="input-icono" size="20" color="var(--color-texto-terciario)">mdi-magnify</v-icon>
              <input
                ref="refInputBusqueda"
                v-model="textoBusqueda"
                @input="onInputTexto"
                type="text"
                class="input-grande"
                placeholder="Ej: pollo, pasta, sin gluten..."
                autofocus
              />
              <v-progress-circular
                v-if="cargando"
                indeterminate
                color="var(--color-primario)"
                size="18"
                width="2"
                class="input-spinner"
              />
            </div>

            <!-- Resultados inline -->
            <Transition name="fade">
              <div v-if="resultados.length > 0" class="lista-resultados">
                <RecetaCard
                  v-for="receta in resultados.slice(0, 4)"
                  :key="receta.id"
                  :receta="receta"
                />
              </div>
            </Transition>

            <!-- Sin resultados -->
            <div
              v-if="textoBusqueda.trim().length >= 2 && !cargando && resultados.length === 0"
              class="sin-resultados"
            >
              <p class="sin-resultados__texto">Sin resultados exactos</p>
              <button class="boton-secundario" @click="ejecutarRecomendacionPorTexto">
                Buscar recetas parecidas →
              </button>
            </div>

            <!-- Botón "Ver resultados" -- solo si hay resultados -->
            <button
              v-if="resultados.length > 0"
              class="boton-primario btn-paso"
              @click="irA(Paso.A_RESULTADOS)"
            >
              Ver resultados
            </button>
          </template>

          <!-- A_RESULTADOS -->
          <template v-else-if="pasoActual === Paso.A_RESULTADOS">
            <div class="cabecera">
              <h1 class="titulo">Resultados</h1>
              <p class="subtitulo">{{ resultados.length }} receta{{ resultados.length !== 1 ? 's' : '' }} encontrada{{ resultados.length !== 1 ? 's' : '' }}</p>
            </div>

            <div v-if="criteriosRelajados" class="banner-relajado">
              <v-icon size="15" color="#E65100">mdi-information-outline</v-icon>
              Mostrando resultados aproximados
            </div>

            <div v-if="cargando" class="estado-carga">
              <v-progress-circular indeterminate color="var(--color-primario)" size="28" />
            </div>
            <div v-else class="lista-resultados lista-resultados--escalonada">
              <div
                v-for="(receta, i) in resultados.slice(0, cantidadMostradaA)"
                :key="receta.id"
                class="resultado-item"
                :style="{ animationDelay: `${i * 80}ms` }"
              >
                <RecetaCard :receta="receta" :destacada="i === 0" />
              </div>
            </div>

            <button
              v-if="resultados.length > cantidadMostradaA"
              class="boton-secundario btn-paso"
              @click="verMasResultadosA"
            >
              + ver más
            </button>

            <div v-if="error" class="texto-error">{{ error }}</div>

            <button class="boton-primario btn-paso" @click="volver">
              Nueva búsqueda
            </button>
          </template>

          <!-- B_CATEGORIA - Elige tipo de plato -->
          <template v-else-if="pasoActual === Paso.B_CATEGORIA">
            <div class="paso-wrapper--centrado-vertical">
              <div class="cabecera">
                <h1 class="titulo">¿Qué tipo de plato?</h1>
              </div>

              <div class="grid-2col grid-2col--ultimo-centrado">
                <button
                  v-for="op in OPCIONES_CATEGORIA"
                  :key="op.valor"
                  class="tarjeta-grid"
                  @click="elegirCategoria(op.valor)"
                >
                  <v-icon size="28" color="var(--color-primario)">{{ op.icono }}</v-icon>
                  <span class="tarjeta-grid__texto">{{ op.etiqueta }}</span>
                </button>
              </div>
            </div>
          </template>

          <!-- B_ESTILO - Elige estilo culinario -->
          <template v-else-if="pasoActual === Paso.B_ESTILO">
            <div class="cabecera">
              <h1 class="titulo">¿Qué estilo te apetece?</h1>
              <p class="subtitulo">Elige una cocina</p>
            </div>

            <div class="chip-contexto">
              <v-icon size="13" color="var(--color-primario)">mdi-silverware-fork-knife</v-icon>
              {{ etiquetaCategoria(categoriaSeleccionada) }}
            </div>

            <div class="grid-2col">
              <button
                v-for="op in OPCIONES_ESTILO"
                :key="op.valor"
                class="tarjeta-grid"
                @click="elegirEstilo(op.valor)"
              >
                <v-icon size="28" color="var(--color-primario)">{{ op.icono }}</v-icon>
                <span class="tarjeta-grid__texto">{{ op.etiqueta }}</span>
              </button>
            </div>
          </template>

          <!-- B_RESULTADOS - Resultado guiado -->
          <template v-else-if="pasoActual === Paso.B_RESULTADOS">
            <div class="cabecera">
              <h1 class="titulo">Tu selección</h1>
            </div>

            <div class="chips-resumen">
              <span v-if="estiloSeleccionado" class="chip-resumen">
                {{ etiquetaEstilo(estiloSeleccionado) }}
              </span>
              <span v-if="categoriaSeleccionada" class="chip-resumen">
                {{ etiquetaCategoria(categoriaSeleccionada) }}
              </span>
              <span v-for="tag in tagsSeleccionados" :key="tag" class="chip-resumen">
                {{ formatearTag(tag) }}
              </span>
            </div>

            <div v-if="criteriosRelajados" class="banner-relajado">
              <v-icon size="15" color="#E65100">mdi-information-outline</v-icon>
              No hay coincidencia exacta · Mostrando lo más cercano
            </div>

            <div v-if="cargando" class="estado-carga">
              <v-progress-circular indeterminate color="var(--color-primario)" size="28" />
            </div>
            <div v-else class="lista-resultados lista-resultados--escalonada">
              <div
                v-for="(receta, i) in resultados.slice(0, 4)"
                :key="receta.id"
                class="resultado-item"
                :style="{ animationDelay: `${i * 80}ms` }"
              >
                <RecetaCard :receta="receta" :destacada="i === 0" />
              </div>
            </div>

            <div v-if="error" class="texto-error">{{ error }}</div>

            <button class="boton-primario btn-paso" @click="cambiarPreferencias">
              Cambiar preferencias
            </button>
          </template>

          <!-- C_DIFICULTAD - Elige dificultad -->
          <template v-else-if="pasoActual === Paso.C_DIFICULTAD">
            <div class="paso-wrapper--centrado-vertical">
              <div class="cabecera">
                <h1 class="titulo">¿A qué nivel juegas?</h1>
                <p class="subtitulo">Elige la dificultad</p>
              </div>

              <div class="grid-2col">
                <button
                  v-for="op in OPCIONES_DIFICULTAD"
                  :key="op.valor"
                  class="tarjeta-grid tarjeta-grid--con-sub"
                  @click="elegirDificultad(op.valor)"
                >
                  <v-icon size="30" color="var(--color-primario)">{{ op.icono }}</v-icon>
                  <span class="tarjeta-grid__texto">{{ op.etiqueta }}</span>
                  <span class="tarjeta-grid__sub">{{ op.subtitulo }}</span>
                </button>
              </div>
            </div>
          </template>

          <!-- B_TAGS - Elige tags (camino B, paso 3) -->
          <template v-else-if="pasoActual === Paso.B_TAGS">
            <div class="cabecera">
              <h1 class="titulo">¿Alguna preferencia?</h1>
              <p class="subtitulo">Elige hasta 3 o pasa sin elegir</p>
            </div>

            <div class="chips-tags">          
              <span class="chip-contexto">
                <v-icon size="13" color="var(--color-primario)">mdi-silverware-fork-knife</v-icon>
                {{ etiquetaCategoria(categoriaSeleccionada) }}
              </span>
              <span class="chip-contexto">
                <v-icon size="13" color="var(--color-primario)">mdi-chef-hat</v-icon>
                {{ etiquetaEstilo(estiloSeleccionado) }}
              </span>
            </div>

            <div v-if="cargandoTags" class="chips-tags">
              <span v-for="i in 13" :key="i" class="chip-skeleton" />
            </div>

            <div v-else class="chips-tags">
              <button
                v-for="tag in tagsFrecuentes"
                :key="tag"
                class="chip-tag"
                :class="{ 'chip-tag--activo': tagsSeleccionados.includes(tag) }"
                :disabled="!tagsSeleccionados.includes(tag) && tagsSeleccionados.length >= 3"
                @click="toggleTag(tag)"
              >
                {{ formatearTag(tag) }}
              </button>

              <button class="chip-tag chip-tag--indiferente" @click="elegirIndiferente">
                <v-icon size="13">mdi-approximately-equal</v-icon>
                Indiferente
              </button>
            </div>

            <button
              class="boton-primario btn-paso"
              :disabled="cargando"
              @click="irResultadosB"
            >
              {{ cargando ? 'Buscando...' : 'Encontrar recetas' }}
            </button>
          </template>

          <!-- C_RESULTADOS - Sorpresa aleatoria -->
          <template v-else-if="pasoActual === Paso.C_RESULTADOS">
            <div class="cabecera">
              <div class="cabecera__con-icono">
                <v-icon size="22" color="var(--color-primario)">mdi-dice-multiple-outline</v-icon>
                <h1 class="titulo titulo--inline">Tu selección aleatoria</h1>
                <v-icon size="22" color="var(--color-primario)">mdi-dice-multiple-outline</v-icon>
              </div>
              <p class="subtitulo">Las recetas con mayor afinidad</p>
            </div>

            <div v-if="criteriosRelajados" class="banner-relajado">
              <v-icon size="15" color="#E65100">mdi-information-outline</v-icon>
              Mostrando lo más cercano a tu selección
            </div>

            <div v-if="cargando" class="estado-carga">
              <v-progress-circular indeterminate color="var(--color-primario)" size="28" />
            </div>
            <div v-else class="lista-resultados lista-resultados--escalonada">
              <div
                v-for="(receta, i) in resultados.slice(0, 4)"
                :key="receta.id"
                class="resultado-item"
                :style="{ animationDelay: `${i * 80}ms` }"
              >
                <RecetaCard :receta="receta" :destacada="i === 0" />
              </div>
            </div>

            <div v-if="error" class="texto-error">{{ error }}</div>

            <button class="boton-primario btn-paso" @click="ejecutarSorpresa">
              Otra ronda aleatoria
            </button>
          </template>

        </div>
      </Transition>
    </main>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import type { Receta } from '@/types'
import { useRecetaStore }        from '@/stores/receta.store'
import { useRecomendacionStore } from '@/stores/recomendacion.store'
import RecetaCard    from '@/components/RecetaCard.vue'
import AppHeader     from '@/components/AppHeader.vue'
import { formatearTag } from '@/utils/estiloUtils'
import { homeResetTrigger } from '@/composables/useHomeReset'

const router = useRouter()

// Stores
const recetaStore        = useRecetaStore()
const recomendacionStore = useRecomendacionStore()

// Typewriter
const FRASES: readonly string[] = [
  'Madrugador... ¿qué vas a preparar?',
  'Buenos días, ¿qué desayunamos hoy?',
  'Hora de comer, ¿qué cocinamos?',
  'Buenas tardes, ¿qué merendamos?',
  'Buenas noches, ¿qué cenamos?',
]

function indicePorHora(): number {
  const h = new Date().getHours()
  if (h <= 6)  return 0
  if (h <= 11) return 1
  if (h <= 15) return 2
  if (h <= 20) return 3
  return 4
}

const textoMostrado = ref<string>('')
const escribiendo   = ref<boolean>(true)
const indiceFrase   = ref<number>(indicePorHora())
let   timerTypewriter: ReturnType<typeof setTimeout> | null = null

function iniciarTypewriter(): void {
  const frase = FRASES[indiceFrase.value]
  let pos = 0
  escribiendo.value = true
  textoMostrado.value = ''

  function paso(): void {
    if (pos < frase.length) {
      textoMostrado.value = frase.slice(0, pos + 1)
      pos++
      timerTypewriter = setTimeout(paso, 40)
    } else {
      escribiendo.value = false
      timerTypewriter = setTimeout(() => {
        indiceFrase.value = (indiceFrase.value + 1) % FRASES.length
        iniciarTypewriter()
      }, 10000)
    }
  }

  paso()
}

// Enum de pasos
enum Paso {
  INICIO        = 'inicio',
  A_BUSCAR      = 'a_buscar',
  A_RESULTADOS  = 'a_resultados',
  B_ESTILO      = 'b_estilo',
  B_CATEGORIA   = 'b_categoria',
  B_TAGS        = 'b_tags',
  B_RESULTADOS  = 'b_resultados',
  C_DIFICULTAD  = 'c_dificultad',
  C_RESULTADOS  = 'c_resultados',
}

// Estado global del flujo
const pasoActual         = ref<Paso>(Paso.INICIO)
const historialPasos     = ref<Paso[]>([])
const caminoSeleccionado = ref<'A' | 'B' | 'C' | null>(null)
const opcionPulsada      = ref<'A' | 'B' | 'C' | null>(null)

// Camino A -- cuántas recetas de `resultados` se muestran en A_RESULTADOS ("+ ver más")
const cantidadMostradaA = ref(4)

// Selecciones del usuario
const estiloSeleccionado     = ref<string>('')
const categoriaSeleccionada  = ref<string>('')
const dificultadSeleccionada = ref<string>('')
const tagsSeleccionados      = ref<string[]>([])
const textoBusqueda          = ref<string>('')

// Resultados
const resultados         = ref<Receta[]>([])
const criteriosRelajados = ref<boolean>(false)
const cargando           = ref<boolean>(false)
const cargandoTags       = ref<boolean>(false)
const error              = ref<string | null>(null)

// Tags frecuentes para camino C
const tagsFrecuentes = ref<string[]>([])

// Ref del input de búsqueda (camino A)
const refInputBusqueda = ref<HTMLInputElement | null>(null)

// Navegación
function irA(paso: Paso): void {
  historialPasos.value.push(pasoActual.value)
  pasoActual.value = paso
}

function volver(): void {
  const anterior = historialPasos.value.pop()
  if (anterior !== undefined) pasoActual.value = anterior
}

// Dots de progreso
const totalDots = computed((): number => {
  switch (caminoSeleccionado.value) {
    case 'A': return 0
    case 'B': return 4
    case 'C': return 2
    default:  return 0
  }
})

const dotActivo = computed((): number => {
  switch (pasoActual.value) {
    case Paso.B_CATEGORIA:  return 1
    case Paso.B_ESTILO:     return 2
    case Paso.B_TAGS:       return 3
    case Paso.B_RESULTADOS: return 4
    case Paso.C_DIFICULTAD: return 1
    case Paso.C_RESULTADOS: return 2
    default:                return 0
  }
})

// Constantes de opciones
interface Opcion { valor: string; etiqueta: string; icono: string }
interface OpcionDificultad extends Opcion { subtitulo: string }

const OPCIONES_ESTILO: Opcion[] = [
  { valor: 'MEDITERRANEO', etiqueta: 'Mediterráneo', icono: 'mdi-waves' },
  { valor: 'LATINO',       etiqueta: 'Latino',       icono: 'mdi-leaf' },
  { valor: 'ASIATICO',     etiqueta: 'Asiático',     icono: 'mdi-yin-yang' },
  { valor: 'NORDICO',      etiqueta: 'Nórdico',      icono: 'mdi-snowflake' },
  { valor: 'FUSION',       etiqueta: 'Fusión',       icono: 'mdi-shuffle-variant' },
  { valor: '',             etiqueta: 'Cualquiera',   icono: 'mdi-all-inclusive' },
]

const OPCIONES_CATEGORIA: Opcion[] = [
  { valor: 'ENTRANTE',   etiqueta: 'Entrante',   icono: 'mdi-leaf-circle-outline' },
  { valor: 'PRINCIPAL',  etiqueta: 'Principal',  icono: 'mdi-silverware-fork-knife' },
  { valor: 'POSTRE',     etiqueta: 'Postre',     icono: 'mdi-cake-variant-outline' },
  { valor: 'APERITIVO',  etiqueta: 'Aperitivo',  icono: 'mdi-glass-wine' },
  { valor: 'CUALQUIERA', etiqueta: 'Cualquiera', icono: 'mdi-all-inclusive' },
]

const OPCIONES_DIFICULTAD: OpcionDificultad[] = [
  { valor: 'FACIL',      etiqueta: 'Fácil',     subtitulo: 'Rápido y sencillo',    icono: 'mdi-emoticon-outline' },
  { valor: 'MEDIA',      etiqueta: 'Media',      subtitulo: 'Algo de técnica',      icono: 'mdi-emoticon-neutral-outline' },
  { valor: 'DIFICIL',    etiqueta: 'Difícil',    subtitulo: 'Para chefs avanzados', icono: 'mdi-emoticon-devil-outline' },
  { valor: 'CUALQUIERA', etiqueta: 'Cualquiera', subtitulo: 'Sorpréndeme',          icono: 'mdi-all-inclusive' },
]

function etiquetaEstilo(valor: string): string {
  return OPCIONES_ESTILO.find(o => o.valor === valor)?.etiqueta ?? valor
}

function etiquetaCategoria(valor: string): string {
  if (valor === 'CUALQUIERA') return 'Cualquier plato'
  return OPCIONES_CATEGORIA.find(o => o.valor === valor)?.etiqueta ?? valor
}

// Acciones INICIO
function elegirCamino(camino: 'A' | 'B' | 'C'): void {
  opcionPulsada.value = camino
  caminoSeleccionado.value = camino

  if (camino === 'A') {
    setTimeout(() => {
      irA(Paso.A_BUSCAR)
      nextTick(() => refInputBusqueda.value?.focus())
    }, 120)
  } else if (camino === 'B') {
    setTimeout(() => irA(Paso.B_CATEGORIA), 120)
  } else {
    tagsSeleccionados.value = []
    setTimeout(() => irA(Paso.C_DIFICULTAD), 120)
  }
}

// Camino A - Búsqueda por texto
let debounceTimer: ReturnType<typeof setTimeout> | null = null

function onInputTexto(): void {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => ejecutarBusquedaTexto(), 400)
}

async function ejecutarBusquedaTexto(): Promise<void> {
  if (textoBusqueda.value.trim().length < 2) {
    resultados.value = []
    return
  }
  cantidadMostradaA.value = 4
  cargando.value = true
  error.value = null
  try {
    await recetaStore.buscar(textoBusqueda.value.trim())
    resultados.value = recetaStore.recetas
    criteriosRelajados.value = false
  } catch {
    error.value = 'Error al buscar'
  } finally {
    cargando.value = false
  }
}

function verMasResultadosA(): void {
  cantidadMostradaA.value = Math.min(cantidadMostradaA.value + 4, resultados.value.length)
}

async function ejecutarRecomendacionPorTexto(): Promise<void> {
  cargando.value = true
  error.value = null
  try {
    const tags = textoBusqueda.value
      .split(' ')
      .map(t => t.trim())
      .filter(t => t.length > 2)
    await recomendacionStore.recomendar({
      categoria: 'PRINCIPAL',
      tags_preferidos: tags.length > 0 ? tags : undefined,
    })
    const r = recomendacionStore.resultado
    if (r) {
      resultados.value = [r.principal, ...r.alternativas].slice(0, 4)
      criteriosRelajados.value = r.criterios_relajados
    }
  } finally {
    cargando.value = false
    irA(Paso.A_RESULTADOS)
  }
}

// Camino B - Preferencias guiadas
function elegirCategoria(valor: string): void {
  tagsFrecuentes.value = []
  categoriaSeleccionada.value = valor
  irA(Paso.B_ESTILO)
}

function elegirEstilo(valor: string): void {
  tagsFrecuentes.value = []
  estiloSeleccionado.value = valor
  cargarTagsFrecuentes()
  irA(Paso.B_TAGS)
}

async function ejecutarPreferencias(): Promise<void> {
  cargando.value = true
  error.value = null
  criteriosRelajados.value = false
  try {
    const categoriaEfectiva =
      categoriaSeleccionada.value && categoriaSeleccionada.value !== 'CUALQUIERA'
        ? categoriaSeleccionada.value
        : 'PRINCIPAL'

    if (!categoriaSeleccionada.value || categoriaSeleccionada.value === 'CUALQUIERA') {
      criteriosRelajados.value = true
    }

    const params: { categoria: string; estilo?: string; tags_preferidos?: string[] } = {
      categoria: categoriaEfectiva,
    }
    if (estiloSeleccionado.value) params.estilo = estiloSeleccionado.value
    if (tagsSeleccionados.value.length > 0) params.tags_preferidos = tagsSeleccionados.value

    await recomendacionStore.recomendar(params)
    const r = recomendacionStore.resultado
    if (r) {
      resultados.value = [r.principal, ...r.alternativas].slice(0, 4)
      criteriosRelajados.value = criteriosRelajados.value || r.criterios_relajados
    } else {
      resultados.value = []
    }
  } catch {
    error.value = 'No se pudo obtener recomendación'
    resultados.value = []
  } finally {
    cargando.value = false
  }
}

function irResultadosB(): void {
  irA(Paso.B_RESULTADOS)
  ejecutarPreferencias()
}

// Camino C - Sorpresa aleatoria
function elegirDificultad(valor: string): void {
  dificultadSeleccionada.value = valor
  irA(Paso.C_RESULTADOS)
  ejecutarSorpresa()
}

function toggleTag(tag: string): void {
  const idx = tagsSeleccionados.value.indexOf(tag)
  if (idx !== -1) {
    tagsSeleccionados.value.splice(idx, 1)
  } else if (tagsSeleccionados.value.length < 3) {
    tagsSeleccionados.value.push(tag)
  }
}

function elegirIndiferente(): void {
  tagsSeleccionados.value = []
  irResultadosB()
}

async function ejecutarSorpresa(): Promise<void> {
  cargando.value = true
  error.value = null
  criteriosRelajados.value = false
  try {
    const categorias = ['ENTRANTE', 'PRINCIPAL', 'POSTRE', 'APERITIVO'] as const
    const categoriaRandom = categorias[Math.floor(Math.random() * categorias.length)]

    const params: { categoria: string; tags_preferidos?: string[] } = {
      categoria: categoriaRandom,
    }
    if (tagsSeleccionados.value.length > 0) {
      params.tags_preferidos = tagsSeleccionados.value
    }

    await recomendacionStore.recomendar(params)
    const r = recomendacionStore.resultado
    if (r) {
      let lista: Receta[] = [r.principal, ...r.alternativas]

      if (dificultadSeleccionada.value && dificultadSeleccionada.value !== 'CUALQUIERA') {
        const filtradas = lista.filter(rec => rec.dificultad === dificultadSeleccionada.value)
        if (filtradas.length >= 2) {
          lista = filtradas
        } else {
          criteriosRelajados.value = true
        }
      }

      resultados.value = lista.slice(0, 4)
      criteriosRelajados.value = criteriosRelajados.value || r.criterios_relajados
    } else {
      resultados.value = []
    }
  } catch {
    error.value = 'No se pudo obtener recomendación'
  } finally {
    cargando.value = false
  }
}

async function cargarTagsFrecuentes(): Promise<void> {
  if (tagsFrecuentes.value.length > 0) return
  cargandoTags.value = true
  try {
    await recetaStore.cargarCatalogo()
    const frecuencia = new Map<string, number>()
    recetaStore.recetas
      .filter(r => {
        if (categoriaSeleccionada.value && categoriaSeleccionada.value !== 'CUALQUIERA' && r.categoria_menu !== categoriaSeleccionada.value) return false
        if (estiloSeleccionado.value && r.estilo_culinario !== estiloSeleccionado.value) return false
        return true
      })
      .forEach(r => {
        r.tags.forEach(tag => {
          frecuencia.set(tag, (frecuencia.get(tag) ?? 0) + 1)
        })
      })
    tagsFrecuentes.value = [...frecuencia.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 13)
      .map(([tag]) => tag)
  } catch {
    tagsFrecuentes.value = []
  } finally {
    cargandoTags.value = false
  }
}

// Reinicio total
function resetearFlujo(): void {
  pasoActual.value             = Paso.INICIO
  historialPasos.value         = []
  caminoSeleccionado.value     = null
  opcionPulsada.value          = null
  estiloSeleccionado.value     = ''
  categoriaSeleccionada.value  = ''
  dificultadSeleccionada.value = ''
  tagsSeleccionados.value      = []
  textoBusqueda.value          = ''
  resultados.value             = []
  criteriosRelajados.value     = false
  error.value                  = null
  cantidadMostradaA.value      = 4
}

// Camino B -- "Cambiar preferencias" desde B_RESULTADOS: vuelve a B_CATEGORIA
// (paso 1) en vez de al paso inmediatamente anterior (B_TAGS), limpiando las
// selecciones de esa vuelta para que el usuario rehaga el camino desde cero.
function cambiarPreferencias(): void {
  historialPasos.value = [Paso.INICIO]
  pasoActual.value = Paso.B_CATEGORIA
  categoriaSeleccionada.value = ''
  estiloSeleccionado.value = ''
  tagsSeleccionados.value = []
  tagsFrecuentes.value = []
}

// Reset forzado desde el botón Home del footer (App.vue)
watch(homeResetTrigger, () => {
  if (homeResetTrigger.value > 0) resetearFlujo()
})

// Lifecycle
onMounted(() => {
  iniciarTypewriter()
})

onUnmounted(() => {
  if (timerTypewriter) clearTimeout(timerTypewriter)
})
</script>

<style scoped>
/* -- Contenedor raíz ------------------------------------------------------------ */
.home {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}

/* -- Frase dinámica ------------------------------------------------------------- */
.home__frase {
  text-align: center;
  padding: 1rem 1.25rem 0.5rem;
  min-height: 4rem;
}

.home__typewriter {
  font-size: var(--texto-lg);
  font-weight: 700;
  color: var(--color-texto-principal);
  line-height: 1.3;
  margin: 10px 0;
}

.cursor {
  display: inline-block;
  color: var(--color-primario);
  font-weight: 400;
  animation: parpadeo 0.75s step-end infinite;
  margin-left: 1px;
}

@keyframes parpadeo {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}

/* -- Navegación de pasos -------------------------------------------------------- */
.home__nav-pasos {
    display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
}

.btn-volver {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border: none;
  border-radius: 12px;
  background: var(--color-superficie);
  box-shadow: var(--tarjeta-sombra);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.15s;
}
.btn-volver:active { transform: scale(0.93); }

/* -- Dots de progreso ----------------------------------------------------------- */
.dots {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #DDDDDD;
  transition: width 250ms ease, background 250ms ease, border-radius 250ms ease;
  flex-shrink: 0;
}

.dot--activo {
  width: 40px;
  border-radius: 4px;
  background: var(--color-primario);
}

/* -- Contenido principal -------------------------------------------------------- */
.home__contenido {
  flex: 1;
  padding: 0 1.25rem;
}

/* .home__contenido es flex item de .home (columna) -- su altura resuelta por
   flex-layout cuenta como "definida" para que height:100% de sus hijos funcione. */
.paso-wrapper {
  height: 100%;
}

/* Modificador opcional para centrar verticalmente el contenido de un paso
   dentro del espacio disponible. Requiere el height:100% de .paso-wrapper de
   arriba para tener margen real que repartir -- sin eso, justify-content:center
   no tendría ningún efecto porque el contenedor mediría exactamente lo que su
   contenido. Se aplica hoy solo en B_CATEGORIA; reutilizable en otros pasos. */
.paso-wrapper--centrado-vertical {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 100%;
}

/* -- Animación entre pasos ------------------------------------------------------ */
.paso-enter-active { transition: all 260ms ease-out; }
.paso-leave-active { transition: all 180ms ease-in; }
.paso-enter-from   { opacity: 0; transform: translateY(14px); }
.paso-leave-to     { opacity: 0; transform: translateY(-6px); }

/* -- Fade para resultados inline ------------------------------------------------ */
.fade-enter-active { transition: opacity 200ms ease; }
.fade-leave-active { transition: opacity 150ms ease; }
.fade-enter-from,
.fade-leave-to     { opacity: 0; }

/* -- Sección descubrir (INICIO) ------------------------------------------------- */
.home__descubrir {
  padding-top: 1rem;
}

.home__descubrir-label {
  text-align: center;
  font-size: var(--texto-md);
  color: var(--color-terciario, #888);
  margin: 0.75rem;
}

/* -- Separador + botón crear (INICIO) ------------------------------------------- */
.home__separador {
  border: none;
  border-top: 1px solid var(--color-borde, #e8e0d8);
  margin: 2rem 0;
}

.home__crear {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 10px;
}

.home__crear-label {
  font-size: var(--texto-md);
  color: var(--color-texto-terciario);
  text-align: center;
  margin-bottom: 0.5rem;
}

.btn-crear-receta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: var(--color-primario);
  border: none;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  color: #FFFFFF;
  font-size: var(--texto-base);
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  box-shadow: 0 2px 8px rgba(200, 98, 34, 0.25);
}

/* -- Cabeceras de pasos --------------------------------------------------------- */
.cabecera {
  padding-bottom: 2rem;
  margin-bottom: var(--espacio-xl);
}

.titulo {
  font-size: var(--texto-2xl);
  font-weight: 800;
  text-align: center;
  color: var(--color-texto-principal);
  margin: 0 0 var(--espacio-xs);
  line-height: 1.2;
}

.titulo--inline {
  margin: 0;
}

.subtitulo {
  font-size: var(--texto-sm);
  color: var(--color-texto-secundario);
  margin: 0;
  text-align: center;
}

.cabecera__con-icono {
  display: flex;
  align-items: center;
  justify-items: space-between;
  gap: var(--espacio-sm);
  margin-bottom: var(--espacio-xs);
}

/* -- Tarjetas de opción (INICIO) ------------------------------------------------ */
.opciones-lista {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-md);
}

.tarjeta-opcion {
  width: 100%;
  background: var(--color-superficie);
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 2px solid transparent;
  padding: 1.5rem 1.5rem;
  display: flex;
  align-items: center;
  gap: var(--espacio-md);
  cursor: pointer;
  text-align: left;
  transition: transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease;
}

.tarjeta-opcion:active,
.tarjeta-opcion--pulsada {
  transform: scale(0.97);
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
  border-color: var(--color-primario);
}

.tarjeta-opcion__texto {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: center;
}

.tarjeta-opcion__titulo {
  font-size: var(--texto-md);
  font-weight: 700;
  color: var(--color-texto-principal);
}

.tarjeta-opcion__sub {
  font-size: var(--texto-sm);
  color: var(--color-texto-secundario);
}

/* -- Input de búsqueda (camino A) ----------------------------------------------- */
.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: var(--espacio-md);
}

.input-icono {
  position: absolute;
  left: 14px;
  pointer-events: none;
}

.input-grande {
  width: 100%;
  height: 52px;
  border: 1.5px solid #E0E0E0;
  border-radius: 16px;
  padding: 0 44px 0 44px;
  font-size: var(--texto-md);
  color: var(--color-texto-principal);
  background: var(--color-superficie);
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s;
  text-align: center;
}

.input-grande:focus {
  border-color: var(--color-primario);
  border-width: 2px;
}

.input-spinner {
  position: absolute;
  right: 14px;
}

/* -- Sin resultados ------------------------------------------------------------- */
.sin-resultados {
  text-align: center;
  padding: var(--espacio-lg) 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--espacio-md);
}

.sin-resultados__texto {
  font-size: var(--texto-base);
  color: var(--color-texto-secundario);
  margin: 0;
}

.boton-secundario {
  background: none;
  border: 1.5px solid var(--color-primario);
  color: var(--color-primario);
  border-radius: var(--boton-radio);
  padding: 0 var(--espacio-lg);
  height: var(--boton-altura);
  font-size: var(--texto-base);
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.boton-secundario:hover { background: var(--color-primario-suave); }

/* -- Grid 2 columnas (estilos, categorías, dificultad) -------------------------- */
.grid-2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--espacio-md);
  margin-bottom: var(--espacio-md);
}

.grid-2col--ultimo-centrado > :last-child:nth-child(odd) {
  grid-column: 1 / -1;
  max-width: calc(50% - var(--espacio-md) / 2);
  justify-self: center;
}

.tarjeta-grid {
  background: var(--color-superficie);
  border-radius: 16px;
  box-shadow: var(--tarjeta-sombra);
  border: none;
  padding: var(--espacio-md) var(--espacio-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--espacio-sm);
  cursor: pointer;
  transition: transform 150ms ease, box-shadow 150ms ease;
}
.tarjeta-grid:active {
  transform: scale(0.95);
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
}

.tarjeta-grid__texto {
  font-size: var(--texto-base);
  font-weight: 600;
  color: var(--color-texto-principal);
  text-align: center;
}

.tarjeta-grid__sub {
  font-size: var(--texto-sm);
  color: var(--color-texto-secundario);
  text-align: center;
}

/* -- Chip de contexto (B_CATEGORIA) -------------------------------------------- */
.chip-contexto {
  display: flex;
  flex-wrap: wrap;
  width: fit-content;
  margin: 0 auto var(--espacio-md);
  align-items: center;
  gap: 4px;
  background: var(--color-primario-suave);
  color: var(--color-primario);
  border-radius: 20px;
  padding: 5px 12px;
  font-size: var(--texto-xs);
  font-weight: 700;
  border: 1px solid currentColor;
}

/* -- Chips resumen (B_RESULTADOS) ----------------------------------------------- */
.chips-resumen {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  gap: var(--espacio-sm);
  margin-bottom: var(--espacio-md);
}

.chip-resumen {
  background: var(--color-primario-suave);
  color: var(--color-primario);
  border-radius: 20px;
  padding: 5px 14px;
  font-size: var(--texto-sm);
  font-weight: 700;
  border: 1px solid currentColor;
}

/* -- Banner criterios relajados ------------------------------------------------- */
.banner-relajado {
  display: flex;
  align-items: center;
  gap: var(--espacio-xs);
  background: #FFF3E0;
  color: #E65100;
  border-radius: 10px;
  padding: var(--espacio-sm) var(--espacio-md);
  font-size: var(--texto-sm);
  font-weight: 500;
  margin-bottom: var(--espacio-md);
}

/* -- Chips de tags (camino C) --------------------------------------------------- */
.chips-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  gap: var(--espacio-sm);
  margin-bottom: var(--espacio-lg);
}

.chip-tag {
  background: var(--color-primario-suave);
  color: var(--color-primario);
  border: 1px solid currentColor;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: var(--texto-xs);
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, opacity 0.15s;
}
.chip-tag--activo {
  background: var(--color-primario);
  color: #ffffff;
}
.chip-tag:disabled {
  opacity: 0.35;
  cursor: default;
}

.chip-tag--indiferente {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #F0F0F0;
  color: var(--color-texto-secundario);
}
.chip-tag--indiferente:hover { background: #E5E5E5; }

/* Skeleton shimmer para tags pendientes */
.chip-skeleton {
  display: inline-block;
  width: 72px;
  height: 34px;
  border-radius: 20px;
  background: linear-gradient(90deg, #EEEEEE 25%, #E0E0E0 50%, #EEEEEE 75%);
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite;
}

@keyframes shimmer {
  from { background-position: 200% 0; }
  to   { background-position: -200% 0; }
}

/* -- Lista de resultados -------------------------------------------------------- */
.lista-resultados {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-sm);
  margin-bottom: var(--espacio-md);
}

.lista-resultados--escalonada .resultado-item {
  opacity: 0;
  animation: aparecer 280ms ease-out forwards;
}

.resultado-item {
  width: 100%;
}

@keyframes aparecer {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* -- Estado de carga ------------------------------------------------------------ */
.estado-carga {
  display: flex;
  justify-content: center;
  padding: var(--espacio-xl) 0;
  margin-bottom: var(--espacio-md);
}

/* -- Texto de error ------------------------------------------------------------- */
.texto-error {
  font-size: var(--texto-sm);
  color: var(--color-error);
  text-align: center;
  padding: var(--espacio-sm) 0;
}

/* -- Botón de acción del paso --------------------------------------------------- */
.btn-paso {
  margin-top: var(--espacio-xs);
}

.btn-paso:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
