<template>
  <div class="crear-fondo">

    <!-- -- Header sticky ------------------------------------------------------- -->
    <header class="header-crear">
      <button class="btn-nav" :aria-label="labelVolver" @click="volver">
        <v-icon size="20" color="var(--color-texto-principal)">mdi-arrow-left</v-icon>
      </button>
      <span
        v-if="!editandoTitulo"
        class="header-titulo"
        @dblclick="editandoTitulo = true"
        @touchstart="dobleToqueTitulo($event)"
      >{{ titulo || 'Nueva receta' }}</span>
      <input
        v-else
        v-focus
        v-model="titulo"
        class="header-titulo-input"
        type="text"
        @blur="editandoTitulo = false"
        @keydown.enter.prevent="editandoTitulo = false"
        @keydown.escape.prevent="editandoTitulo = false"
      />
      <div class="header-meta">
        <span v-if="pasoActual !== Paso.TITULO && tiempoTotal > 0" class="chip-tiempo">
          <v-icon size="12" color="var(--color-texto-secundario)">mdi-clock-outline</v-icon>
          {{ tiempoTotal }} min
        </span>
      </div>
    </header>

    <!-- -- Contenido animado entre pasos --------------------------------------- -->
    <Transition name="paso" mode="out-in">
      <div :key="pasoActual" class="paso-wrapper">

        <!-- Paso 1 - Título -->

        <template v-if="pasoActual === Paso.TITULO">
          <div class="paso-contenido">
            <h1 class="paso-pregunta">¿Cómo se llama tu receta?</h1>
            <p class="paso-ayuda">Dale un nombre que invite a cocinarla</p>
            <div class="input-titulo-wrapper">
              <input
                v-model="titulo"
                class="input-titulo"
                :class="{ 'input--error': errorTitulo }"
                type="text"
                placeholder="ej: Paella valenciana de la abuela"
                maxlength="200"
                autofocus
                @keydown.enter="avanzarDesdeTitulo"
                @input="errorTitulo = ''"
              />
              <span v-if="errorTitulo" class="campo-error">{{ errorTitulo }}</span>
            </div>
            <div class="paso-acciones">
              <button
                class="boton-primario btn-accion"
                @click="avanzarDesdeTitulo"
              >
                Continuar
              </button>
            </div>
          </div>
        </template>

        
             <!--PASO 2 - CONSTRUCTOR DE BLOQUES-->
        <template v-else-if="pasoActual === Paso.BLOQUES">
          <div class="bloques-contenedor">

            <!-- Indicador modo edición -->
            <p v-if="modoEdicion" class="modo-edicion-label">Editando receta existente</p>

            <!-- Lista de bloques -->
            <div class="bloques-lista">
              <div v-for="(bloque, i) in bloques" :key="i">
                <div
                  :ref="(el) => { bloquesRefs[i] = el as HTMLElement }"
                  class="bloque-item"
                  :class="{ 'input--error': mostrarErroresBloques && bloque.tipo !== 'FIN' && bloque.contenido.trim().length < 10 }"
                  @touchend="onBloqueTouchEnd($event, i)"
                  @dblclick="onBloqueDblClick(i)"
                >
                  <BloqueConstructor
                    :bloque="bloque"
                    :es-fijo="bloque.tipo === 'FIN'"
                    :esta-arrastrando="drag.indiceDrag.value === i"
                    :es-destino="drag.indiceDestino.value === i && drag.indiceDrag.value !== i"
                    @iniciar-drag="(e) => drag.onPointerDown(e, i)"
                  />
                </div>
                <span
                  v-if="mostrarErroresBloques && bloque.tipo !== 'FIN' && bloque.contenido.trim().length < 10"
                  class="campo-error"
                >Añade más contenido a este paso (mínimo 10 caracteres)</span>
              </div>
            </div>

            <!-- Botón "+" añadir bloque -->
            <button class="btn-agregar" aria-label="Añadir paso" @click="panelTiposAbierto = true">
              <v-icon size="24" color="white">mdi-plus</v-icon>
            </button>
            <span v-if="mostrarAvisoSinBloques" class="campo-error aviso-sin-bloques">
              Añade al menos un bloque de preparación
            </span>

            <!-- Pie: navegación -->
            <div class="bloques-pie">
              <button class="boton-primario btn-accion" @click="avanzarDesdeBloques">
                Siguiente
              </button>
            </div>
          </div>

          <!-- Panel: selección de tipo de bloque -->
          <BottomSheet :visible="panelTiposAbierto" @cerrar="panelTiposAbierto = false">
            <p class="panel-titulo">Añadir paso</p>
            <div class="panel-tipos">
              <button
                v-for="tipo in TIPOS_DISPONIBLES"
                :key="tipo.valor"
                class="tipo-opcion"
                @click="agregarBloque(tipo.valor)"
              >
                <span class="tipo-icono-wrap" :style="{ background: tipo.acento }">
                  <v-icon size="22" color="var(--color-texto-secundario)">{{ tipo.icono }}</v-icon>
                </span>
                <span class="tipo-label">{{ tipo.etiqueta }}</span>
                <v-icon size="18" color="var(--color-texto-terciario)">mdi-chevron-right</v-icon>
              </button>
            </div>
          </BottomSheet>

          <!-- Panel: editor de bloque (doble-tap) -->
          <BottomSheet :visible="bloqueEditandoIndice !== null" @cerrar="cerrarEditorBloque">
            <p class="panel-titulo">Editar paso</p>
            <div class="editor-campo">
              <label class="editor-label">Tiempo estimado (minutos)</label>
              <input
                v-model.number="editTiempo"
                class="input-campo input-base"
                type="number"
                min="5"
                step="5"
                placeholder="Opcional"
              />
            </div>
            <div class="editor-campo">
              <label class="editor-label">Descripción del paso</label>
              <textarea class="input-campo descripcion"
                v-model="editContenido"
                placeholder="Describe con detalle qué hacer en este paso..."
                rows="5"
              />
            </div>
            <div class="panel-acciones-editor">
              <button class="btn-cancelar" @click="cerrarEditorBloque">Cancelar</button>
              <button class="boton-primario btn-accion" @click="guardarEdicionBloque">Guardar</button>
            </div>
          </BottomSheet>
        </template>

             <!--PASO 3 - METADATOS -->
        <template v-else-if="pasoActual === Paso.METADATOS">
          <div class="meta-contenedor">

            <!-- Categoría -->
            <section class="meta-seccion">
              <h2 class="meta-label seccion-label">Categoría <span class="meta-label-req">*</span></h2>
              <div class="chips-row chips-row--scroll">
                <button
                  v-for="op in OPCIONES_CATEGORIA"
                  :key="op.valor"
                  class="chip-seleccion"
                  :class="{ 'chip-seleccion--activo': categoriaMenu === op.valor }"
                  @click="categoriaMenu = op.valor; errores.categoriaMenu = ''"
                >
                  <v-icon size="14">{{ op.icono }}</v-icon>
                  {{ op.etiqueta }}
                </button>
              </div>
              <span v-if="errores.categoriaMenu" class="campo-error">{{ errores.categoriaMenu }}</span>
            </section>

            <!-- Dificultad -->
            <section class="meta-seccion">
              <h2 class="meta-label seccion-label">Dificultad <span class="meta-label-req">*</span></h2>
              <div class="chips-row chips-row--scroll">
                <button
                  v-for="op in OPCIONES_DIFICULTAD"
                  :key="op.valor"
                  class="chip-seleccion"
                  :class="[
                    { 'chip-seleccion--activo': dificultad === op.valor },
                    `chip-dif--${op.valor.toLowerCase()}`
                  ]"
                  @click="dificultad = op.valor; errores.dificultad = ''"
                >
                  {{ op.etiqueta }}
                </button>
              </div>
              <span v-if="errores.dificultad" class="campo-error">{{ errores.dificultad }}</span>
            </section>

            <!-- Estilo culinario -->
            <section class="meta-seccion">
              <h2 class="meta-label seccion-label">Estilo culinario <span class="meta-label-req">*</span></h2>
              <div class="chips-row chips-row--scroll">
                <button
                  v-for="op in OPCIONES_ESTILO"
                  :key="op.valor"
                  class="chip-seleccion chip-estilo"
                  :style="estilo === op.valor
                    ? { background: op.fondoActivo, color: op.colorActivo, borderColor: op.colorActivo }
                    : {}"
                  @click="estilo = op.valor; errores.estilo = ''"
                >
                  <v-icon
                    size="14"
                    :color="estilo === op.valor ? op.colorActivo : 'var(--color-texto-terciario)'"
                  >{{ op.icono }}</v-icon>
                  {{ op.etiqueta }}
                </button>
              </div>
              <span v-if="errores.estilo" class="campo-error">{{ errores.estilo }}</span>
            </section>

            <!-- Modo de preparación -->
            <section class="meta-seccion">
              <h2 class="meta-label seccion-label">Modo de preparación <span class="meta-label-req">*</span></h2>
              <div class="chips-row chips-row--scroll chips-row--centro">
                <button
                  v-for="op in OPCIONES_MODO"
                  :key="op.valor"
                  class="chip-seleccion"
                  :class="{ 'chip-seleccion--activo': modoPreparacion === op.valor }"
                  @click="modoPreparacion = op.valor; errores.modoPreparacion = ''"
                >
                  <v-icon size="14">{{ op.icono }}</v-icon>
                  {{ op.etiqueta }}
                </button>
              </div>
              <span v-if="errores.modoPreparacion" class="campo-error">{{ errores.modoPreparacion }}</span>
            </section>

            <!-- Ingredientes -->
            <section class="meta-seccion">
              <h2 class="meta-label seccion-label">Ingredientes <span class="meta-label-req">*</span></h2>
              <div class="ingredientes-input-row">
                <input
                  v-model="inputIngrediente"
                  class="input-campo input-base"
                  :class="{ 'input--error': errores.ingredientesTexto }"
                  type="text"
                  placeholder="ej: 200g de harina"
                  @keydown.enter.prevent="agregarLineaIngrediente"
                />
                <button type="button" class="btn-añadir" @click="agregarLineaIngrediente">+</button>
              </div>
              <ul v-if="listaIngredientes.length" class="ingredientes-lista-creacion">
                <li
                  v-for="(item, i) in listaIngredientes"
                  :key="i"
                  class="ingrediente-linea"
                >
                  <span class="ingrediente-barra" />
                  <span class="ingrediente-texto">{{ item }}</span>
                  <button
                    type="button"
                    class="ingrediente-borrar"
                    @click="listaIngredientes.splice(i, 1)"
                    title="Eliminar"
                  >×</button>
                </li>
              </ul>
              <span v-if="errores.ingredientesTexto" class="campo-error">{{ errores.ingredientesTexto }}</span>
            </section>

            <!-- Tags -->
            <section class="meta-seccion">
              <h2 class="meta-label seccion-label">Tags <span class="meta-label-req">*</span></h2>
              <div v-if="tags.length" class="chips-lista">
                <span v-for="(tag, i) in tags" :key="i" class="chip-item chip-item--tag">
                  {{ formatearTag(tag) }}
                  <button class="chip-quitar" @click="quitarTag(i)" aria-label="Quitar">×</button>
                </span>
              </div>
              <div class="input-add-row">
                <input
                  v-model="tagInput"
                  class="input-campo input-base input-add"
                  :class="{ 'input--error': errores.tags }"
                  type="text"
                  list="sugerencias-tags-list"
                  placeholder="ej: horno, vegano..."
                  @keydown.enter.prevent="agregarTag"
                />
                <datalist id="sugerencias-tags-list">
                  <option v-for="sug in sugerenciasTags" :key="sug" :value="sug" />
                </datalist>
                <button
                  class="btn-add"
                  :disabled="!tagInput.trim()"
                  @click="agregarTag"
                  aria-label="Añadir tag"
                >
                  <v-icon size="18" color="white">mdi-plus</v-icon>
                </button>
              </div>
              <span v-if="errores.tags" class="campo-error">{{ errores.tags }}</span>
            </section>

            <!-- Acciones finales -->
            <div class="meta-acciones">
              <span v-if="errores.tiempoTotal" class="campo-error">{{ errores.tiempoTotal }}</span>
              <button
                class="boton-primario btn-accion"
                @click="avanzarDesdeMetadatos"
              >
                Siguiente
              </button>
            </div>

          </div>
        </template>

        <!-- PASO 4 - VISTA PREVIA -->
        <template v-else-if="pasoActual === Paso.PREVIA">
          <PrevisualizacionReceta
            :titulo="titulo"
            :ingredientes-texto="ingredientesTexto"
            :bloques="bloques"
            :categoria-menu="categoriaMenu"
            :dificultad="dificultad"
            :estilo="estilo"
            :modo-preparacion="modoPreparacion"
            :tags="tags"
            :tiempo-total="tiempoTotal"
          />
          <!-- Botón circular de publicar / guardar cambios (sticky sobre el contenido) -->
          <div class="previa-acciones">
            <button
              class="btn-publicar"
              :disabled="guardando"
              :aria-label="modoEdicion ? 'Guardar cambios' : 'Publicar receta'"
              @click="guardarReceta"
            >
              <v-icon v-if="!guardando" size="28" color="white">mdi-check</v-icon>
              <v-progress-circular v-else indeterminate color="white" size="22" width="3" />
            </button>
            <span class="previa-accion-label">
              {{ guardando ? 'Guardando...' : (modoEdicion ? 'Guardar cambios' : 'Publicar receta') }}
            </span>
          </div>
        </template>

      </div>
    </Transition>

    <!-- Ghost del bloque arrastrado (posición fija, sigue el pointer) -->
    <div
      v-if="drag.indiceDrag.value !== null && bloqueFantasma"
      class="bloque-ghost"
      :style="{
        left: drag.ghostX.value - 22 + 'px',
        top:  drag.ghostY.value - 22 + 'px',
        background: infoTipoAcento(bloqueFantasma.tipo),
      }"
    >
      <v-icon size="20" color="var(--color-texto-secundario)">
        {{ infoTipoIcono(bloqueFantasma.tipo) }}
      </v-icon>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter, useRoute }      from 'vue-router'
