import axios from 'axios'
import router from '@/router'

// Instancia de Axios apuntando al backend
const http = axios.create({
  baseURL: 'http://localhost:3000/api',
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
