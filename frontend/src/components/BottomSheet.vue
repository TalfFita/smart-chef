<template>
  <!-- El Teleport evita problemas de z-index con stacking contexts del padre -->
  <Teleport to="body">
    <Transition name="bs">
      <div
        v-if="visible"
        class="bs-overlay"
        role="dialog"
        :aria-label="titulo"
        @click.self="emit('cerrar')"
      >
        <div class="bs-panel">
          <div class="bs-handle" />
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  visible: boolean
  titulo?: string
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'cerrar'): void
}>()
</script>

<style scoped>
.bs-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 200;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.bs-panel {
  background: var(--color-superficie);
  border-radius: 20px 20px 0 0;
  padding: var(--espacio-lg);
  padding-bottom: calc(var(--footer-altura) + var(--espacio-lg));
  max-height: 85vh;
  overflow-y: auto;
}

.bs-handle {
  width: 40px;
  height: 4px;
  background: var(--color-texto-terciario);
  border-radius: 2px;
  margin: 0 auto var(--espacio-md);
  opacity: 0.4;
}

/* -- Transición slide-up del panel ---------------------------------------- */
.bs-enter-active {
  transition: opacity 0.25s ease;
}
.bs-leave-active {
  transition: opacity 0.2s ease;
}
.bs-enter-from,
.bs-leave-to {
  opacity: 0;
}
.bs-enter-active .bs-panel {
  animation: bsSlideUp 0.28s cubic-bezier(0.32, 0.72, 0, 1) forwards;
}
.bs-leave-active .bs-panel {
  animation: bsSlideDown 0.22s ease forwards;
}

@keyframes bsSlideUp {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}

@keyframes bsSlideDown {
  from { transform: translateY(0); }
  to   { transform: translateY(100%); }
}
</style>