import { useRecetaStore } from '@/stores/receta.store'
import { useDragBloques }  from '@/composables/useDragBloques'
import { useDobleToque }  from '@/composables/useDobleToque'
import { mostrarToast }   from '@/composables/useToast'
import { useAsyncAction } from '@/composables/useAsyncAction'
import type { BloqueEnConstruccion, TipoBloque } from '@/types'
import BloqueConstructor      from '@/components/BloqueConstructor.vue'
import BottomSheet            from '@/components/BottomSheet.vue'
import PrevisualizacionReceta from '@/components/PrevisualizacionReceta.vue'
import { formatearTag }       from '@/utils/estiloUtils'

const router      = useRouter()
const route       = useRoute()
const recetaStore = useRecetaStore()
const { ejecutar } = useAsyncAction()

// Modo edición (?editar=:id)
const modoEdicion = computed(() => !!route.query['editar'])
const idEdicion   = computed(() => modoEdicion.value ? Number(route.query['editar']) : null)

// Pasos
enum Paso { TITULO = 'TITULO', BLOQUES = 'BLOQUES', METADATOS = 'METADATOS', PREVIA = 'PREVIA' }
const pasoActual = ref<Paso>(Paso.TITULO)


const labelVolver = computed(() =>
  pasoActual.value === Paso.TITULO && !modoEdicion.value ? 'Cancelar' : 'Volver'
)

