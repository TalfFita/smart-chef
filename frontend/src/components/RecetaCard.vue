<template>
  <div
    class="receta-card"
    :class="{ 'receta-card--destacada': destacada }"
    @click="irDetalle"
    role="button"
    :aria-label="`Ver receta ${receta.titulo}`"
  >
    <!-- Badge "Recomendada" -->
    <span v-if="destacada" class="badge-recomendada">Recomendada</span>

    <!-- Título -->
    <h3 class="titulo">{{ receta.titulo }}</h3>

    <!-- Info-row: tiempo, dificultad, estilo -->
    <div class="card-info-row">
      <span class="chip-estilo" :class="claseChipEstilo(receta.estilo_culinario)">
        {{ receta.estilo_culinario }}
      </span>
      <span v-if="receta.dificultad" class="badge-dificultad" :class="claseDificultad">
        {{ receta.dificultad }}
      </span>
      <span class="chip-categoria" :class="claseChipCategoria(receta.categoria_menu)">
        <v-icon size="12" color="currentColor">{{ iconoCategoria(receta.categoria_menu) }}</v-icon>
        {{ receta.categoria_menu }}
      </span>
      <span class="chip-tiempo">
        <v-icon size="12" color="var(--color-texto-secundario)">mdi-clock-outline</v-icon>
        {{ receta.tiempo_preparacion }} min
      </span>
    </div>

    <div class="card-separador" />

    <!-- Tags expandibles (@click.stop evita navegar a la receta) -->
    <div class="card-tags" @click.stop="expandidoTags = !expandidoTags">
      <span v-for="tag in tagsVisibles" :key="tag" class="chip-tag">{{ formatearTag(tag) }}</span>
      <span v-if="!expandidoTags && tagsOcultos > 0" class="chip-tag chip-tag--mas">
        +{{ tagsOcultos }} más
      </span>
      <span v-if="expandidoTags && receta.tags.length > MAX_TAGS_COLAPSADO" class="chip-tag chip-tag--colapsar">
        Ver menos
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Receta } from '@/types'
import { claseChipEstilo, claseChipCategoria, iconoCategoria, formatearTag } from '@/utils/estiloUtils'
import { mostrarToast } from '@/composables/useToast'

const props = defineProps<{
  receta: Receta
  destacada?: boolean
  origen?: string
}>()

const router = useRouter()
const MAX_TAGS_COLAPSADO = 3

const expandidoTags = ref(false)

const tagsVisibles = computed(() =>
  expandidoTags.value
    ? props.receta.tags
    : props.receta.tags.slice(0, MAX_TAGS_COLAPSADO)
)

const tagsOcultos = computed(() =>
  props.receta.tags.length - MAX_TAGS_COLAPSADO
)

// Clase CSS según nivel de dificultad
const claseDificultad = computed(() => {
  switch (props.receta.dificultad?.toUpperCase()) {
    case 'FACIL':   return 'badge--facil'
    case 'MEDIA':   return 'badge--media'
    case 'DIFICIL': return 'badge--dificil'
    default:        return ''
  }
})

function irDetalle(): void {
  if (props.receta.eliminado_en) {
    mostrarToast(`La receta "${props.receta.titulo}" ha sido eliminada`, 'info')
    return
  }
  const path = `/recetas/${props.receta.id}`
  router.push(props.origen ? `${path}?from=${props.origen}` : path)
}

</script>

<style scoped>
.receta-card {
  background: var(--color-superficie);
  border-radius: var(--tarjeta-radio);
  padding: 1rem 1.25rem;
  box-shadow: var(--tarjeta-sombra);
  cursor: pointer;
  transition: box-shadow 0.15s, transform 0.15s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  position: relative;
  border-left: 4px solid transparent;
}

.receta-card:active {
  transform: scale(0.99);
}

/* Variante destacada (recomendación principal) */
.receta-card--destacada {
  border-left-color: var(--color-primario);
}

.badge-recomendada {
  align-self: flex-start;
  width: auto;
  letter-spacing: 0.3px;
}

.titulo {
  font-size: var(--texto-base);
  font-weight: 600;
  color: #212121;
  margin: 0;
  line-height: 1.3;
  text-align: center;
  width: 100%;
}

/* Info-row: tiempo · dificultad · estilo */
.card-info-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: space-around;
  width: 100%;
}
.card-info-row > :first-child { justify-self: start; }
.card-info-row > :nth-child(2) { justify-self: center; }
.card-info-row > :last-child  { justify-self: end; }


.card-separador {
  width: 100%;
  height: 1px;
  background: var(--color-borde, #EDE8E3);
  margin: 0.25rem 0;
}

/* Chips de tags */
.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: space-around;
  width: 100%;
  cursor: pointer;
}

.chip-tag--mas,
.chip-tag--colapsar {
  background: var(--color-superficie-alt, #F5F0EB);
  color: var(--color-primario);
  font-weight: 700;
  cursor: pointer;
}

</style>
