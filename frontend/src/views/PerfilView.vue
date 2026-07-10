<template>
  <div class="perfil vista-capa0">

    <!-- SECCIÓN 1: Header -->
    <AppHeader titulo="Mi perfil" />

    <!-- SECCIÓN 2: Tarjeta de identidad + métricas -->
    <section class="perfil__identidad">
      <div class="perfil-card">
        <div class="perfil-identidad">
          <span class="perfil-avatar">
            <v-icon size="32" :color="'var(--color-avatar-icono)'">mdi-account-circle</v-icon>
          </span>
          <div>
            <p class="perfil-nombre">{{ authStore.usuario?.nombre }}</p>
            <p class="perfil-email">{{ authStore.usuario?.email }}</p>
          </div>
        </div>

        <div class="perfil-metricas">
          <div class="metrica" v-for="m in metricas" :key="m.label">
            <span class="metrica__valor">{{ m.valor }}</span>
            <span class="metrica__label">{{ m.label }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- SECCIÓN 3: Heatmap de actividad -->
    <section class="perfil__actividad">
      <p class="perfil__seccion-titulo">Tu actividad culinaria</p>
      <HeatmapActividad />
    </section>

    <!-- SECCIÓN 4: Logout -->
    <footer class="perfil__footer">
      <button class="perfil-logout" @click="cerrarSesion">
        Cerrar sesión
      </button>
    </footer>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { Receta } from '@/types'
import http                  from '@/api/http'
import { useAuthStore }      from '@/stores/auth.store'
import { useFavoritoStore }  from '@/stores/favorito.store'
import { useHistorialStore } from '@/stores/historial.store'
import { useRecetaStore }    from '@/stores/receta.store'
import HeatmapActividad      from '@/components/HeatmapActividad.vue'
import AppHeader             from '@/components/AppHeader.vue'

const router         = useRouter()
const authStore      = useAuthStore()
const favoritoStore  = useFavoritoStore()
const historialStore = useHistorialStore()
const recetaStore    = useRecetaStore()

const conNotasCount = ref<number | null>(null)

const metricas = computed(() => [
  {
    label: 'Creadas',
    valor: recetaStore.recetas.filter(r => r.autor_id === authStore.usuario?.id).length,
  },
  {
    label: 'Cocinadas',
    valor: historialStore.entradas.length,
  },
  {
    label: 'Guardadas',
    valor: favoritoStore.favoritos.length,
  },
  {
    label: 'Anotadas',
    valor: conNotasCount.value ?? '--',
  },
])

function cerrarSesion(): void {
  authStore.logout()
  router.push('/login')
}

onMounted(async () => {
  // historialStore tiene flag isLoaded -- evita recarga si ya está en memoria
  if (!historialStore.isLoaded) await historialStore.cargarHistorial()
  // recetaStore no tiene isLoaded -- carga si el array está vacío
  if (recetaStore.recetas.length === 0) await recetaStore.cargarCatalogo()
  await favoritoStore.cargarFavoritos()
  try {
    const res = await http.get<{ conNotas: Receta[] }>('/usuarios/me/recetario')
    conNotasCount.value = res.data.conNotas.length
  } catch {
    conNotasCount.value = null
  }
})
</script>

<style scoped>
/* -- Contenedor raíz ----------------------------------------------------------- */
.perfil {
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

/* -- Secciones ----------------------------------------------------------------- */
.perfil__identidad {
  padding: 1rem 1.25rem 0;
}

.perfil__actividad {
  padding: 1.25rem 1.25rem 0;
}

.perfil__seccion-titulo {
  font-size: var(--texto-xs);
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--color-terciario, #888);
  text-transform: uppercase;
  margin-bottom: 0.75rem;
}

.perfil__footer {
  margin-top: auto;
  padding: 1.5rem 1.25rem;
  display: flex;
  justify-content: center;
}

/* -- Tarjeta de identidad ------------------------------------------------------ */
.perfil-card {
  background: var(--color-superficie);
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.perfil-identidad {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.perfil-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--color-avatar-fondo);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.perfil-nombre {
  font-size: var(--texto-base);
  font-weight: 700;
  color: var(--color-texto-principal);
  margin: 0;
}

.perfil-email {
  font-size: var(--texto-xs);
  color: var(--color-terciario, #888);
  margin: 0;
}

/* -- Métricas ------------------------------------------------------------------ */
.perfil-metricas {
  display: flex;
  gap: 0.5rem;
  justify-content: space-between;
}

.metrica {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  background: var(--color-fondo, #f5f0eb);
  border-radius: 8px;
  padding: 0.6rem 0.25rem;
}

.metrica__valor {
  font-size: var(--texto-metrica);
  font-weight: 700;
  color: var(--color-primario);
}

.metrica__label {
  font-size: var(--texto-xs);
  color: var(--color-terciario, #888);
  text-align: center;
}

/* -- Logout -------------------------------------------------------------------- */
.perfil-logout {
  background: none;
  border: none;
  cursor: pointer;
  font-size: var(--texto-sm);
  color: var(--color-terciario, #888);
  text-align: center;
  width: 100%;
  padding: 0.5rem;
  text-decoration: underline;
}
</style>