function volver(): void {
  switch (pasoActual.value) {
    case Paso.TITULO:
      if (modoEdicion.value) pasoActual.value = Paso.BLOQUES
      else router.push('/')
      break
    case Paso.BLOQUES:
      if (modoEdicion.value) router.back()
      else pasoActual.value = Paso.TITULO
      break
    case Paso.METADATOS:
      pasoActual.value = Paso.BLOQUES
      break
    case Paso.PREVIA:
      pasoActual.value = Paso.METADATOS
      break
  }
}

// Paso 1: Título
const titulo         = ref('')
const editandoTitulo = ref(false)
const errorTitulo    = ref('')
const { manejarTouchStart: dobleToqueTitulo } = useDobleToque(() => { editandoTitulo.value = true })

// Directiva local para auto-enfocar el input inline del header
const vFocus = { mounted: (el: HTMLElement) => el.focus() }

// Doble-tap sobre el tag de nombre en el header (solo en modo edición)

function avanzarDesdeTitulo(): void {
  if (!titulo.value.trim()) {
    errorTitulo.value = 'Introduce un título para la receta.'
    mostrarToast('Error: revisar los campos marcados', 'error')
    return
  }
  if (titulo.value.trim().length < 3) {
    errorTitulo.value = 'El título debe tener al menos 3 caracteres.'
    mostrarToast('Error: revisar los campos marcados', 'error')
    return
  }
  pasoActual.value = Paso.BLOQUES
}

