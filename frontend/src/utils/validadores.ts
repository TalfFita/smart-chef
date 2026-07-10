const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function esEmailValido(email: string): boolean {
  return regexEmail.test(email)
}
