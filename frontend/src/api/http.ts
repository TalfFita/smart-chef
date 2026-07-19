import axios from 'axios'
import router from '@/router'

// Instancia de Axios apuntando al backend.
// VITE_API_URL se define en .env.local (no versionado, ver .env.example).
// Si no está definida, se usa una ruta relativa '/api': el proxy de Vite
// (vite.config.ts) la redirige a localhost:3000, cómodo para desarrollo
// puramente local. En modo LAN, VITE_API_URL debe apuntar a la IP de tu
// máquina en la red, ej: http://192.168.1.50:3000/api
const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
})

// Interceptor de REQUEST -- añade el token JWT si existe
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('sc_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor de RESPONSE -- limpia sesión y redirige al login en 401
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sc_token')
      localStorage.removeItem('sc_usuario')
      router.push('/login')
    }
    return Promise.reject(error)
  }
)

export default http
