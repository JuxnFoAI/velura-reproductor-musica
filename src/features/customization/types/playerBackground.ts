/** Tipos y catálogo de modos de fondo del reproductor. */

export type PlayerBackgroundMode = 'track-art' | 'custom'

export interface PlayerBackgroundOption {
  id: PlayerBackgroundMode
  label: string
  description: string
}

export const DEFAULT_PLAYER_BACKGROUND_MODE: PlayerBackgroundMode = 'track-art'

export const PLAYER_BACKGROUND_OPTIONS: readonly PlayerBackgroundOption[] = [
  {
    id: 'track-art',
    label: 'Predeterminado',
    description: 'Las portadas de tus canciones se muestran de fondo y cambian con cada pista.',
  },
  {
    id: 'custom',
    label: 'Cambiar fondo',
    description: 'Usa una imagen personalizada como fondo del reproductor.',
  },
] as const

/**
 * Comprueba si un valor es un modo de fondo válido.
 */
export function isPlayerBackgroundMode(value: unknown): value is PlayerBackgroundMode {
  return (
    typeof value === 'string' &&
    PLAYER_BACKGROUND_OPTIONS.some((option) => option.id === value)
  )
}
