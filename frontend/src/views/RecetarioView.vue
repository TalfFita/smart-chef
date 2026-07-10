<template>
  <div class="recetario vista-capa0">

    <!-- SECCIÓN 1: Header -->
    <AppHeader titulo="Mi recetario" />

    <!-- SECCIÓN 2: Contenido principal -->
    <main class="recetario__contenido">

      <div v-if="cargandoLocal" class="recetario__estado">
        <v-progress-circular indeterminate color="var(--color-primario)" size="32" />
      </div>

      <div v-else-if="errorLocal" class="recetario__estado">
        <v-icon size="20" color="var(--color-error)">mdi-alert-circle-outline</v-icon>
        {{ errorLocal }}
      </div>

      <div v-else-if="recetario && todoVacio" class="recetario__estado">
        <v-icon size="56" color="var(--color-texto-terciario)">mdi-notebook-outline</v-icon>
        <p class="vacio-titulo">Tu recetario está vacío</p>
        <p class="vacio-subtitulo">
          Guarda recetas que te gusten, crea las tuyas o deja notas mientras cocinas.
        </p>
        <button class="boton-explorar" @click="router.push('/')">
          Explorar recetas
        </button>
      </div>

      <div v-else-if="recetario" class="recetario__colecciones">
        <ColeccionStack
          titulo="Guardadas"
          icono="mdi-heart-outline"
          :recetas="recetario.guardadas"
          mensaje-vacio="Explora el catálogo y pulsa el corazón para guardar recetas aquí."
          origen="recetario"
        />

        <ColeccionStack
          titulo="Tus recetas"
          icono="mdi-brush-outline"
          :recetas="recetario.misRecetas"
          mensaje-vacio="Aún no has creado ninguna receta propia."
          origen="recetario"
        />

        <ColeccionStack
          titulo="Cocinado"
          icono="mdi-chef-hat"
          :recetas="recetasCocinadas"
          mensaje-vacio="Aún no has marcado ninguna receta como cocinada."
          origen="recetario"
        />

        <ColeccionStack
          titulo="Con mis notas"
          icono="mdi-note-text-outline"
          :recetas="recetario.conNotas"
          mensaje-vacio="Aún no has dejado notas en ninguna receta."
          origen="recetario"
        />
      </div>

    </main>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRecetaStore }    from '@/stores/receta.store'
import { useHistorialStore } from '@/stores/historial.store'
import type { Receta } from '@/types'
import ColeccionStack from '@/components/ColeccionStack.vue'
import AppHeader      from '@/components/AppHeader.vue'

const router         = useRouter()
const recetaStore    = useRecetaStore()
const historialStore = useHistorialStore()

/*
 * Estado LOCAL: no usa recetaStore.cargando ni recetaStore.error porque
 * esas flags son compartidas con todas las operaciones del store (cargarCatalogo,
 * cargarTrending...) y pueden interferir si HomeView tiene operaciones en curso.
 */
const cargandoLocal = ref(true)
const errorLocal    = ref<string | null>(null)

const recetario = computed(() => recetaStore.recetario)

const recetasCocinadas = computed((): Receta[] => {
  const entradasOrdenadas = [...historialStore.entradas]
    .sort((a, b) =>
      new Date(b.cocinado_el).getTime() -
      new Date(a.cocinado_el).getTime()
    )
  const vistas = new Set<number>()
  return entradasOrdenadas
    .filter(e => {
      if (vistas.has(e.receta_id)) return false
      vistas.add(e.receta_id); return true
    })
    .map(e => recetaStore.recetas.find(r => r.id === e.receta_id))
    .filter((r): r is Receta => r !== undefined)
})

const todoVacio = computed(() =>
  recetario.value !== null &&
  recetario.value.misRecetas.length === 0 &&
  recetario.value.guardadas.length === 0 &&
  recetario.value.conNotas.length === 0 &&
  recetasCocinadas.value.length === 0
)

onMounted(async () => {
  cargandoLocal.value = true
  errorLocal.value    = null
  try {
    await recetaStore.cargarRecetario()
    if (!historialStore.isLoaded) await historialStore.cargarHistorial()
    if (recetaStore.recetas.length === 0) await recetaStore.cargarCatalogo()
  } catch {
    errorLocal.value = 'No se pudo cargar el recetario. Asegúrate de que el servidor está en marcha.'
  } finally {
    cargandoLocal.value = false
  }
})
</script>

<style scoped>
.recetario {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}

.recetario__contenido {
  flex: 1;
  padding: 1rem 1.25rem;
}

.recetario__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  gap: 1rem;
}

.recetario__colecciones {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Estado vacío */
.vacio-titulo {
  font-size: var(--texto-md);
  font-weight: 700;
  color: var(--color-texto-principal);
  margin: 0;
}

.vacio-subtitulo {
  font-size: var(--texto-sm);
  color: var(--color-texto-secundario);
  margin: 0;
  line-height: 1.6;
  max-width: 280px;
  text-align: center;
}

.boton-explorar {
  background: var(--color-primario);
  color: #ffffff;
  border: none;
  border-radius: var(--boton-radio);
  height: var(--boton-altura);
  padding: 0 var(--espacio-lg);
  font-size: var(--texto-base);
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.boton-explorar:hover { background: var(--color-primario-hover); }

/* Error inline */
.recetario__estado .v-icon,
.recetario__estado span {
  color: var(--color-error);
}
</style>
