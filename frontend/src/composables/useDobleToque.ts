export function useDobleToque(callback: () => void, umbralMs = 500) {
  let ultimoToque = 0

  function manejarTouchStart(e: TouchEvent) {
    e.stopPropagation()
    const ahora = Date.now()
    if (ahora - ultimoToque < umbralMs) {
      e.preventDefault()
      callback()
      ultimoToque = 0
    } else {
      ultimoToque = ahora
    }
  }

  return { manejarTouchStart }
}
