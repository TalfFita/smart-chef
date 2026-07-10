<template>
  <v-app>
    <div
      class="contenedor-vistas"
      :class="{ 'contenedor-vistas--con-footer': mostrarFooter }"
      @touchstart.passive="onTouchStart"
      @touchmove.passive="onTouchMove"
      @touchend.passive="onTouchEnd"
    >
      <RouterView v-slot="{ Component }">
        <Transition :name="nombreTransicion">
          <div :key="route.path" class="vista-contenedor">
            <component :is="Component" />
          </div>
        </Transition>
      </RouterView>
    </div>

    <!-- Footer -- solo en rutas autenticadas -->
    <nav v-if="mostrarFooter" class="footer-bar">
      <button
        v-for="item in navItems"
        :key="item.ruta"
        class="footer-btn"
        :class="{ 'footer-btn--activo': rutaActiva === item.ruta }"
        @click="onFooterClick(item.ruta)"
        :aria-label="item.etiqueta"
      >
        <span class="footer-btn__circulo" />
        <v-icon size="30">{{ item.icono }}</v-icon>
      </button>
    </nav>

    <ToastGlobal />
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { homeResetTrigger } from '@/composables/useHomeReset'
import ToastGlobal from '@/components/ToastGlobal.vue'

const route     = useRoute()
const router    = useRouter()
const authStore = useAuthStore()

// 3 tabs principales (capa 0). El flujo Descubrir es parte de HomeView (/).
const navItems = [
  { ruta: '/recetario', icono: 'mdi-notebook-outline', etiqueta: 'Recetario' },
  { ruta: '/',          icono: 'mdi-home-outline',     etiqueta: 'Inicio'    },
  { ruta: '/perfil',    icono: 'mdi-account-outline',  etiqueta: 'Perfil'    },
]

const rutasPublicas = ['/login', '/registro']

const mostrarFooter = computed(
  () => authStore.estaAutenticado && !rutasPublicas.includes(route.path)
)

// Botón activo: el que coincide exactamente con la ruta actual
const rutaActiva = computed(
  () => navItems.find((item) => item.ruta === route.path)?.ruta ?? null
)

function onFooterClick(ruta: string): void {
  if (ruta === '/') homeResetTrigger.value++
  router.push(ruta)
}

// Transiciones entre vistas

// Orden de capa-0 para determinar la dirección del slide.
const ORDEN_TABS = ['/recetario', '/', '/perfil']

const nombreTransicion = ref('slide-izquierda')

router.beforeEach((to, from) => {
  const desdeIdx = ORDEN_TABS.indexOf(from.path)
  const hastaIdx = ORDEN_TABS.indexOf(to.path)
  if (desdeIdx !== -1 && hastaIdx !== -1) {
    nombreTransicion.value = hastaIdx >= desdeIdx ? 'slide-izquierda' : 'slide-derecha'
  } else {
    // Rutas fuera del orden de tabs (/recetas/:id, /crear, etc.)
    nombreTransicion.value = 'fade-vista'
  }
})

// Swipe táctil entre tabs

let touchInicioX   = 0
let touchInicioY   = 0
let swipeActivo    = false
let navegandoSwipe = false

function onTouchStart(e: TouchEvent): void {
  touchInicioX = e.touches[0].clientX
  touchInicioY = e.touches[0].clientY
  swipeActivo  = true
}

function onTouchMove(e: TouchEvent): void {
  if (!swipeActivo) return
  const deltaX = Math.abs(e.touches[0].clientX - touchInicioX)
  const deltaY = Math.abs(e.touches[0].clientY - touchInicioY)
  // Scroll vertical detectado: cancelar el swipe
  if (deltaY > 12 && deltaY > deltaX) swipeActivo = false
}

function onTouchEnd(e: TouchEvent): void {
  if (!swipeActivo || navegandoSwipe) return
  swipeActivo = false

  const deltaX = e.changedTouches[0].clientX - touchInicioX
  const deltaY = e.changedTouches[0].clientY - touchInicioY

  // Umbral mínimo 60 px y swipe más horizontal que vertical
  if (Math.abs(deltaX) < 60 || Math.abs(deltaY) > Math.abs(deltaX) * 0.75) return

  const idxActual = ORDEN_TABS.indexOf(route.path)
  if (idxActual === -1) return

  if (deltaX < 0 && idxActual < ORDEN_TABS.length - 1) {
    navegandoSwipe = true
    router.push(ORDEN_TABS[idxActual + 1])
    setTimeout(() => { navegandoSwipe = false }, 500)
  } else if (deltaX > 0 && idxActual > 0) {
    navegandoSwipe = true
    router.push(ORDEN_TABS[idxActual - 1])
    setTimeout(() => { navegandoSwipe = false }, 500)
  }
}
</script>

<style scoped>
.contenedor-vistas {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  background: var(--color-secundario);
  isolation: isolate;
}

.contenedor-vistas::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url('@/assets/logo-smartchef.png') center / contain no-repeat;
  opacity: 0.08;
  pointer-events: none;
  z-index: -1;
}

.contenedor-vistas--con-footer {
  bottom: var(--footer-altura);
}

/* Wrapper de cada vista: en reposo ocupa todo el espacio */
.vista-contenedor {
  width: 100%;
  height: 100%;
}

/* -- Slide izquierda (hacia tab de índice mayor) --------------------------- */
.slide-izquierda-enter-active,
.slide-izquierda-leave-active {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  transition: transform 260ms ease-out;
}
.slide-izquierda-enter-from { transform: translateX(100%);  }
.slide-izquierda-leave-to   { transform: translateX(-100%); }

/* -- Slide derecha (hacia tab de índice menor) ----------------------------- */
.slide-derecha-enter-active,
.slide-derecha-leave-active {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  transition: transform 260ms ease-out;
}
.slide-derecha-enter-from { transform: translateX(-100%); }
.slide-derecha-leave-to   { transform: translateX(100%);  }

/* -- Fade suave para rutas fuera de los tabs ------------------------------- */
.fade-vista-enter-active,
.fade-vista-leave-active { transition: opacity 180ms ease; }
.fade-vista-enter-from,
.fade-vista-leave-to     { opacity: 0; }

/* -- Footer ---------------------------------------------------------------- */
.footer-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--footer-altura);
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: var(--color-crema);
  border-top: 1px solid var(--color-borde);
  z-index: 100;
}

.footer-btn {
  position: relative;
  flex: 1;
  height: var(--footer-altura);
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-texto-terciario);
  transition: opacity 0.15s;
}
.footer-btn:active { opacity: 0.6; }

.footer-btn__circulo {
  position: absolute;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: transparent;
  transition: background 0.2s;
}

.footer-btn--activo .footer-btn__circulo {
  background: rgba(201, 106, 58, 0.15);
}
.footer-btn--activo .v-icon { color: var(--color-primario); }
</style>
