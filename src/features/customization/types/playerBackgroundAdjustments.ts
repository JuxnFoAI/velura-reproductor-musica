/** Tipos y valores por defecto de los ajustes del fondo personalizado. */

export interface PlayerBackgroundAdjustments {
  brightness: number
  contrast: number
  tone: number
  blur: number
}

export const BACKGROUND_ADJUSTMENT_MIN = -10
export const BACKGROUND_ADJUSTMENT_MAX = 10
export const BACKGROUND_ADJUSTMENT_STEP = 1

export const DEFAULT_PLAYER_BACKGROUND_ADJUSTMENTS: PlayerBackgroundAdjustments = {
  brightness: 0,
  contrast: 0,
  tone: 0,
  blur: 0,
}

const ADJUSTMENT_KEYS: readonly (keyof PlayerBackgroundAdjustments)[] = [
  'brightness',
  'contrast',
  'tone',
  'blur',
]

/**
 * Limita un valor de ajuste al rango permitido (-10 a 10).
 */
export function clampBackgroundAdjustment(value: number): number {
  return Math.min(BACKGROUND_ADJUSTMENT_MAX, Math.max(BACKGROUND_ADJUSTMENT_MIN, Math.round(value)))
}

/**
 * Normaliza un objeto parcial o desconocido a ajustes válidos.
 */
export function normalizePlayerBackgroundAdjustments(
  value: unknown,
): PlayerBackgroundAdjustments {
  if (typeof value !== 'object' || value === null) {
    return { ...DEFAULT_PLAYER_BACKGROUND_ADJUSTMENTS }
  }

  const record = value as Partial<Record<keyof PlayerBackgroundAdjustments, unknown>>

  return {
    brightness:
      typeof record.brightness === 'number'
        ? clampBackgroundAdjustment(record.brightness)
        : DEFAULT_PLAYER_BACKGROUND_ADJUSTMENTS.brightness,
    contrast:
      typeof record.contrast === 'number'
        ? clampBackgroundAdjustment(record.contrast)
        : DEFAULT_PLAYER_BACKGROUND_ADJUSTMENTS.contrast,
    tone:
      typeof record.tone === 'number'
        ? clampBackgroundAdjustment(record.tone)
        : DEFAULT_PLAYER_BACKGROUND_ADJUSTMENTS.tone,
    blur:
      typeof record.blur === 'number'
        ? clampBackgroundAdjustment(record.blur)
        : DEFAULT_PLAYER_BACKGROUND_ADJUSTMENTS.blur,
  }
}

/**
 * Comprueba si dos conjuntos de ajustes son equivalentes.
 */
export function arePlayerBackgroundAdjustmentsEqual(
  left: PlayerBackgroundAdjustments,
  right: PlayerBackgroundAdjustments,
): boolean {
  return ADJUSTMENT_KEYS.every((key) => left[key] === right[key])
}

/**
 * Formatea un valor de ajuste para mostrarlo en la UI.
 */
export function formatBackgroundAdjustmentValue(value: number): string {
  if (value > 0) {
    return `+${value}`
  }

  return value.toString()
}
