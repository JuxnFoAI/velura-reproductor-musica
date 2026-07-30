/** Vista previa del color de botones seleccionado para el reproductor. */

import { Play } from 'lucide-react'

import type { PlayerButtonColorOption } from '@features/customization'

interface PlayerButtonColorPreviewPanelProps {
  color: PlayerButtonColorOption
}

/**
 * Muestra controles de ejemplo con el color de botones del reproductor.
 */
export function PlayerButtonColorPreviewPanel({ color }: PlayerButtonColorPreviewPanelProps) {
  return (
    <section className="player-button-color-preview" aria-label="Vista previa del color de botones">
      <p className="player-button-color-preview__heading montserrat-regular">Vista previa</p>

      <div className="player-button-color-preview__controls">
        <span
          className="player-button-color-preview__play-icon"
          style={{ color: color.value }}
          aria-hidden="true"
        >
          <Play size={28} fill="currentColor" strokeWidth={0} />
        </span>

        <button
          type="button"
          className="player-button-color-preview__button montserrat-regular"
          style={{
            borderColor: `${color.value}73`,
            backgroundColor: `${color.value}1f`,
            color: color.value,
          }}
          tabIndex={-1}
          aria-hidden="true"
        >
          Botón de ejemplo
        </button>
      </div>
    </section>
  )
}
