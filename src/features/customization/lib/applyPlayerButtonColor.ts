/** Aplica el color de botones seleccionado al reproductor mediante CSS variables. */

import type { PlayerButtonColorOption } from '../types/playerColors'

const PLAYER_PLAY_BUTTON_VARIABLE = '--player-play-button'

/**
 * Actualiza la variable CSS usada por botones y acentos del reproductor.
 */
export function applyPlayerButtonColor(color: PlayerButtonColorOption): void {
  document.documentElement.style.setProperty(PLAYER_PLAY_BUTTON_VARIABLE, color.value)
}
