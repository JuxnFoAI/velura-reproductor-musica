/** Construye la cadena CSS filter para el fondo personalizado del reproductor. */

import type { PlayerBackgroundAdjustments } from '../types/playerBackgroundAdjustments'

const BASE_BLUR_PX = 48
const BLUR_STEP_PX = 4.8
const BRIGHTNESS_STEP = 0.08
const MIN_BRIGHTNESS = 0.2
const CONTRAST_STEP = 0.08
const MIN_CONTRAST = 0.2
const TONE_STEP_DEG = 18
const PREVIEW_BLUR_SCALE = 0.45

interface BuildCustomBackgroundImageFilterOptions {
  preview?: boolean
}

/**
 * Traduce los ajustes del usuario (-10..10) a filtros CSS aplicables a la imagen.
 */
export function buildCustomBackgroundImageFilter(
  adjustments: PlayerBackgroundAdjustments,
  options: BuildCustomBackgroundImageFilterOptions = {},
): string {
  const blurScale = options.preview ? PREVIEW_BLUR_SCALE : 1
  const blurPx = Math.max(0, BASE_BLUR_PX + adjustments.blur * BLUR_STEP_PX) * blurScale
  const brightness = Math.max(MIN_BRIGHTNESS, 1 + adjustments.brightness * BRIGHTNESS_STEP)
  const contrast = Math.max(MIN_CONTRAST, 1 + adjustments.contrast * CONTRAST_STEP)
  const hueRotateDeg = adjustments.tone * TONE_STEP_DEG

  return `blur(${blurPx}px) brightness(${brightness}) contrast(${contrast}) hue-rotate(${hueRotateDeg}deg)`
}
