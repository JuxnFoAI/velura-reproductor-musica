/** Panel de letras sincronizadas visible tras la animación de desplazamiento. */
import { memo } from 'react'
import { useLyricsSlideComplete } from '../../hooks/useLyricsSlideComplete'
import { useTrackLyrics } from '../../hooks/useTrackLyrics'
import { usePlayerStore } from '../../store/playerStore'
import { LyricsLineList } from './LyricsLineList'

interface LyricsPanelProps {
  className?: string
}

/**
 * Muestra hasta 3 párrafos de letra con carrusel vertical y línea activa resaltada.
 */
export const LyricsPanel = memo(function LyricsPanel({ className }: LyricsPanelProps) {
  const isLyricsVisible = usePlayerStore((state) => state.isLyricsVisible)
  const currentTime = usePlayerStore((state) => state.currentTime)
  const duration = usePlayerStore((state) => state.duration)
  const currentTrack = usePlayerStore((state) => state.currentTrack)
  const isSlideComplete = useLyricsSlideComplete(isLyricsVisible)

  const { parsedLyrics, status } = useTrackLyrics(
    currentTrack?.id,
    currentTrack?.lyricsRelativePath,
    duration,
  )

  if (!isLyricsVisible || !isSlideComplete || !currentTrack) {
    return null
  }

  const panelClassName = ['lyrics-panel', className ?? ''].filter(Boolean).join(' ')

  if (status === 'loading') {
    return (
      <aside className={panelClassName} aria-label="Letra de la canción" aria-busy="true">
        <p className="lyrics-panel__status montserrat-regular">Cargando letra…</p>
      </aside>
    )
  }

  if (status === 'error') {
    return (
      <aside className={panelClassName} aria-label="Letra de la canción">
        <p className="lyrics-panel__status montserrat-regular">No se pudo cargar la letra.</p>
      </aside>
    )
  }

  if (status === 'missing' || !parsedLyrics || parsedLyrics.lines.length === 0) {
    return (
      <aside className={panelClassName} aria-label="Letra de la canción">
        <p className="lyrics-panel__status montserrat-regular">
          Esta canción no tiene letra disponible.
        </p>
      </aside>
    )
  }

  return (
    <aside className={panelClassName} aria-label="Letra de la canción" aria-live="polite">
      <LyricsLineList
        lines={parsedLyrics.lines}
        currentTime={currentTime}
        trackDuration={duration}
      />
    </aside>
  )
})
