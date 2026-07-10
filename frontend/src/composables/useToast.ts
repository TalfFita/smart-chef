import { ref } from 'vue'

export type TipoToast = 'info' | 'success' | 'error'

// Singleton compartido entre ToastGlobal.vue (montado una vez en App.vue)
// y cualquier componente que necesite avisar al usuario -- mismo patrón
// que homeResetTrigger: estado de UI puro, sin Pinia.
export const toastState = ref<{ visible: boolean; mensaje: string; tipo: TipoToast }>({
  visible: false,
  mensaje: '',
  tipo: 'info',
})

export function mostrarToast(mensaje: string, tipo: TipoToast = 'info'): void {
  toastState.value = { visible: true, mensaje, tipo }
}