// Paso 2: Bloques

interface TipoOpc {
  valor: TipoBloque
  etiqueta: string
  icono: string
  acento: string
}

const TIPOS_DISPONIBLES: TipoOpc[] = [
  { valor: 'PREPARAR', etiqueta: 'Preparar', icono: 'mdi-knife',             acento: '#E8F5E9' },
  { valor: 'ELABORAR', etiqueta: 'Elaborar', icono: 'mdi-bowl-mix-outline',  acento: '#FFF8E1' },
  { valor: 'COCINAR',  etiqueta: 'Cocinar',  icono: 'mdi-pot-steam-outline', acento: '#FFF3E0' },
  { valor: 'ESPERAR',  etiqueta: 'Esperar',  icono: 'mdi-timer-sand',        acento: '#E3F2FD' },
]

const TIPO_ICONO: Record<string, string> = {
  PREPARAR: 'mdi-knife',              ELABORAR: 'mdi-bowl-mix-outline',
  COCINAR:  'mdi-pot-steam-outline',  ESPERAR:  'mdi-timer-sand',
  FIN:      'mdi-silverware-fork-knife',
}
const TIPO_ACENTO: Record<string, string> = {
  PREPARAR: '#E8F5E9', ELABORAR: '#FFF8E1', COCINAR: '#FFF3E0',
  ESPERAR:  '#E3F2FD', FIN:      'var(--color-primario-suave)',
}
function infoTipoIcono(tipo: string): string  { return TIPO_ICONO[tipo]  ?? 'mdi-square-outline' }
function infoTipoAcento(tipo: string): string { return TIPO_ACENTO[tipo] ?? '#F5F5F5' }

const bloques = ref<BloqueEnConstruccion[]>([
  { tipo: 'FIN', orden: 1, contenido: '', tiempo_estimado: null },
])
const panelTiposAbierto       = ref(false)
const mostrarErroresBloques   = ref(false)
const mostrarAvisoSinBloques  = ref(false)

function agregarBloque(tipo: TipoBloque): void {
  const posicion = bloques.value.length - 1 // justo antes de FIN
  bloques.value.splice(posicion, 0, { tipo, orden: 0, contenido: '', tiempo_estimado: null })
  bloques.value.forEach((b, i) => { b.orden = i + 1 })
  panelTiposAbierto.value = false
  mostrarAvisoSinBloques.value = false
}

// Refs de los elementos DOM de los bloques (para el composable de drag)
const bloquesRefs = ref<(HTMLElement | null)[]>([])

const drag = useDragBloques(bloques, () => bloquesRefs.value)

const bloqueFantasma = computed(() =>
  drag.indiceDrag.value !== null ? (bloques.value[drag.indiceDrag.value] ?? null) : null
)

let ultimoTapBloqueIndice = -1
let ultimoTapBloqueTiempo = 0

function onBloqueTouchEnd(e: TouchEvent, indice: number): void {
  if (e.cancelable) e.preventDefault()
  if (drag.indiceDrag.value !== null) return
  e.stopPropagation()
  const ahora = Date.now()
  if (ahora - ultimoTapBloqueTiempo < 500 && ultimoTapBloqueIndice === indice) {
    ultimoTapBloqueTiempo = 0
    ultimoTapBloqueIndice = -1
    abrirEditorBloque(indice)
  } else {
    ultimoTapBloqueTiempo = ahora
    ultimoTapBloqueIndice = indice
  }
}

function onBloqueDblClick(indice: number): void {
  if (drag.indiceDrag.value !== null) return
  abrirEditorBloque(indice)
}

// Editor de bloque (abierto por doble-tap)
const bloqueEditandoIndice = ref<number | null>(null)
const editContenido        = ref('')
const editTiempo           = ref<number | null>(null)

function abrirEditorBloque(indice: number): void {
  const b = bloques.value[indice]
  if (!b) return
  bloqueEditandoIndice.value = indice
  editContenido.value        = b.contenido
  editTiempo.value           = b.tiempo_estimado
}

