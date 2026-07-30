/** Vista previa del modo letra con la fuente seleccionada. */

import { LYRICS_FONT_PREVIEW_LINES, type LyricsFontOption } from '@features/customization'

interface LyricsFontPreviewPanelProps {
  font: LyricsFontOption
  isLoading?: boolean
}

const PREVIEW_VARIANT_CLASS: Record<
  (typeof LYRICS_FONT_PREVIEW_LINES)[number]['variant'],
  string
> = {
  past: 'lyrics-font-preview__line lyrics-font-preview__line--past',
  active: 'lyrics-font-preview__line lyrics-font-preview__line--active',
  next: 'lyrics-font-preview__line lyrics-font-preview__line--next',
}

/**
 * Muestra líneas de ejemplo con el estilo del panel de letras sincronizadas.
 */
export function LyricsFontPreviewPanel({
  font,
  isLoading = false,
}: LyricsFontPreviewPanelProps) {
  return (
    <section
      className={[
        'lyrics-font-preview',
        isLoading ? 'lyrics-font-preview--loading' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label="Vista previa de la fuente"
      aria-busy={isLoading}
    >
      <p className="lyrics-font-preview__heading montserrat-regular">Vista previa</p>

      <div className="lyrics-font-preview__sample" style={{ fontFamily: font.fontFamily }}>
        {LYRICS_FONT_PREVIEW_LINES.map((line) => (
          <p key={line.variant} className={PREVIEW_VARIANT_CLASS[line.variant]}>
            {line.text}
          </p>
        ))}
      </div>
    </section>
  )
}
