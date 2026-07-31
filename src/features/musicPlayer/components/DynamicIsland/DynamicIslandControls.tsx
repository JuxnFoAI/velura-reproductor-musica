/** Controles compactos del reproductor para la isla dinámica (sin letra). */
import { memo } from 'react'
import { Shuffle, SkipBack, SkipForward } from 'lucide-react'
import { PlayPauseButton } from '../PlayerControls/PlayPauseButton'
import { ProgressBar } from '../PlayerControls/ProgressBar'
import { VolumeControl } from '../PlayerControls/VolumeControl'
import { ControlButton } from '../PlayerControls/ControlButton'
import { useTransportControls } from '../../hooks/useTransportControls'

/**
 * Barra de progreso y controles de transporte para la isla expandida.
 */
export const DynamicIslandControls = memo(function DynamicIslandControls() {
  const {
    isDisabled,
    isPlaying,
    isShuffle,
    repeatMode,
    RepeatIcon,
    repeatLabel,
    toggleShuffle,
    previous,
    next,
    cycleRepeatMode,
    handlePlayPause,
  } = useTransportControls()

  return (
    <div className="dynamic-island__controls flex w-full flex-col gap-3">
      <ProgressBar disabled={isDisabled} showTimeLabels />

      <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2">
        <VolumeControl className="justify-self-start" disabled={isDisabled} />

        <div className="flex items-center justify-center gap-1">
          <ControlButton
            ariaLabel={
              isShuffle ? 'Desactivar reproducción aleatoria' : 'Activar reproducción aleatoria'
            }
            isActive={isShuffle}
            disabled={isDisabled}
            onClick={toggleShuffle}
          >
            <Shuffle size={16} aria-hidden="true" />
          </ControlButton>

          <ControlButton ariaLabel="Pista anterior" disabled={isDisabled} onClick={previous}>
            <SkipBack size={18} aria-hidden="true" />
          </ControlButton>

          <PlayPauseButton
            isPlaying={isPlaying}
            disabled={isDisabled}
            onClick={handlePlayPause}
          />

          <ControlButton ariaLabel="Siguiente pista" disabled={isDisabled} onClick={next}>
            <SkipForward size={18} aria-hidden="true" />
          </ControlButton>

          <ControlButton
            ariaLabel={repeatLabel}
            isActive={repeatMode !== 'none'}
            disabled={isDisabled}
            onClick={cycleRepeatMode}
          >
            <RepeatIcon size={16} aria-hidden="true" />
          </ControlButton>
        </div>

        <span
          className="w-[var(--player-control-hit-size)] shrink-0 justify-self-end"
          aria-hidden="true"
        />
      </div>
    </div>
  )
})