function guardarEdicionBloque(): void {
  const b = bloques.value[bloqueEditandoIndice.value!]
  if (b) {
    b.contenido       = editContenido.value
    b.tiempo_estimado = editTiempo.value ?? null
  }
  cerrarEditorBloque()
}

function cerrarEditorBloque(): void {
  bloqueEditandoIndice.value = null
  editContenido.value        = ''
  editTiempo.value           = null
}

function avanzarDesdeBloques(): void {
  const bloquesContenido = bloques.value.filter(b => b.tipo !== 'FIN')

  if (bloquesContenido.length === 0) {
    mostrarAvisoSinBloques.value = true
    mostrarErroresBloques.value  = false
    mostrarToast('Error: revisar los campos marcados', 'error')
    return
  }
  mostrarAvisoSinBloques.value = false

  const hayContenidoSuficiente = bloquesContenido.every(b => b.contenido.trim().length >= 10)
  if (!hayContenidoSuficiente) {
    mostrarErroresBloques.value = true
    mostrarToast('Error: revisar los campos marcados', 'error')
    return
  }
  mostrarErroresBloques.value = false
  pasoActual.value = Paso.METADATOS
}

// Paso 3: Metadatos

interface OpcionMeta  { valor: string; etiqueta: string; icono: string }
interface OpcionEstilo extends OpcionMeta { fondoActivo: string; colorActivo: string }

const OPCIONES_CATEGORIA: OpcionMeta[] = [
  { valor: 'ENTRANTE',  etiqueta: 'Entrante',  icono: 'mdi-leaf-circle-outline' },
  { valor: 'PRINCIPAL', etiqueta: 'Principal', icono: 'mdi-silverware-fork-knife' },
  { valor: 'POSTRE',    etiqueta: 'Postre',    icono: 'mdi-cake-variant-outline' },
  { valor: 'APERITIVO', etiqueta: 'Aperitivo', icono: 'mdi-glass-wine' },
]

const OPCIONES_DIFICULTAD: OpcionMeta[] = [
  { valor: 'FACIL',   etiqueta: 'Fácil',   icono: '' },
  { valor: 'MEDIA',   etiqueta: 'Media',   icono: '' },
  { valor: 'DIFICIL', etiqueta: 'Difícil', icono: '' },
]

const OPCIONES_ESTILO: OpcionEstilo[] = [
  { valor: 'MEDITERRANEO', etiqueta: 'Mediterráneo', icono: 'mdi-waves',           fondoActivo: '#DCEEFB', colorActivo: '#2196F3' },
  { valor: 'ASIATICO',     etiqueta: 'Asiático',     icono: 'mdi-yin-yang',        fondoActivo: '#FCE4EC', colorActivo: '#E91E63' },
  { valor: 'LATINO',       etiqueta: 'Latino',       icono: 'mdi-leaf',            fondoActivo: '#E8F5E9', colorActivo: '#4CAF50' },
  { valor: 'NORDICO',      etiqueta: 'Nórdico',      icono: 'mdi-snowflake',       fondoActivo: '#E8EAF6', colorActivo: '#3F51B5' },
  { valor: 'FUSION',       etiqueta: 'Fusión',       icono: 'mdi-shuffle-variant', fondoActivo: '#FFF8E1', colorActivo: '#FF8F00' },
]

const OPCIONES_MODO: OpcionMeta[] = [
  { valor: 'TRADICIONAL', etiqueta: 'Tradicional', icono: 'mdi-home-variant-outline' },
  { valor: 'PROFESIONAL', etiqueta: 'Profesional', icono: 'mdi-chef-hat' },
]

const categoriaMenu     = ref('')
const dificultad        = ref('')
const estilo            = ref('')
const modoPreparacion   = ref('TRADICIONAL')
const inputIngrediente  = ref('')
const listaIngredientes = ref<string[]>([])
const ingredientesTexto = computed(() => listaIngredientes.value.join('\n'))
const tags              = ref<string[]>([])
const tagInput          = ref('')

function agregarLineaIngrediente(): void {
  const linea = inputIngrediente.value.trim()
  if (!linea) return
  listaIngredientes.value.push(linea)
  inputIngrediente.value = ''
}

// Tiempo total calculado a partir de los bloques (null → 0)
const tiempoTotal = computed(() =>
  bloques.value.reduce((suma, b) => suma + (b.tiempo_estimado ?? 0), 0)
)

function agregarTag(): void {
  const v = tagInput.value.trim()
  if (!v || tags.value.includes(v)) return
  tags.value.push(v)
  tagInput.value = ''
}
function quitarTag(i: number): void { tags.value.splice(i, 1) }

const sugerenciasTags = computed(() => {
  const set = new Set<string>()
  for (const receta of recetaStore.recetas) {
    for (const tag of receta.tags) set.add(tag)
  }
  return [...set].sort()
})

// Guardado
const guardando = ref(false)

const errores = reactive<{
  categoriaMenu:     string
  dificultad:        string
  estilo:            string
  modoPreparacion:   string
  tiempoTotal:       string
  ingredientesTexto: string
  tags:              string
}>({
  categoriaMenu:     '',
  dificultad:        '',
  estilo:            '',
  modoPreparacion:   '',
  tiempoTotal:       '',
  ingredientesTexto: '',
  tags:              '',
})

