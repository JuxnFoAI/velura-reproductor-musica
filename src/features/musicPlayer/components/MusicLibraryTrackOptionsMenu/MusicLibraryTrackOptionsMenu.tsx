/** Menú contextual de opciones para una pista en Todas las canciones. */
import { memo, useCallback, useRef, useState, type MouseEvent } from 'react'
import { useDismissibleMenu } from '@lib/useDismissibleMenu'
import { Disc3, Eye, EyeOff, Trash2, UserRound } from 'lucide-react'
import { NavigationMenuDotsIcon } from '@components/NavigationMenuDotsIcon'
import { DeleteTrackConfirmDialog } from '../DeleteTrackConfirmDialog'
import { usePlayerStore } from '../../store/playerStore'
import type { Track } from '../../types'

const MENU_ICON_SIZE_PX = 16

interface MusicLibraryTrackOptionsMenuProps {
  track: Track
  isOpen: boolean
  isShowingHiddenTracks?: boolean
  onToggle: () => void
  onClose: () => void
}

/**
 * Despliega metadatos y acciones de la pista al pulsar el icono de dos puntos.
 */
export const MusicLibraryTrackOptionsMenu = memo(function MusicLibraryTrackOptionsMenu({
  track,
  isOpen,
  isShowingHiddenTracks = false,
  onToggle,
  onClose,
}: MusicLibraryTrackOptionsMenuProps) {
  const menuRootRef = useRef<HTMLDivElement>(null)
  const hideTrack = usePlayerStore((state) => state.hideTrack)
  const showTrack = usePlayerStore((state) => state.showTrack)
  const deleteTrack = usePlayerStore((state) => state.deleteTrack)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)

  const handleToggleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>): void => {
      event.stopPropagation()
      onToggle()
    },
    [onToggle],
  )

  const handleHideClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>): void => {
      event.stopPropagation()
      hideTrack(track.id)
      onClose()
    },
    [hideTrack, onClose, track.id],
  )

  const handleShowClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>): void => {
      event.stopPropagation()
      showTrack(track.id)
      onClose()
    },
    [onClose, showTrack, track.id],
  )

  const handleDeleteClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>): void => {
      event.stopPropagation()
      onClose()
      setIsDeleteConfirmOpen(true)
    },
    [onClose],
  )

  const handleCancelDelete = useCallback((): void => {
    setIsDeleteConfirmOpen(false)
  }, [])

  const handleConfirmDelete = useCallback((): void => {
    setIsDeleteConfirmOpen(false)
    deleteTrack(track.id)
  }, [deleteTrack, track.id])

  useDismissibleMenu(isOpen, menuRootRef, onClose)

  return (
    <>
      <div ref={menuRootRef} className="music-library-track-options relative shrink-0">
      <button
        type="button"
        onClick={handleToggleClick}
        aria-label={`Opciones de ${track.title}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="music-library-track-options__trigger flex items-center justify-center rounded-md px-1 py-2 text-[var(--player-text-muted)] transition-colors hover:bg-[var(--player-background)] hover:text-[var(--player-text)]"
      >
        <NavigationMenuDotsIcon merged={isOpen} />
      </button>

      {isOpen ? (
        <div
          role="menu"
          aria-label={`Opciones de ${track.title}`}
          className="music-library-track-options__panel"
        >
          <div className="music-library-track-options__info-row">
            <Disc3
              size={MENU_ICON_SIZE_PX}
              aria-hidden="true"
              className="music-library-track-options__icon shrink-0"
            />
            <p className="music-library-track-options__text montserrat-regular min-w-0">
              <span className="music-library-track-options__label">Canción:</span>{' '}
              <span className="music-library-track-options__value">{track.title}</span>
            </p>
          </div>

          <div className="music-library-track-options__info-row">
            <UserRound
              size={MENU_ICON_SIZE_PX}
              aria-hidden="true"
              className="music-library-track-options__icon shrink-0"
            />
            <p className="music-library-track-options__text montserrat-regular min-w-0">
              <span className="music-library-track-options__label">Artista:</span>{' '}
              <span className="music-library-track-options__value">{track.artist}</span>
            </p>
          </div>

          {isShowingHiddenTracks ? (
            <button
              type="button"
              role="menuitem"
              onClick={handleShowClick}
              className="music-library-track-options__action montserrat-regular"
            >
              <Eye size={MENU_ICON_SIZE_PX} aria-hidden="true" className="shrink-0" />
              Mostrar canción
            </button>
          ) : (
            <button
              type="button"
              role="menuitem"
              onClick={handleHideClick}
              className="music-library-track-options__action montserrat-regular"
            >
              <EyeOff size={MENU_ICON_SIZE_PX} aria-hidden="true" className="shrink-0" />
              Ocultar
            </button>
          )}

          <button
            type="button"
            role="menuitem"
            onClick={handleDeleteClick}
            className="music-library-track-options__action montserrat-regular"
          >
            <Trash2 size={MENU_ICON_SIZE_PX} aria-hidden="true" className="shrink-0" />
            Eliminar
          </button>
        </div>
      ) : null}
      </div>

      <DeleteTrackConfirmDialog
        isOpen={isDeleteConfirmOpen}
        track={track}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </>
  )
})
