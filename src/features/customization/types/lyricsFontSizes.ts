/** Tipos y catálogo de tamaños disponibles para el modo letra. */

export type LyricsFontSizeId = 'small' | 'medium' | 'large' | 'extra-large'

export interface LyricsFontSizeOption {
  id: LyricsFontSizeId
  label: string
  min: string
  preferred: string
  max: string
}

export const DEFAULT_LYRICS_FONT_SIZE_ID: LyricsFontSizeId = 'medium'

export const LYRICS_FONT_SIZE_OPTIONS: readonly LyricsFontSizeOption[] = [
  {
    id: 'small',
    label: 'Pequeño',
    min: '1rem',
    preferred: '2vw',
    max: '1.5rem',
  },
  {
    id: 'medium',
    label: 'Mediano',
    min: '1.1875rem',
    preferred: '2.35vw',
    max: '1.875rem',
  },
  {
    id: 'large',
    label: 'Grande',
    min: '1.375rem',
    preferred: '2.7vw',
    max: '2.125rem',
  },
  {
    id: 'extra-large',
    label: 'Muy grande',
    min: '1.5625rem',
    preferred: '3.05vw',
    max: '2.375rem',
  },
] as const

/**
 * Obtiene un tamaño del catálogo por identificador.
 */
export function getLyricsFontSizeById(
  sizeId: LyricsFontSizeId,
): LyricsFontSizeOption | undefined {
  return LYRICS_FONT_SIZE_OPTIONS.find((option) => option.id === sizeId)
}

/**
 * Comprueba si un valor es un identificador de tamaño válido.
 */
export function isLyricsFontSizeId(value: unknown): value is LyricsFontSizeId {
  return (
    typeof value === 'string' &&
    LYRICS_FONT_SIZE_OPTIONS.some((option) => option.id === value)
  )
}
