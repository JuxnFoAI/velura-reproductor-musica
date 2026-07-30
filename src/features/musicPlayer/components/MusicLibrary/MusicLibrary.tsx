/** Lista de canciones MP3 enlazada a la biblioteca mi-musica del proyecto. */
import { memo, useCallback, useMemo, useState } from 'react'
import { Heart, Music2, type LucideIcon } from 'lucide-react'
import { formatDuration } from '../../services/fileService'
import type { LibraryStatus } from '../../hooks/useLocalMusicLibrary'
import { resolveVisibleLibraryTracks } from '../../lib/resolveVisibleLibraryTracks'
import { usePlayerStore } from '../../store/playerStore'
import type { QueueContext, Track } from '../../types'
import { MusicLibraryTrackOptionsMenu } from '../MusicLibraryTrackOptionsMenu'
import { PlayingWaveBars } from '../PlayingWaveBars'

interface LibraryHeaderContent {
  Icon: LucideIcon
  title: string
  ariaLabel: string
}

const LIBRARY_HEADER_BY_CONTEXT: Record<QueueContext, LibraryHeaderContent> = {
  library: {
    Icon: Music2,
    title: 'TÚ MÚSICA',
    ariaLabel: 'Biblioteca de música local',
  },
  favorites: {
    Icon: Heart,
    title: 'FAVORITOS',
    ariaLabel: 'Lista de reproducción de favoritos',
  },
}

interface MusicLibraryProps {
  className?: string
  status: LibraryStatus
  errorMessage: string | null
  showHeader?: boolean
  /** Muestra miniaturas de portada entre el índice y el título (solo menú principal). */
  showTrackCovers?: boolean
  /** Sustituye la duración por el icono de dos puntos (solo menú principal). */
  showNavDots?: boolean
  /** Muestra el índice numérico (o barras si está sonando) al inicio de cada fila. */
  showTrackIndex?: boolean
  /** Muestra la duración al final de cada fila cuando no hay icono de dos puntos. */
  showTrackDuration?: boolean
  /** Lista personalizada de pistas; si se omite, usa la cola completa. */
  tracks?: Track[]
  /** Mensaje cuando la lista personalizada está vacía con biblioteca lista. */
  emptyMessage?: string
  scrollClassName?: string
  /** Muestra acciones de pistas ocultas en el menú contextual (solo canciones ocultas). */
  isShowingHiddenTracks?: boolean
  /** Acción personalizada al pulsar una pista; si se omite, reproduce la canción. */
  onTrackClick?: (track: Track) => void
  /** Texto de accesibilidad cuando se usa onTrackClick (ej. "Agregar a la lista"). */
  trackClickLabel?: string
}
/**
 * Muestra los MP3 disponibles en la carpeta mi-musica.
 */
export const MusicLibrary = memo(function MusicLibrary({
  className,
  status,
  errorMessage,
  showHeader = true,
  showTrackCovers = false,
  showNavDots = false,
  showTrackIndex = true,
  showTrackDuration = true,
  tracks,
  emptyMessage,
  scrollClassName = 'pr-1',
  isShowingHiddenTracks = false,
  onTrackClick,
  trackClickLabel = 'Agregar a la lista',
}: MusicLibraryProps) {
  const queue = usePlayerStore((state) => state.queue)
  const queueContext = usePlayerStore((state) => state.queueContext)
  const hiddenTrackIds = usePlayerStore((state) => state.hiddenTrackIds)
  const currentTrack = usePlayerStore((state) => state.currentTrack)
  const playerStatus = usePlayerStore((state) => state.status)
  const displayedTracks = useMemo(() => {
    const sourceTracks = tracks ?? queue

    if (tracks !== undefined || queueContext !== 'library') {
      return sourceTracks
    }

    return resolveVisibleLibraryTracks(sourceTracks, hiddenTrackIds)
  }, [hiddenTrackIds, queue, queueContext, tracks])
  const hasCustomTrackList = tracks !== undefined
  const libraryHeader = useMemo(
    () => LIBRARY_HEADER_BY_CONTEXT[queueContext],
    [queueContext],
  )
  const HeaderIcon = libraryHeader.Icon
  const [openOptionsTrackId, setOpenOptionsTrackId] = useState<string | null>(null)

  const handleToggleTrackOptions = useCallback((trackId: string): void => {
    setOpenOptionsTrackId((currentTrackId) => (currentTrackId === trackId ? null : trackId))
  }, [])

  const handleCloseTrackOptions = useCallback((): void => {
    setOpenOptionsTrackId(null)
  }, [])

  return (
    <section
      className={`flex min-h-0 flex-col gap-3 rounded-2xl bg-transparent p-4 ${className ?? ''}`}
      aria-label={libraryHeader.ariaLabel}
    >
      {showHeader ? (
        <header className="shrink-0">
          <div className="flex items-center gap-5">
            <HeaderIcon
              className="h-7 w-7 shrink-0 text-[var(--player-play-button)]"
              aria-hidden="true"
            />
            <h2 className="bebas-neue-regular text-2xl text-[var(--player-play-button)]">
              {libraryHeader.title}
            </h2>
          </div>
        </header>
      ) : null}

      {status === 'loading' ? (
        <p className="text-sm text-[var(--player-text-muted)]">Cargando biblioteca...</p>
      ) : null}

      {status === 'error' ? (
        <p className="text-sm text-[var(--player-text-muted)]">{errorMessage}</p>
      ) : null}

      {status === 'empty' ? (
        <p className="text-sm text-[var(--player-text-muted)]">
          No se encontraron archivos MP3 en mi-musica. Añade canciones a esa carpeta del proyecto.
        </p>
      ) : null}

      {status === 'ready' && hasCustomTrackList && displayedTracks.length === 0 ? (
        <p className="text-sm text-[var(--player-text-muted)]">
          {emptyMessage ?? 'No hay canciones para mostrar.'}
        </p>
      ) : null}

      {status === 'ready' && displayedTracks.length > 0 ? (
        <ul
          className={`player-scroll flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto ${scrollClassName}`}
        >
          {displayedTracks.map((track, index) => (
            <MusicLibraryItem
              key={track.id}
              track={track}
              index={index}
              isCurrentTrack={currentTrack?.id === track.id}
              isPlaying={playerStatus === 'playing' && currentTrack?.id === track.id}
              showTrackCovers={showTrackCovers}
              showNavDots={showNavDots}
              showTrackIndex={showTrackIndex}
              showTrackDuration={showTrackDuration}
              isShowingHiddenTracks={isShowingHiddenTracks}
              isOptionsOpen={openOptionsTrackId === track.id}
              onToggleOptions={() => handleToggleTrackOptions(track.id)}
              onCloseOptions={handleCloseTrackOptions}
              onTrackClick={onTrackClick}
              trackClickLabel={trackClickLabel}
            />
          ))}
        </ul>
      ) : null}
    </section>
  )
})

