/** Subsecciones disponibles dentro de Ajustes del menú principal push. */

export type SettingsSubSection =
  | 'root'
  | 'music-library'
  | 'audio-quality'
  | 'customization'
  | 'about'

export type SettingsDestination = Exclude<SettingsSubSection, 'root'>

export interface SettingsNavOption {
  id: SettingsDestination
  label: string
}

export const SETTINGS_OPTIONS: readonly SettingsNavOption[] = [
  { id: 'audio-quality', label: 'Calidad del audio' },
  { id: 'customization', label: 'Personalización' },
  { id: 'music-library', label: 'Biblioteca musical' },
  { id: 'about', label: 'Acerca de' },
] as const

export const SETTINGS_SUBSECTION_TITLES: Record<SettingsSubSection, string> = {
  root: 'AJUSTES',
  'music-library': 'BIBLIOTECA MUSICAL',
  'audio-quality': 'CALIDAD DEL AUDIO',
  customization: 'PERSONALIZACIÓN',
  about: 'ACERCA DE',
}
