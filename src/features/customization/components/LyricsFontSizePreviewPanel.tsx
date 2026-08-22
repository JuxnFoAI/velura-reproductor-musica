/** Vista previa del modo letra con el tamaño seleccionado. */

import { LYRICS_FONT_PREVIEW_LINES } from '../types/lyricsFonts'
import type { LyricsFontSizeOption } from '../types/lyricsFontSizes'

interface LyricsFontSizePreviewPanelProps {
  size: LyricsFontSizeOption
}

const PREVIEW_VARIANT_CLASS: Record<
  (typeof LYRICS_FONT_PREVIEW_LINES)[number]['variant'],
  string
> = {
  past: 'lyrics-font-size-preview__line lyrics-font-size-preview__line--past',
  active: 'lyrics-font-size-preview__line lyrics-font-size-preview__line--active',
  next: 'lyrics-font-size-preview__line lyrics-font-size-preview__line--next',
}

/**
 * Muestra líneas de ejemplo con el tamaño tipográfico del panel de letras.
 */
export function LyricsFontSizePreviewPanel({ size }: LyricsFontSizePreviewPanelProps) {
  const previewFontSize = `clamp(${size.min}, ${size.preferred}, ${size.max})`

  return (
    <section className="lyrics-font-size-preview" aria-label="Vista previa del tamaño">
      <p className="lyrics-font-size-preview__heading montserrat-regular">Vista previa</p>

      <div
        className="lyrics-font-size-preview__sample"
        style={{
          fontFamily: 'var(--lyrics-font-family)',
          fontSize: previewFontSize,
        }}
      >
        {LYRICS_FONT_PREVIEW_LINES.map((line) => (
          <p key={line.variant} className={PREVIEW_VARIANT_CLASS[line.variant]}>
            {line.text}
          </p>
        ))}
      </div>
    </section>
  )
}
