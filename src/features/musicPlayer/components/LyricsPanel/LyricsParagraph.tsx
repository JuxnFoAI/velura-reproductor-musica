/** Párrafo individual del panel de letras con resaltado de línea activa. */
import { memo } from 'react'
import type { LyricsLine } from '../../types/lyrics'

export type LyricsLineSlot = 'active' | 'past' | 'next' | 'preview'

const LYRICS_PARAGRAPH_SLOT_CLASS: Record<LyricsLineSlot, string> = {
  active: 'lyrics-panel__paragraph lyrics-panel__paragraph--active',
  past: 'lyrics-panel__paragraph lyrics-panel__paragraph--past',
  next: 'lyrics-panel__paragraph lyrics-panel__paragraph--next',
  preview: 'lyrics-panel__paragraph lyrics-panel__paragraph--preview',
}

interface LyricsParagraphProps {
  line: LyricsLine
  slot: LyricsLineSlot
  isActive: boolean
  lineRef?: (element: HTMLParagraphElement | null) => void
}

/**
 * Renderiza un párrafo de letra con estilo según su distancia respecto a la línea activa.
 */
export const LyricsParagraph = memo(function LyricsParagraph({
  line,
  slot,
  isActive,
  lineRef,
}: LyricsParagraphProps) {
  const visualSlot: LyricsLineSlot = isActive ? 'active' : slot
  const paragraphClassName = LYRICS_PARAGRAPH_SLOT_CLASS[visualSlot]

  return (
    <p ref={lineRef} className={paragraphClassName} aria-current={isActive ? 'true' : undefined}>
      {line.text}
    </p>
  )
})
