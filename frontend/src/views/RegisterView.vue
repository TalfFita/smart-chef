<template>
  <div class="pantalla">
    <div class="contenedor">
      <!-- Logo -->
      <img src="@/assets/logo-smartchef.png" alt="" class="logo-img" aria-hidden="true" />
      <h1 class="logo">Smart Chef</h1>
      <p class="subtitulo">Crea tu cuenta y empieza a cocinar</p>

      <!-- Tarjeta del formulario -->
      <div class="tarjeta">
        <form @submit.prevent="enviar" novalidate>
          <!-- Nombre -->
          <div class="campo">
            <label class="etiqueta" for="nombre">Nombre</label>
            <input
              id="nombre"
              v-model="nombre"
              type="text"
              class="input-base"
              :class="{ 'input--error': errores.nombre }"
              placeholder="Tu nombre"
              autocomplete="name"
            />
            <span v-if="errores.nombre" class="campo-error">{{ errores.nombre }}</span>
          </div>

          <!-- Email -->
          <div class="campo">
            <label class="etiqueta" for="email">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              class="input-base"
              :class="{ 'input--error': errores.email }"
              placeholder="tu@email.com"
              autocomplete="email"
            />
            <span v-if="errores.email" class="campo-error">{{ errores.email }}</span>
          </div>

          <!-- Contraseña -->
          <div class="campo">
            <label class="etiqueta" for="password">Contraseña</label>
            <div class="input-wrapper">
              <input
                id="password"
                v-model="password"
                :type="mostrarPassword ? 'text' : 'password'"
                class="input-base input--con-icono"
                :class="{ 'input--error': errores.password }"
                placeholder="Mínimo 6 caracteres"
                autocomplete="new-password"
              />
              <button
                type="button"
                class="toggle-password"
                @click="mostrarPassword = !mostrarPassword"
                :aria-label="mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              >
                <v-icon size="20" color="#9E9E9E">
                  {{ mostrarPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline' }}
                </v-icon>
              </button>
            </div>
            <span v-if="errores.password" class="campo-error">{{ errores.password }}</span>
          </div>

          <!-- Confirmar contraseña -->
          <div class="campo">
            <label class="etiqueta" for="confirmar">Confirmar contraseña</label>
            <div class="input-wrapper">
              <input
                id="confirmar"
                v-model="confirmar"
                :type="mostrarConfirmar ? 'text' : 'password'"
                class="input-base input--con-icono"
                :class="{ 'input--error': errores.confirmar }"
                placeholder="Repite la contraseña"
                autocomplete="new-password"
              />
              <button
                type="button"
                class="toggle-password"
                @click="mostrarConfirmar = !mostrarConfirmar"
                :aria-label="mostrarConfirmar ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              >
                <v-icon size="20" color="#9E9E9E">
                  {{ mostrarConfirmar ? 'mdi-eye-off-outline' : 'mdi-eye-outline' }}
                </v-icon>
              </button>
            </div>
            <span v-if="errores.confirmar" class="campo-error">{{ errores.confirmar }}</span>
          </div>

          <!-- Botón principal -->
          <button
            type="submit"
            class="btn-principal"
            :disabled="authStore.cargando"
          >
            {{ authStore.cargando ? 'Creando cuenta...' : 'Crear cuenta' }}
          </button>
        </form>

        <!-- Enlace a login -->
        <p class="enlace-nav">
          ¿Ya tienes cuenta?
          <router-link to="/login" class="enlace">Inicia sesión</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { mostrarToast } from '@/composables/useToast'
import { esEmailValido } from '@/utils/validadores'

const router = useRouter()
const authStore = useAuthStore()

// Campos del formulario
const nombre = ref<string>('')
const email = ref<string>('')
const password = ref<string>('')
const confirmar = ref<string>('')
const mostrarPassword = ref<boolean>(false)
const mostrarConfirmar = ref<boolean>(false)

// Errores de validación local
const errores = reactive<{
  nombre: string
  email: string
  password: string
  confirmar: string
}>({
  nombre: '',
  email: '',
  password: '',
  confirmar: '',
})

function validar(): boolean {
  errores.nombre = ''
  errores.email = ''
  errores.password = ''
  errores.confirmar = ''
  let valido = true

  if (!nombre.value.trim()) {
    errores.nombre = 'El nombre es obligatorio'
    valido = false
  } else if (nombre.value.trim().length < 2) {
    errores.nombre = 'Mínimo 2 caracteres'
    valido = false
  }

  if (!email.value.trim()) {
    errores.email = 'El email es obligatorio'
    valido = false
  } else if (!esEmailValido(email.value.trim())) {
    errores.email = 'Introduce un email válido'
    valido = false
  }

  if (!password.value) {
    errores.password = 'La contraseña es obligatoria'
    valido = false
  } else if (password.value.length < 6) {
    errores.password = 'Mínimo 6 caracteres'
    valido = false
  } else if (!/(?=.*\d)(?=.*[^A-Za-z0-9])/.test(password.value)) {
    errores.password = 'La contraseña debe incluir al menos un número y un carácter especial.'
    valido = false
  }

  if (!confirmar.value) {
    errores.confirmar = 'Confirma tu contraseña'
    valido = false
  } else if (confirmar.value !== password.value) {
    errores.confirmar = 'Las contraseñas no coinciden'
    valido = false
  }

  return valido
}

async function enviar(): Promise<void> {
  if (!validar()) {
    mostrarToast('Error: revisar los campos marcados', 'error')
    return
  }

  try {
    await authStore.registro(nombre.value.trim(), email.value.trim(), password.value)
    router.push('/')
  } catch {
    mostrarToast(authStore.error ?? 'Ha ocurrido un error', 'error')
  }
}
</script>

<style scoped>
.pantalla {
  height: 100%;
  overflow-y: auto;
  background-color: #fafaf8;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
}

.contenedor {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.logo-img {
  height: 64px;
  width: auto;
  display: block;
  margin: 0 auto;
}

.logo {
  font-size: var(--texto-2xl);
  font-weight: 700;
  color: #c96a3a;
  margin: 0;
  letter-spacing: -0.5px;
}

.subtitulo {
  font-size: var(--texto-sm);
  color: #9e9e9e;
  margin: 0 0 16px;
}

.tarjeta {
  width: 100%;
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.campo {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.etiqueta {
  font-size: var(--texto-sm);
  font-weight: 500;
  color: #424242;
}

.input--con-icono {
  padding-right: 44px;
}

.input-wrapper {
  position: relative;
}

.toggle-password {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
}

.btn-principal {
  margin-top: 4px;
}

.enlace-nav {
  font-size: var(--texto-sm);
  color: #757575;
  text-align: center;
  margin: 0;
}

.enlace {
  color: #c96a3a;
  font-weight: 600;
  text-decoration: none;
}

.enlace:hover {
  text-decoration: underline;
}
</style>
