<template>
  <header class="app-header">
    <div class="app-header__lado-derecho" />
    <span class="app-header__titulo">{{ titulo }}</span>
    <div class="app-header__logo">
      <img src="@/assets/logo-smartchef.png" alt="" class="app-header__logo-img" aria-hidden="true" />
    </div>
  </header>
</template>

<script setup lang="ts">
interface Props {
  titulo: string
}
defineProps<Props>()
</script>

<style scoped>
.app-header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 0.75rem 1.25rem;
  background: var(--color-crema);
  border-bottom: 1px solid var(--color-borde, #EDE8E3);
}
.app-header__logo {
  display: flex;
  align-items: center;
  justify-content: center;
}
.app-header__logo-img {
  height: 40px;
  width: auto;
}
.app-header__titulo {
  font-size: var(--texto-xl);
  font-weight: 800;
  color: var(--color-texto-principal);
  letter-spacing: -0.01em;
  text-align: center;
}
</style>
