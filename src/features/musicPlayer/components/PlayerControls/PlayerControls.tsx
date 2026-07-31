/** Controles principales de reproducción del reproductor de música. */
import { memo } from 'react'
import { Shuffle, SkipBack, SkipForward } from 'lucide-react'
import { LyricsToggleButton } from './LyricsToggleButton'
import { FavoriteButton } from './FavoriteButton'
import { FullscreenButton } from './FullscreenButton'
import { PlayPauseButton } from './PlayPauseButton'
import { ProgressBar } from './ProgressBar'
import { VolumeControl } from './VolumeControl'
import { ControlButton } from './ControlButton'
import { useTransportControls } from '../../hooks/useTransportControls'
import { useDesktopFullscreen } from '../../hooks/useDesktopFullscreen'
import { usePlayerStore } from '../../store/playerStore'

interface PlayerControlsProps {
  className?: string
}

/**
 * Agrupa los controles de reproducción y progreso.
 */
export const PlayerControls = memo(function PlayerControls({ className }: PlayerControlsProps) {
  const currentTrack = usePlayerStore((state) => state.currentTrack)
  const isLyricsVisible = usePlayerStore((state) => state.isLyricsVisible)
  const toggleLyrics = usePlayerStore((state) => state.toggleLyrics)
  const toggleFavorite = usePlayerStore((state) => state.toggleFavorite)
  const favoriteTrackIds = usePlayerStore((state) => state.favoriteTrackIds)

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

  const { isAvailable: isFullscreenAvailable, isFullscreen, toggleFullscreen } =
    useDesktopFullscreen()

  const isFavorite = currentTrack !== null && favoriteTrackIds.includes(currentTrack.id)

  return (
    <section
      className={`flex w-full flex-col gap-2 ${className ?? ''}`}
      aria-label="Controles del reproductor"
    >
      <ProgressBar disabled={isDisabled} />

      <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center">
        <VolumeControl className="flex justify-self-start" disabled={isDisabled} />

        <div className="flex items-center justify-center gap-3">
          <ControlButton
            ariaLabel={
              isShuffle ? 'Desactivar reproducción aleatoria' : 'Activar reproducción aleatoria'
            }
            isActive={isShuffle}
            disabled={isDisabled}
            onClick={toggleShuffle}
          >
            <Shuffle size={18} aria-hidden="true" />
          </ControlButton>

          <ControlButton ariaLabel="Pista anterior" disabled={isDisabled} onClick={previous}>
            <SkipBack size={20} aria-hidden="true" />
          </ControlButton>

          <PlayPauseButton
            isPlaying={isPlaying}
            disabled={isDisabled}
            onClick={handlePlayPause}
          />

          <ControlButton ariaLabel="Siguiente pista" disabled={isDisabled} onClick={next}>
            <SkipForward size={20} aria-hidden="true" />
          </ControlButton>

          <ControlButton
            ariaLabel={repeatLabel}
            isActive={repeatMode !== 'none'}
            disabled={isDisabled}
            onClick={cycleRepeatMode}
          >
            <RepeatIcon size={18} aria-hidden="true" />
          </ControlButton>
        </div>

        <div className="flex items-center justify-end gap-2 justify-self-end">
          {isFullscreenAvailable ? (
            <FullscreenButton
              isFullscreen={isFullscreen}
              onClick={() => {
                void toggleFullscreen()
              }}
            />
          ) : null}
          <FavoriteButton
            isFavorite={isFavorite}
            disabled={isDisabled}
            onClick={toggleFavorite}
          />
          <LyricsToggleButton
            isActive={isLyricsVisible}
            disabled={isDisabled}
            onClick={toggleLyrics}
          />
        </div>
      </div>
    </section>
  )
})
