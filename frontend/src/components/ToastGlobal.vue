<template>
  <v-snackbar
    v-model="visible"
    :timeout="3000"
    location="top"
    rounded="pill"
    :class="`toast--${toastState.tipo}`"
  >
    <div class="toast-contenido">
      <v-icon size="18" color="currentColor">{{ iconoToast }}</v-icon>
      <span>{{ toastState.mensaje }}</span>
    </div>
  </v-snackbar>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { toastState } from '@/composables/useToast'

const visible = computed({
  get: () => toastState.value.visible,
  set: (valor: boolean) => { toastState.value.visible = valor },
})

const iconoToast = computed(() => {
  switch (toastState.value.tipo) {
    case 'success': return 'mdi-check-circle'
    case 'error':   return 'mdi-alert-circle'
    default:        return 'mdi-information'
  }
})
</script>

<style scoped>
:deep(.v-snackbar__wrapper) {
  margin-top: var(--espacio-md);
  padding: 1rem 2rem;
  min-width: 0;
  width: fit-content;
}

:deep(.v-snackbar__content) {
  padding: 0;
}

.toast-contenido {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.toast--success :deep(.v-snackbar__wrapper) {
  background: var(--color-exito-suave);
  border: 1px solid var(--color-exito);
  color: var(--color-exito);
  font-weight: 700;
}

.toast--error :deep(.v-snackbar__wrapper) {
  background: var(--color-error-fondo);
  border: 1px solid var(--color-error);
  color: var(--color-error);
  font-weight: 700;
}

.toast--info :deep(.v-snackbar__wrapper) {
  background: var(--color-primario-suave);
  border: 1px solid var(--color-primario);
  color: var(--color-primario);
  font-weight: 700;
}
</style>
