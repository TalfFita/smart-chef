<template>
  <div class="pantalla">
    <div class="contenedor">
      <!-- Logo -->
      <img src="@/assets/logo-smartchef.png" alt="" class="logo-img" aria-hidden="true" />
      <h1 class="logo">Smart Chef</h1>
      <p class="subtitulo">Tu asistente de cocina inteligente</p>

      <!-- Tarjeta del formulario -->
      <div class="tarjeta">
        <form @submit.prevent="enviar" novalidate>
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
                autocomplete="current-password"
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

          <!-- Botón principal -->
          <button
            type="submit"
            class="btn-principal"
            :disabled="authStore.cargando"
          >
            {{ authStore.cargando ? 'Entrando...' : 'Iniciar sesión' }}
          </button>
        </form>

        <!-- Enlace a registro -->
        <p class="enlace-nav">
          ¿No tienes cuenta?
          <router-link to="/registro" class="enlace">Regístrate</router-link>
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
const email = ref<string>('')
const password = ref<string>('')
const mostrarPassword = ref<boolean>(false)

// Errores de validación local
const errores = reactive<{ email: string; password: string }>({
  email: '',
  password: '',
})

function validar(): boolean {
  errores.email = ''
  errores.password = ''
  let valido = true

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
  }

  return valido
}

async function enviar(): Promise<void> {
  if (!validar()) {
    mostrarToast('Error: revisar los campos marcados', 'error')
    return
  }

  try {
    await authStore.login(email.value.trim(), password.value)
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
