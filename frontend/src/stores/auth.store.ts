import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import http from '@/api/http'
import type { Usuario } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  // Estado
  const usuario = ref<Usuario | null>(null)
  const token = ref<string | null>(null)
  const cargando = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const estaAutenticado = computed(() => token.value !== null)
  const nombreUsuario = computed(() => usuario.value?.nombre ?? '')

  // Lee token y usuario de localStorage al arrancar la app
  function inicializar(): void {
    const tokenGuardado = localStorage.getItem('sc_token')
    const usuarioGuardado = localStorage.getItem('sc_usuario')
    if (tokenGuardado) {
      token.value = tokenGuardado
    }
    if (usuarioGuardado) {
      try {
        usuario.value = JSON.parse(usuarioGuardado) as Usuario
      } catch {
        localStorage.removeItem('sc_usuario')
      }
    }
  }

  async function login(email: string, password: string): Promise<void> {
    cargando.value = true
    error.value = null
    try {
      const { data } = await http.post<{ token: string; usuario: Usuario }>('/auth/login', { email, password })
      token.value = data.token
      usuario.value = data.usuario
      localStorage.setItem('sc_token', data.token)
      localStorage.setItem('sc_usuario', JSON.stringify(data.usuario))
    } catch (e) {
      error.value = 'Error al iniciar sesión'
      throw e
    } finally {
      cargando.value = false
    }
  }

  async function registro(nombre: string, email: string, password: string): Promise<void> {
    cargando.value = true
    error.value = null
    try {
      const { data } = await http.post<{ token: string; usuario: Usuario }>('/auth/registro', { nombre, email, password })
      token.value = data.token
      usuario.value = data.usuario
      localStorage.setItem('sc_token', data.token)
      localStorage.setItem('sc_usuario', JSON.stringify(data.usuario))
    } catch (e) {
      error.value = 'Error al registrar usuario'
      throw e
    } finally {
      cargando.value = false
    }
  }

  function logout(): void {
    token.value = null
    usuario.value = null
    error.value = null
    localStorage.removeItem('sc_token')
    localStorage.removeItem('sc_usuario')
  }

  return { usuario, token, cargando, error, estaAutenticado, nombreUsuario, inicializar, login, registro, logout }
})
