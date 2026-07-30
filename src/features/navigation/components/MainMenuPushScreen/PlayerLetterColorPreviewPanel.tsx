/** Vista previa del color de letra seleccionado para el reproductor. */

import { LYRICS_FONT_PREVIEW_LINES, type PlayerLetterColorOption } from '@features/customization'

interface PlayerLetterColorPreviewPanelProps {
  color: PlayerLetterColorOption
}

const PREVIEW_VARIANT_CLASS: Record<
  (typeof LYRICS_FONT_PREVIEW_LINES)[number]['variant'],
  string
> = {
  past: 'player-letter-color-preview__line player-letter-color-preview__line--past',
  active: 'player-letter-color-preview__line player-letter-color-preview__line--active',
  next: 'player-letter-color-preview__line player-letter-color-preview__line--next',
}

/**
 * Muestra texto de ejemplo con los colores de letra del reproductor.
 */
export function PlayerLetterColorPreviewPanel({ color }: PlayerLetterColorPreviewPanelProps) {
  const lineColors: Record<(typeof LYRICS_FONT_PREVIEW_LINES)[number]['variant'], string> = {
    past: color.lyricsMuted,
    active: color.lyricsActive,
    next: color.lyricsMuted,
  }

  return (
    <section className="player-letter-color-preview" aria-label="Vista previa del color de letra">
      <p className="player-letter-color-preview__heading montserrat-regular">Vista previa</p>

      <p
        className="player-letter-color-preview__title montserrat-regular"
        style={{ color: color.text }}
      >
        Título de canción
      </p>

      <p
        className="player-letter-color-preview__subtitle montserrat-regular"
        style={{ color: color.textMuted }}
      >
        Artista de ejemplo
      </p>

      <div
        className="player-letter-color-preview__sample"
        style={{ fontFamily: 'var(--lyrics-font-family)' }}
      >
        {LYRICS_FONT_PREVIEW_LINES.map((line) => (
          <p
            key={line.variant}
            className={PREVIEW_VARIANT_CLASS[line.variant]}
            style={{ color: lineColors[line.variant] }}
          >
            {line.text}
          </p>
        ))}
      </div>
    </section>
  )
}
