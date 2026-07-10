import { ref } from 'vue'

// Singleton compartido entre App.vue (footer) y HomeView.vue.
// Se incrementa al pulsar el tab Home estando ya en '/', donde
// router.push('/') es un no-op y no hay forma de que HomeView se entere.
export const homeResetTrigger = ref(0)