function validarMetadatos(): boolean {
  errores.categoriaMenu     = ''
  errores.dificultad        = ''
  errores.estilo            = ''
  errores.modoPreparacion   = ''
  errores.tiempoTotal       = ''
  errores.ingredientesTexto = ''
  errores.tags              = ''
  let valido = true
  if (!categoriaMenu.value)                       { errores.categoriaMenu     = 'Selecciona una categoría';          valido = false }
  if (!dificultad.value)                          { errores.dificultad        = 'Selecciona la dificultad';          valido = false }
  if (!estilo.value)                              { errores.estilo            = 'Selecciona un estilo culinario';    valido = false }
  if (!modoPreparacion.value)                     { errores.modoPreparacion   = 'Selecciona el modo de preparación'; valido = false }
  if (tiempoTotal.value < 1)                      { errores.tiempoTotal       = 'Añade al menos un paso con tiempo estimado'; valido = false }
  if (ingredientesTexto.value.trim().length < 10) { errores.ingredientesTexto = 'Añade al menos 3 Ingredientes'; valido = false }
  if (tags.value.length < 3)                      { errores.tags              = 'Añade al menos 3 Tags';              valido = false }
  return valido
}

function avanzarDesdeMetadatos(): void {
  if (!validarMetadatos()) {
    mostrarToast('Error: revisar los campos marcados', 'error')
    return
  }
  pasoActual.value = Paso.PREVIA
}

async function guardarReceta(): Promise<void> {
  if (guardando.value) return
  guardando.value = true

  // El DTO exige contenido.min(10) en todos los bloques, incluido FIN.
  // Si el usuario no ha escrito nada en FIN, se usa un texto por defecto.
  const FIN_FALLBACK = '¡Receta completada! ¡Buen provecho!'
  const bloquesPayload = bloques.value.map((b, i) => ({
    tipo_bloque:     b.tipo as string,
    orden:           i + 1,
    contenido:       (b.tipo === 'FIN' && b.contenido.trim().length < 10)
      ? FIN_FALLBACK
      : b.contenido,
    tiempo_estimado: b.tiempo_estimado ?? null,
  }))

  const payload = {
    titulo:             titulo.value.trim(),
    categoria_menu:     categoriaMenu.value,
    estilo_culinario:   estilo.value,
    modo_preparacion:   modoPreparacion.value,
    dificultad:         dificultad.value,
    tiempo_preparacion: tiempoTotal.value,
    ingredientes_texto: ingredientesTexto.value.trim(),
    tags:               tags.value,
    bloques:            bloquesPayload,
  }

  try {
    await ejecutar(
      () => modoEdicion.value && idEdicion.value
        ? recetaStore.actualizarReceta(idEdicion.value, payload)
        : recetaStore.crearRecetaCompleta(payload),
      {
        mensajeExito: modoEdicion.value ? 'Receta actualizada correctamente' : 'Receta creada correctamente',
        onExito: (receta) => router.push(`/recetas/${receta.id}?from=recetario`),
        mensajeError: () => {
          const base = recetaStore.error
            ?? (modoEdicion.value ? 'Error al actualizar la receta' : 'Error al crear la receta')
          return `${base}. Inténtalo de nuevo.`
        },
      }
    )
  } finally {
    guardando.value = false
  }
}

// Inicialización: carga de catálogo y precarga en modo edición
onMounted(async () => {
  const editarId = route.query['editar']
  if (editarId && !isNaN(Number(editarId))) {
    try {
      await recetaStore.cargarDetalle(Number(editarId))
      const receta = recetaStore.recetaActual
      if (receta) {
        titulo.value             = receta.titulo
        categoriaMenu.value      = receta.categoria_menu
        dificultad.value         = receta.dificultad
        estilo.value             = receta.estilo_culinario
        modoPreparacion.value    = receta.modo_preparacion
        listaIngredientes.value  = (receta.ingredientes_texto ?? '')
          .split('\n')
          .map(s => s.trim())
          .filter(Boolean)
        tags.value               = [...(receta.tags ?? [])]
        if (receta.bloques?.length) {
          bloques.value = [...receta.bloques]
            .sort((a, b) => a.orden - b.orden)
            .map(b => ({
              tipo:            b.tipo as TipoBloque,
              orden:           b.orden,
              contenido:       b.contenido,
              tiempo_estimado: b.tiempo_estimado ?? null,
            }))
        }
        pasoActual.value = Paso.BLOQUES
      }
    } catch { /* si falla la carga, permanecemos en Paso.TITULO */ }
  }
  if (recetaStore.recetas.length === 0) {
    try { await recetaStore.cargarCatalogo() } catch { /* no bloqueante */ }
  }
})
</script>

<style scoped>
/* -- Contenedor raíz ----------------------------------------------------------- */
.crear-fondo {
  height: 100%;
  overflow-y: auto;
  background: var(--color-secundario);
  display: flex;
  flex-direction: column;
}

/* -- Header sticky ------------------------------------------------------------- */
.header-crear {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--color-superficie);
  padding: 12px var(--espacio-md);
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
}


.header-titulo-input {
  font-size: var(--texto-base);
  font-weight: 600;
  color: var(--color-texto-principal);
  background: transparent;
  border: none;
  border-bottom: 1.5px solid var(--color-primario);
  outline: none;
  width: 100%;
  max-width: 220px;
  padding: 0;
}

