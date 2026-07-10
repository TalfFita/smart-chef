<template>
  <div>
    <section class="receta-header">
      <h1 class="receta-titulo">{{ titulo }}</h1>

      <div class="meta-row">
        <span class="chip-tiempo">
          <v-icon size="12" color="var(--color-texto-secundario)">mdi-clock-outline</v-icon>
          {{ tiempoMin }} min
        </span>
        <span class="chip-estilo" :class="claseChipEstilo(estiloCulinario)">{{ estiloCulinario }}</span>
        <span
          v-if="dificultad"
          class="badge-dificultad"
          :class="claseDificultad"
          >{{ dificultad }}</span>
        <span class="chip chip--modo">{{ modoPreparacion }}</span>
        <span v-if="categoriaMenu" class="chip-categoria" :class="claseChipCategoria(categoriaMenu)">
          <v-icon size="12" color="currentColor">{{ iconoCategoria(categoriaMenu) }}</v-icon>
          {{ categoriaMenu }}
        </span>
      </div>

      <div v-if="tags.length > 0" class="bloque-tags-wrapper">
        <h3 class="seccion-label tags-titulo">Etiquetas</h3>
        <div class="bloque-tags">
          <span v-for="tag in tags" :key="tag" class="chip-tag">{{ formatearTag(tag) }}</span>
        </div>
      </div>
      <div class="divider" />
    </section>

    <section v-if="ingredientesTexto.trim()" class="bloque-ingredientes">
      <div class="bloque-tarjeta">
        <div class="bloque-ingredientes__header">
          <v-icon size="16" color="var(--color-texto-terciario)">mdi-format-list-bulleted</v-icon>
          <span class="seccion-label tags-titulo tags-titulo--sin-margen">Ingredientes</span>
        </div>
        <ul class="bloque-ingredientes__lista">
          <li
            v-for="(item, i) in ingredientesLista"
            :key="i"
            class="bloque-ingredientes__item"
          >{{ item }}</li>
        </ul>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { claseChipEstilo, claseChipCategoria, iconoCategoria, formatearTag } from '@/utils/estiloUtils'

const props = defineProps<{
  titulo:           string
  tiempoMin:        number
  estiloCulinario:  string
  modoPreparacion:  string
  categoriaMenu:    string
  dificultad:       string
  tags:             string[]
  ingredientesTexto: string
}>()

const ingredientesLista = computed(() =>
  props.ingredientesTexto
    .split(/[,\n]/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
)

const claseDificultad = computed(() => {
  switch (props.dificultad.toUpperCase()) {
    case 'FACIL':   return 'badge--facil'
    case 'MEDIA':   return 'badge--media'
    case 'DIFICIL': return 'badge--dificil'
    default:        return ''
  }
})
</script>

<style scoped>
.receta-header {
  padding: var(--espacio-md);
  background: var(--color-superficie);
  box-shadow: var(--tarjeta-sombra);
  border-radius: 0 0 50px 50px;
}

.receta-titulo {
  font-size: var(--texto-xl);
  font-weight: 800;
  text-align: center;
  color: var(--color-texto-principal);
  margin: 0;
  padding: 0 0 10px;
  line-height: 1.2;
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  align-items: center;
  gap: var(--espacio-xs);
  margin-top: 8px;
}

.bloque-ingredientes {
  padding: 1rem 0;
}

.bloque-tarjeta {
  background: var(--color-primario-suave);
  padding: 1rem 1.25rem;
  border-radius: 12px;
  border: 1px solid;
  border-color: var(--color-primario);
  margin-bottom: 1rem;
  margin-left: var(--espacio-md);
  margin-right: var(--espacio-md);
  box-shadow: var(--tarjeta-secundaria-sombra);
}

.bloque-ingredientes__header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.bloque-ingredientes__lista {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.bloque-ingredientes__item {
  font-size: var(--texto-sm);
  color: var(--color-texto-principal);
  padding-left: 0.75rem;
  border-left: 2px solid var(--color-primario);
}

.tags-titulo--sin-margen {
  margin-top: 0;
}
</style>
