/** Aplica el tamaño tipográfico seleccionado al modo letra mediante CSS variables. */

import type { LyricsFontSizeOption } from '../types/lyricsFontSizes'

const LYRICS_FONT_SIZE_MIN_VARIABLE = '--lyrics-font-size-min'
const LYRICS_FONT_SIZE_PREFERRED_VARIABLE = '--lyrics-font-size-preferred'
const LYRICS_FONT_SIZE_MAX_VARIABLE = '--lyrics-font-size-max'

/**
 * Actualiza las variables CSS usadas por el panel de letras sincronizadas.
 */
export function applyLyricsFontSize(size: LyricsFontSizeOption): void {
  document.documentElement.style.setProperty(LYRICS_FONT_SIZE_MIN_VARIABLE, size.min)
  document.documentElement.style.setProperty(
    LYRICS_FONT_SIZE_PREFERRED_VARIABLE,
    size.preferred,
  )
  document.documentElement.style.setProperty(LYRICS_FONT_SIZE_MAX_VARIABLE, size.max)
}