.modo-edicion-label {
  font-size: var(--texto-xs);
  color: var(--color-terciario, #888);
  text-align: center;
  margin-bottom: 0.5rem;
  letter-spacing: 0.03em;
}

.btn-nav {
  width: 40px;
  height: 40px;
  background: var(--color-secundario);
  border: none;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-nav:hover { background: var(--color-primario-suave); }

.header-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 40px;
  justify-content: flex-end;
}

/* -- PASO 4: Vista previa ------------------------------------------------------ */
.previa-acciones {
  position: sticky;
  bottom: calc(var(--footer-altura, 64px) + var(--espacio-md));
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding-bottom: var(--espacio-md);
  pointer-events: none;
}

.btn-publicar {
  pointer-events: all;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--color-primario);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(201, 106, 58, 0.4);
  transition: background 0.15s, transform 0.1s;
}
.btn-publicar:hover  { background: var(--color-primario-hover); }
.btn-publicar:active { transform: scale(0.95); }
.btn-publicar:disabled { background: var(--color-texto-terciario); cursor: not-allowed; }

.previa-accion-label {
  pointer-events: none;
  font-size: var(--texto-xs);
  color: var(--color-texto-secundario);
  font-weight: 500;
  background: var(--color-superficie);
  padding: 3px 10px;
  border-radius: 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}

/* -- Transición entre pasos (fade + slide-up 260ms ease-out) ------------------- */
.paso-enter-active,
.paso-leave-active {
  transition: opacity 0.26s ease-out, transform 0.26s ease-out;
}
.paso-enter-from  { opacity: 0; transform: translateY(14px); }
.paso-leave-to    { opacity: 0; transform: translateY(-10px); }

.paso-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* -- PASO 1: Título ------------------------------------------------------------ */
.paso-contenido {
  padding: var(--espacio-xl) var(--espacio-md) var(--espacio-md);
  display: flex;
  flex-direction: column;
  gap: var(--espacio-md);
  flex: 1;
}

.paso-pregunta {
  font-size: var(--texto-xl);
  font-weight: 800;
  color: var(--color-texto-principal);
  margin: 0;
  line-height: 1.2;
}

.paso-ayuda {
  font-size: var(--texto-sm);
  color: var(--color-texto-terciario);
  margin: 0;
}

.input-titulo-wrapper { margin-top: var(--espacio-sm); }

.input-titulo {
  width: 100%;
  box-sizing: border-box;
  border: 2px solid var(--color-primario-suave);
  border-radius: 14px;
  padding: 14px var(--espacio-md);
  font-size: var(--texto-md);
  font-family: inherit;
  font-weight: 500;
  color: var(--color-texto-principal);
  background: var(--color-superficie);
  outline: none;
  transition: border-color 0.2s;
}
.input-titulo:focus { border-color: var(--color-primario); }
.input-titulo::placeholder { color: var(--color-texto-terciario); }

.paso-acciones {
  display: flex;
  align-items: center;
  gap: var(--espacio-md);
  margin-top: auto;
  padding-top: var(--espacio-md);
}

/* -- PASO 2: Bloques ----------------------------------------------------------- */
.bloques-contenedor {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: var(--espacio-md);
  padding-bottom: calc(var(--footer-altura) + var(--espacio-lg));
  gap: var(--espacio-md);
  position: relative;
}

.bloques-lista {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Wrapper de cada bloque (fuera de BloqueConstructor): borde reservado y
   transparente para poder marcar error sin provocar salto de layout */
.bloque-item {
  border: 1.5px solid transparent;
  border-radius: 12px;
  transition: border-color 0.2s;
}
.bloque-item.input--error {
  border-color: var(--color-error);
}
.bloque-item + .campo-error {
  display: block;
  margin-top: 4px;
  padding-left: 4px;
}

.btn-agregar {
  align-self: center;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--color-primario);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(201, 106, 58, 0.35);
  transition: background 0.15s, transform 0.1s;
  flex-shrink: 0;
}
.btn-agregar:hover  { background: var(--color-primario-hover); }
.btn-agregar:active { transform: scale(0.95); }

.aviso-sin-bloques {
  display: block;
  text-align: center;
  margin-top: -4px;
}

.bloques-pie {
  display: flex;
  align-items: center;
  gap: var(--espacio-md);
  margin-top: auto;
}

/* -- Panel de tipos de bloque --------------------------------------------------- */
.panel-titulo {
  font-size: var(--texto-md);
  font-weight: 700;
  color: var(--color-texto-principal);
  margin: 0 0 var(--espacio-md);
}

.panel-tipos {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tipo-opcion {
  display: flex;
  align-items: center;
  gap: var(--espacio-sm);
  background: var(--color-secundario);
  border: none;
  border-radius: 12px;
  padding: 12px var(--espacio-md);
  cursor: pointer;
  transition: background 0.15s;
  text-align: left;
}
.tipo-opcion:hover { background: var(--color-primario-suave); }

.tipo-icono-wrap {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tipo-label {
  flex: 1;
  font-size: var(--texto-base);
  font-weight: 500;
  color: var(--color-texto-principal);
}

/* -- Editor de bloque ------------------------------------------------------------ */
.editor-campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: var(--espacio-md);
}

.editor-label {
  font-size: var(--texto-sm);
  font-weight: 600;
  color: var(--color-texto-secundario);
}

.panel-acciones-editor {
  display: flex;
  align-items: center;
  gap: var(--espacio-md);
  margin-top: var(--espacio-sm);
}

/* -- PASO 3: Metadatos ----------------------------------------------------------- */
.meta-contenedor {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-md);
  padding: var(--espacio-md);
  padding-bottom: calc(var(--footer-altura) + var(--espacio-lg));
}

