export function formatearTag(valor: string): string {
  return valor
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

export function claseChipCategoria(categoria: string | undefined | null): string {
  switch (categoria?.toUpperCase()) {
    case 'ENTRANTE':  return 'chip-categoria--entrante'
    case 'PRINCIPAL': return 'chip-categoria--principal'
    case 'POSTRE':    return 'chip-categoria--postre'
    case 'APERITIVO': return 'chip-categoria--aperitivo'
    default:          return ''
  }
}

export function iconoCategoria(categoria: string | undefined | null): string {
  switch (categoria?.toUpperCase()) {
    case 'ENTRANTE':  return 'mdi-leaf-circle-outline'
    case 'PRINCIPAL': return 'mdi-silverware-fork-knife'
    case 'POSTRE':    return 'mdi-cake-variant-outline'
    case 'APERITIVO': return 'mdi-glass-wine'
    default:          return 'mdi-food-outline'
  }
}

export function claseChipEstilo(estilo: string | undefined | null): string {
  switch (estilo?.toUpperCase()) {
    case 'MEDITERRANEO': return 'chip-estilo--mediterraneo'
    case 'ASIATICO':     return 'chip-estilo--asiatico'
    case 'LATINO':       return 'chip-estilo--latino'
    case 'NORDICO':      return 'chip-estilo--nordico'
    case 'FUSION':       return 'chip-estilo--fusion'
    default:             return ''
  }
}
