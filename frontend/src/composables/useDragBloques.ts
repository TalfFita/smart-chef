import { ref, type Ref } from 'vue'
import type { BloqueEnConstruccion } from '@/types'

const UMBRAL_DRAG = 8

/**
 * Gestiona el drag & drop de bloques en CrearRecetaView.
 * Distingue tap (threshold no superado) de drag (threshold superado).
 * FIN siempre queda en la última posición.
 */
export function useDragBloques(
  bloques: Ref<BloqueEnConstruccion[]>,
  getBlockEls: () => (HTMLElement | null)[],
) {
  const indiceDrag    = ref<number | null>(null)
  const indiceDestino = ref<number | null>(null)
  const ghostX        = ref(0)
  const ghostY        = ref(0)

  let startX           = 0
  let startY           = 0
  let arrastrando      = false
  let indicePendiente: number | null = null

  function onPointerDown(e: PointerEvent, indice: number): void {
    // FIN puede recibir taps (para editar) pero el drag se bloquea en onPointerMove
    indicePendiente = indice
    arrastrando     = false
    startX          = e.clientX
    startY          = e.clientY
    ghostX.value    = e.clientX
    ghostY.value    = e.clientY

    document.addEventListener('pointermove', onPointerMove, { passive: false })
    document.addEventListener('pointerup',   onPointerUp)
    document.addEventListener('touchend',    onPointerUp, { passive: true })
    document.addEventListener('pointercancel', limpiar)
  }

  function onPointerMove(e: PointerEvent): void {
    if (indicePendiente === null) return
    const dx = e.clientX - startX
    const dy = e.clientY - startY
    if (!arrastrando && Math.hypot(dx, dy) < UMBRAL_DRAG) return

    if (!arrastrando) {
      // FIN nunca se arrastra -- mantener indicePendiente para el tap
      if (bloques.value[indicePendiente!]?.tipo === 'FIN') return
      arrastrando = true
      indiceDrag.value = indicePendiente
    }

    e.preventDefault()
    ghostX.value = e.clientX
    ghostY.value = e.clientY
    calcularDestino(e.clientY)
  }

  function calcularDestino(clientY: number): void {
    const n   = bloques.value.length
    const els = getBlockEls()
    // El bloque FIN (último) no es destino válido -- máx = n-2
    let destino = n - 2

    for (let i = 0; i < n - 1; i++) {
      if (i === indiceDrag.value) continue
      const el = els[i]
      if (!el) continue
      const rect = el.getBoundingClientRect()
      if (clientY < rect.top + rect.height / 2) {
        destino = i
        break
      }
      destino = Math.min(i + 1, n - 2)
    }

    indiceDestino.value = Math.max(0, Math.min(destino, n - 2))
  }

  function onPointerUp(): void {
    const fueArrastre  = arrastrando
    const indiceOrigen = indiceDrag.value
    const destinoFinal = indiceDestino.value
    if (fueArrastre && indiceOrigen !== null && destinoFinal !== null && indiceOrigen !== destinoFinal) {
      const bloque = bloques.value.splice(indiceOrigen, 1)[0]!
      bloques.value.splice(destinoFinal, 0, bloque)
      bloques.value.forEach((b, i) => { b.orden = i + 1 })
    }

    limpiar()
  }

  function limpiar(): void {
    indiceDrag.value    = null
    indiceDestino.value = null
    arrastrando         = false
    indicePendiente     = null
    document.removeEventListener('pointermove',   onPointerMove)
    document.removeEventListener('pointerup',     onPointerUp)
    document.removeEventListener('touchend',      onPointerUp)
    document.removeEventListener('pointercancel', limpiar)
  }

  return { indiceDrag, indiceDestino, ghostX, ghostY, onPointerDown }
}