.meta-seccion {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-sm);
}

.meta-label {
  margin: 0;
}

.meta-label-req { color: var(--color-error); font-weight: 700; }

/* Carruseles ------------------------------------------------------------------- */
.chips-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

.chips-row--scroll {
  flex-wrap: nowrap;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: none;
}
.chips-row--scroll::-webkit-scrollbar { display: none; }

.chips-row--centro {
  justify-content: center;
  gap: 0.75rem;
}

.chip-seleccion {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 14px;
  border-radius: 20px;
  border: 1px solid currentColor;
  background: var(--color-superficie);
  color: var(--color-texto-secundario);
  font-size: var(--texto-xs);
  font-family: inherit;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  flex-shrink: 0;
}
.chip-seleccion:hover { 
  color: white; 
  background: var(--color-primario);
  }

.chip-seleccion--activo {
  background: var(--color-primario-suave);
  color: var(--color-primario);
}

/* Dificultad: colores semánticos cuando están activos */
.chip-dif--facil.chip-seleccion--activo {
  background: var(--dificultad-facil-fondo);
  border-color: var(--dificultad-facil-texto);
  color: var(--dificultad-facil-texto);
}
.chip-dif--media.chip-seleccion--activo {
  background: var(--dificultad-media-fondo);
  border-color: var(--dificultad-media-texto);
  color: var(--dificultad-media-texto);
}
.chip-dif--dificil.chip-seleccion--activo {
  background: var(--dificultad-dificil-fondo);
  border-color: var(--dificultad-dificil-texto);
  color: var(--dificultad-dificil-texto);
}

/* Inputs comunes --------------------------------------------------------------- */
.input-campo {
  font-family: inherit;
}
.input-campo::placeholder { color: var(--color-texto-terciario); }

/* Textarea "Descripción del paso" (editor de bloque) -- mismo tratamiento que .input-base */
.descripcion {
  width: 100%;
  min-height: 100px;
  border-radius: var(--input-radio);
  border: var(--input-border);
  padding: 12px var(--espacio-md);
  font-size: var(--texto-base);
  color: var(--color-texto-principal);
  background: var(--color-primario-suave);
  outline: none;
  box-sizing: border-box;
  resize: vertical;
  transition: border-color 0.2s;
}
.descripcion:focus {
  border: var(--input-border-focus);
}



/* Ingredientes -- input + lista ----------------------------------------------- */
.ingredientes-input-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.ingredientes-input-row .input-campo { flex: 1; }

.btn-añadir {
  background: var(--color-primario);
  color: #fff;
  border: none;
  border-radius: 8px;
  width: 40px;
  height: 40px;
  font-size: var(--texto-metrica);
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ingredientes-lista-creacion {
  list-style: none;
  padding: 0.75rem 1rem;
  margin: 0.75rem 0 0;
  border: 2px solid;
  border-color: var(--color-primario);
  background: var(--color-primario-suave);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.ingrediente-linea {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.ingrediente-barra {
  width: 3px;
  height: 1.1em;
  flex-shrink: 0;
  background: var(--color-primario);
  border-radius: 2px;
}

.ingrediente-texto {
  flex: 1;
  font-size: var(--texto-sm);
  color: var(--color-texto-principal);
}

.ingrediente-borrar {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-texto-terciario);
  font-size: var(--texto-md);
  padding: 0 0.25rem;
  line-height: 1;
}

/* Chips de ingredientes y tags ----------------------------------------------- */
.chips-lista {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: var(--color-primario-suave);
  color: var(--color-primario);
  border-radius: 20px;
  padding: 4px 10px;
  font-size: var(--texto-sm);
  font-weight: 500;
}

.chip-item--tag {
  background: var(--color-superficie-alt);
  color: var(--color-texto-secundario);
  font-size: var(--texto-xs);
  font-weight: 700;
  border: 1px solid currentColor;
}

.chip-quitar {
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  opacity: 0.6;
  padding: 0;
  line-height: 1;
  font-size: var(--texto-sm);
  margin-left: 2px;
}
.chip-quitar:hover { opacity: 1; }

.input-add-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.input-add { flex: 1; }

.btn-add {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--color-primario);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.15s;
}
.btn-add:hover    { background: var(--color-primario-hover); }
.btn-add:disabled { background: var(--color-texto-terciario); cursor: not-allowed; }

/* Acciones --------------------------------------------------------------------- */
.btn-accion {
  flex: 1;
  height: 48px;
}

.btn-cancelar {
  font-size: var(--texto-sm);
  color: var(--color-texto-terciario);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0 4px;
  white-space: nowrap;
}

.meta-acciones {
  display: flex;
  align-items: center;
  gap: var(--espacio-md);
  margin-top: var(--espacio-sm);
}

/* -- Ghost del bloque arrastrado ----------------------------------------------- */
.bloque-ghost {
  position: fixed;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 9999;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.2);
  opacity: 0.9;
  transform: scale(1.08);
}
</style>
