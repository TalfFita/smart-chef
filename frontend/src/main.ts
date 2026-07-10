import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createVuetify } from 'vuetify'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import './styles/main.css'

import router from '@/router'
import { useAuthStore } from '@/stores/auth.store'
import App from './App.vue'

// Tema personalizado Smart Chef
const vuetify = createVuetify({
  icons: {
    defaultSet: 'mdi',
  },
  defaults: {
    global: {
      // Sin CDN externo -- usamos @mdi/font local
    },
  },
  theme: {
    defaultTheme: 'smartChef',
    themes: {
      smartChef: {
        dark: false,
        colors: {
          primary: '#C96A3A',
          secondary: '#FAFAF8',
          surface: '#FFFFFF',
          background: '#FAFAF8',
        },
      },
    },
  },
})

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(vuetify)
app.use(router)

// Rehidrata token y datos de usuario antes de montar
const authStore = useAuthStore()
authStore.inicializar()

app.mount('#app')
