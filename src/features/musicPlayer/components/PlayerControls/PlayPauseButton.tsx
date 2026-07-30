/** Botón animado de reproducción/pausa con morphing entre iconos. */
import { memo } from 'react'

interface PlayPauseButtonProps {
  isPlaying: boolean
  disabled?: boolean
  onClick: () => void
}

/**
 * Botón con transición morph entre play y pausa mediante clip-path.
 */
export const PlayPauseButton = memo(function PlayPauseButton({
  isPlaying,
  disabled = false,
  onClick,
}: PlayPauseButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
      aria-pressed={isPlaying}
      aria-disabled={disabled}
      className={`play-pause-button ${isPlaying ? 'play-pause-button--active' : ''}`}
    >
      <span className="play-pause-button__icon" aria-hidden="true">
        <span className="play-pause-button__part play-pause-button__part--left" />
        <span className="play-pause-button__part play-pause-button__part--right" />
      </span>
    </button>
  )
})
