import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { requiereAuth: false },
  },
  {
    path: '/registro',
    name: 'Registro',
    component: () => import('@/views/RegisterView.vue'),
    meta: { requiereAuth: false },
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomeView.vue'),
    meta: { requiereAuth: true },
  },
  {
    path: '/recetario',
    name: 'Recetario',
    component: () => import('@/views/RecetarioView.vue'),
    meta: { requiereAuth: true },
  },
  {
    path: '/perfil',
    name: 'Perfil',
    component: () => import('@/views/PerfilView.vue'),
    meta: { requiereAuth: true },
  },
  {
    path: '/recetas/:id',
    name: 'RecetaDetail',
    component: () => import('@/views/RecetaDetailView.vue'),
    meta: { requiereAuth: true },
  },
  {
    path: '/crear',
    name: 'CrearReceta',
    component: () => import('@/views/CrearRecetaView.vue'),
    meta: { requiereAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Guard global de navegación
router.beforeEach((to) => {
  const hayToken = localStorage.getItem('sc_token') !== null
  const rutasPublicas = ['/login', '/registro']

  // Ruta protegida sin sesión → login
  if (to.meta.requiereAuth && !hayToken) {
    return { path: '/login' }
  }

  // Ya autenticado intentando acceder a login/registro → home
  if (rutasPublicas.includes(to.path) && hayToken) {
    return { path: '/' }
  }

  return true
})

export default router
