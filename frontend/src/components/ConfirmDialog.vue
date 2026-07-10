<template>
  <BottomSheet :visible="visible" :titulo="titulo" @cerrar="emit('cancelar')">
    <h3 class="confirm-titulo">{{ titulo }}</h3>
    <p class="confirm-mensaje">{{ mensaje }}</p>

    <div class="confirm-acciones">
      <button class="btn-cancelar" @click="emit('cancelar')">{{ textoCancelar }}</button>
      <button class="boton-primario btn-confirmar btn-confirmar--peligro" @click="emit('confirmar')">
        {{ textoConfirmar }}
      </button>
    </div>
  </BottomSheet>
</template>

<script setup lang="ts">
import BottomSheet from '@/components/BottomSheet.vue'

interface Props {
  visible: boolean
  titulo: string
  mensaje: string
  textoConfirmar?: string
  textoCancelar?: string
}

withDefaults(defineProps<Props>(), {
  textoConfirmar: 'Sí, borrar',
  textoCancelar: 'Cancelar',
})

const emit = defineEmits<{
  (e: 'confirmar'): void
  (e: 'cancelar'): void
}>()
</script>

<style scoped>
.confirm-titulo {
  font-size: var(--texto-base);
  font-weight: 600;
  text-align: center;
  color: var(--color-texto-principal);
  margin: 0 0 var(--espacio-sm);
}

.confirm-mensaje {
  font-size: var(--texto-sm);
  text-align: center;
  color: var(--color-texto-secundario);
  margin: 0;
}

.confirm-acciones {
  display: flex;
  align-items: center;
  gap: var(--espacio-md);
  margin-top: var(--espacio-lg);
}

.btn-cancelar {
  font-size: var(--texto-sm);
  color: var(--color-texto-terciario);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.btn-confirmar {
  flex: 1;
  height: 48px;
  font-size: var(--texto-base);
}

/* Color destructivo solo para este botón -- .boton-primario compartida no cambia */
.btn-confirmar--peligro {
  background: var(--color-error);
}

.btn-confirmar--peligro:hover {
  background: var(--color-error);
  opacity: 0.9;
}
</style>
