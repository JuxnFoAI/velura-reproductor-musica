/** Subsecciones disponibles dentro de Personalización del menú de ajustes. */

export type CustomizationSubSection =
  | 'root'
  | 'background'
  | 'player-colors'
  | 'fonts'
  | 'font-size'
  | 'dynamic-island'

export type CustomizationDestination = Exclude<CustomizationSubSection, 'root'>

export interface CustomizationNavOption {
  id: CustomizationDestination
  label: string
}

export const CUSTOMIZATION_OPTIONS: readonly CustomizationNavOption[] = [
  { id: 'background', label: 'Fondo' },
  { id: 'player-colors', label: 'Colores del reproductor' },
  { id: 'dynamic-island', label: 'Isla dinámica' },
  { id: 'fonts', label: 'Fuentes' },
  { id: 'font-size', label: 'Tamaño de las fuentes' },
] as const

export const CUSTOMIZATION_SUBSECTION_TITLES: Record<CustomizationSubSection, string> = {
  root: 'PERSONALIZACIÓN',
  background: 'FONDO',
  'player-colors': 'COLORES DEL REPRODUCTOR',
  'dynamic-island': 'ISLA DINÁMICA',
  fonts: 'FUENTES',
  'font-size': 'TAMAÑO DE LAS FUENTES',
}
