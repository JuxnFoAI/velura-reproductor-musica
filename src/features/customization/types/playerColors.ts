/** Tipos y catálogo de colores personalizables del reproductor. */

export type PlayerColorCategory = 'letter' | 'button'

export type PlayerLetterColorId = 'default' | 'warm' | 'mint' | 'lavender' | 'gold' | 'rose'

export type PlayerButtonColorId = 'default' | 'green' | 'purple' | 'orange' | 'red' | 'pink'

export interface PlayerLetterColorOption {
  id: PlayerLetterColorId
  label: string
  swatch: string
  text: string
  textMuted: string
  lyricsActive: string
  lyricsMuted: string
}

export interface PlayerButtonColorOption {
  id: PlayerButtonColorId
  label: string
  swatch: string
  value: string
}

export const DEFAULT_PLAYER_LETTER_COLOR_ID: PlayerLetterColorId = 'default'
export const DEFAULT_PLAYER_BUTTON_COLOR_ID: PlayerButtonColorId = 'default'

export const PLAYER_COLOR_CATEGORY_LABELS: Record<PlayerColorCategory, string> = {
  letter: 'Color de letra',
  button: 'Color de botones',
}

export const PLAYER_COLOR_CATEGORY_ORDER: readonly PlayerColorCategory[] = [
  'letter',
  'button',
] as const

export const PLAYER_LETTER_COLOR_OPTIONS: readonly PlayerLetterColorOption[] = [
  {
    id: 'default',
    label: 'Predeterminado',
    swatch: '#f1f5f9',
    text: '#f1f5f9',
    textMuted: '#cbd5e1',
    lyricsActive: '#ffffff',
    lyricsMuted: '#64748b',
  },
  {
    id: 'warm',
    label: 'Cálido',
    swatch: '#fef3c7',
    text: '#fef3c7',
    textMuted: '#fcd34d',
    lyricsActive: '#fffbeb',
    lyricsMuted: '#a16207',
  },
  {
    id: 'mint',
    label: 'Menta',
    swatch: '#6ee7b7',
    text: '#d1fae5',
    textMuted: '#6ee7b7',
    lyricsActive: '#ecfdf5',
    lyricsMuted: '#047857',
  },
  {
    id: 'lavender',
    label: 'Lavanda',
    swatch: '#c4b5fd',
    text: '#e9d5ff',
    textMuted: '#c4b5fd',
    lyricsActive: '#f5f3ff',
    lyricsMuted: '#7c3aed',
  },
  {
    id: 'gold',
    label: 'Dorado',
    swatch: '#fbbf24',
    text: '#fde68a',
    textMuted: '#fbbf24',
    lyricsActive: '#fffbeb',
    lyricsMuted: '#b45309',
  },
  {
    id: 'rose',
    label: 'Rosa',
    swatch: '#fda4af',
    text: '#fecdd3',
    textMuted: '#fda4af',
    lyricsActive: '#fff1f2',
    lyricsMuted: '#be123c',
  },
] as const

export const PLAYER_BUTTON_COLOR_OPTIONS: readonly PlayerButtonColorOption[] = [
  { id: 'default', label: 'Predeterminado', swatch: '#4bb8fa', value: '#4bb8fa' },
  { id: 'green', label: 'Verde', swatch: '#08cb00', value: '#08cb00' },
  { id: 'purple', label: 'Morado', swatch: '#a855f7', value: '#a855f7' },
  { id: 'orange', label: 'Naranja', swatch: '#f97316', value: '#f97316' },
  { id: 'red', label: 'Rojo', swatch: '#ef4444', value: '#ef4444' },
  { id: 'pink', label: 'Rosa', swatch: '#ec4899', value: '#ec4899' },
] as const

export function getPlayerLetterColorById(
  colorId: PlayerLetterColorId,
): PlayerLetterColorOption | undefined {
  return PLAYER_LETTER_COLOR_OPTIONS.find((option) => option.id === colorId)
}

export function getPlayerButtonColorById(
  colorId: PlayerButtonColorId,
): PlayerButtonColorOption | undefined {
  return PLAYER_BUTTON_COLOR_OPTIONS.find((option) => option.id === colorId)
}

export function isPlayerLetterColorId(value: unknown): value is PlayerLetterColorId {
  return (
    typeof value === 'string' &&
    PLAYER_LETTER_COLOR_OPTIONS.some((option) => option.id === value)
  )
}

export function isPlayerButtonColorId(value: unknown): value is PlayerButtonColorId {
  return (
    typeof value === 'string' &&
    PLAYER_BUTTON_COLOR_OPTIONS.some((option) => option.id === value)
  )
}
