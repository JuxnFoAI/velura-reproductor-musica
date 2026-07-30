/** Aplica la familia tipográfica seleccionada al modo letra mediante CSS variables. */

const LYRICS_FONT_FAMILY_VARIABLE = '--lyrics-font-family'

/**
 * Actualiza la variable CSS usada por el panel de letras sincronizadas.
 */
export function applyLyricsFontFamily(fontFamily: string): void {
  document.documentElement.style.setProperty(LYRICS_FONT_FAMILY_VARIABLE, fontFamily)
}