interface MusicLibraryItemProps {
  track: Track
  index: number
  isCurrentTrack: boolean
  isPlaying: boolean
  showTrackCovers: boolean
  showNavDots: boolean
  showTrackIndex: boolean
  showTrackDuration: boolean
  isShowingHiddenTracks: boolean
  isOptionsOpen: boolean
  onToggleOptions: () => void
  onCloseOptions: () => void
  onTrackClick?: (track: Track) => void
  trackClickLabel?: string
}

const TRACK_THUMBNAIL_SIZE_CLASS = 'h-10 w-10 shrink-0 rounded-md'

const MusicLibraryTrackThumbnail = memo(function MusicLibraryTrackThumbnail({
  coverUrl,
}: {
  coverUrl?: string
}) {
  if (coverUrl) {
    return (
      <img
        src={coverUrl}
        alt=""
        aria-hidden="true"
        className={`${TRACK_THUMBNAIL_SIZE_CLASS} object-cover`}
      />
    )
  }

  return (
    <div
      className={`flex ${TRACK_THUMBNAIL_SIZE_CLASS} items-center justify-center bg-[var(--player-cover-white)] ring-1 ring-[var(--player-primary)] ring-opacity-10`}
      aria-hidden="true"
    >
      <Music2 className="h-4 w-4 text-[var(--player-text-muted)]" />
    </div>
  )
})

const MusicLibraryItem = memo(function MusicLibraryItem({
  track,
  index,
  isCurrentTrack,
  isPlaying,
  showTrackCovers,
  showNavDots,
  showTrackIndex,
  showTrackDuration,
  isShowingHiddenTracks,
  isOptionsOpen,
  onToggleOptions,
  onCloseOptions,
  onTrackClick,
  trackClickLabel = 'Agregar a la lista',
}: MusicLibraryItemProps) {
  const play = usePlayerStore((state) => state.play)

  const handlePlay = useCallback((): void => {
    if (onTrackClick) {
      onTrackClick(track)
      return
    }

    play(track)
  }, [onTrackClick, play, track])

  return (
    <li>
      <div className="flex w-full items-center gap-4 rounded-lg px-4 py-3 transition-colors hover:bg-[var(--player-background)]">
        <button
          type="button"
          onClick={handlePlay}
          aria-label={
            onTrackClick ? `${trackClickLabel}: ${track.title}` : `Reproducir ${track.title}`
          }
          aria-current={isCurrentTrack ? 'true' : undefined}
          className="flex min-w-0 flex-1 items-center gap-4 text-left"
        >
          {showTrackIndex ? (
            <div className="flex w-7 shrink-0 items-center justify-center">
              {isPlaying ? (
                <PlayingWaveBars className="h-5" variant="white" />
              ) : (
                <span className="text-sm tabular-nums text-[var(--player-text-muted)]">
                  {index + 1}
                </span>
              )}
            </div>
          ) : null}

          {showTrackCovers ? <MusicLibraryTrackThumbnail coverUrl={track.coverUrl} /> : null}

          <div className="min-w-0 flex-1">
            <p className="bebas-neue-regular truncate text-lg text-[var(--player-play-button)]">
              {track.title}
            </p>
            <p className="montserrat-regular truncate text-sm text-[var(--player-text-muted)]">
              {track.artist}
            </p>
          </div>
        </button>

        {showNavDots ? (
          <MusicLibraryTrackOptionsMenu
            track={track}
            isOpen={isOptionsOpen}
            isShowingHiddenTracks={isShowingHiddenTracks}
            onToggle={onToggleOptions}
            onClose={onCloseOptions}
          />
        ) : showTrackDuration ? (
          <span className="shrink-0 text-sm tabular-nums text-[var(--player-text-muted)]">
            {formatDuration(track.duration)}
          </span>
        ) : null}
      </div>
    </li>
  )
})
