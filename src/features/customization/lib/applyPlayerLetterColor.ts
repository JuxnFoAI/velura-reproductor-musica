/** Aplica el color de letra seleccionado al reproductor mediante CSS variables. */

import type { PlayerLetterColorOption } from '../types/playerColors'

const PLAYER_TEXT_VARIABLE = '--player-text'
const PLAYER_TEXT_MUTED_VARIABLE = '--player-text-muted'
const LYRICS_WORD_ACTIVE_VARIABLE = '--lyrics-word-active'
const LYRICS_LINE_MUTED_VARIABLE = '--lyrics-line-muted'

/**
 * Actualiza las variables CSS de texto y letras sincronizadas.
 */
export function applyPlayerLetterColor(color: PlayerLetterColorOption): void {
  document.documentElement.style.setProperty(PLAYER_TEXT_VARIABLE, color.text)
  document.documentElement.style.setProperty(PLAYER_TEXT_MUTED_VARIABLE, color.textMuted)
  document.documentElement.style.setProperty(LYRICS_WORD_ACTIVE_VARIABLE, color.lyricsActive)
  document.documentElement.style.setProperty(LYRICS_LINE_MUTED_VARIABLE, color.lyricsMuted)
}
