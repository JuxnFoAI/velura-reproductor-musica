/** Destinos de la sección de personalización dentro de Ajustes. */

export type CustomizationSubSection =
  | 'root'
  | 'background'
  | 'player-colors'
  | 'fonts'
  | 'font-size'

export type CustomizationDestination = Exclude<CustomizationSubSection, 'root'>

export interface CustomizationNavOption {
  id: CustomizationDestination
  label: string
}

export const CUSTOMIZATION_OPTIONS: readonly CustomizationNavOption[] = [
  { id: 'background', label: 'Fondo' },
  { id: 'player-colors', label: 'Colores del reproductor' },
  { id: 'fonts', label: 'Fuentes' },
  { id: 'font-size', label: 'Tamaño de las fuentes' },
] as const

export const CUSTOMIZATION_SUBSECTION_TITLES: Record<CustomizationSubSection, string> = {
  root: 'PERSONALIZACIÓN',
  background: 'FONDO',
  'player-colors': 'COLORES DEL REPRODUCTOR',
  fonts: 'FUENTES',
  'font-size': 'TAMAÑO DE LAS FUENTES',
}
