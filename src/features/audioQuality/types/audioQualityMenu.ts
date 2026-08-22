/** Destinos de la sección de calidad del audio dentro de Ajustes. */

export type AudioQualitySubSection = 'root' | 'equalizer' | 'volume-normalization'

export type AudioQualityDestination = Exclude<AudioQualitySubSection, 'root'>

export interface AudioQualityNavOption {
  id: AudioQualityDestination
  label: string
}

export const AUDIO_QUALITY_OPTIONS: readonly AudioQualityNavOption[] = [
  { id: 'equalizer', label: 'Ecualizador' },
  { id: 'volume-normalization', label: 'Normalización de volumen' },
] as const

export const AUDIO_QUALITY_SUBSECTION_TITLES: Record<AudioQualitySubSection, string> = {
  root: 'CALIDAD DEL AUDIO',
  equalizer: 'ECUALIZADOR',
  'volume-normalization': 'NORMALIZACIÓN DE VOLUMEN',
}
