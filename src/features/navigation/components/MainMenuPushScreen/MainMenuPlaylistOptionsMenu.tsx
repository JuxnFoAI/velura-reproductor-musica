/** Menú contextual de opciones para una lista de reproducción del usuario. */

import { memo, useCallback, useRef, type MouseEvent } from 'react'
import { FolderX, PencilLine, Trash2 } from 'lucide-react'

import { NavigationMenuDotsIcon } from '@components/NavigationMenuDotsIcon'
import { useDismissibleMenu } from '@lib/useDismissibleMenu'
import type { Playlist } from '@features/musicPlayer/types/playlist'

const MENU_ICON_SIZE_PX = 16

interface MainMenuPlaylistOptionsMenuProps {
  playlist: Playlist
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
  onRename: () => void
  onRemoveSongs: () => void
  onDelete: () => void
}

/**
 * Despliega acciones de renombrar, eliminar canciones o eliminar una carpeta de playlist.
 */
export const MainMenuPlaylistOptionsMenu = memo(function MainMenuPlaylistOptionsMenu({
  playlist,
  isOpen,
  onToggle,
  onClose,
  onRename,
  onRemoveSongs,
  onDelete,
}: MainMenuPlaylistOptionsMenuProps) {
  const menuRootRef = useRef<HTMLDivElement>(null)

  const handleToggleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>): void => {
      event.stopPropagation()
      onToggle()
    },
    [onToggle],
  )

  const handleRenameClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>): void => {
      event.stopPropagation()
      onRename()
      onClose()
    },
    [onClose, onRename],
  )

  const handleRemoveSongsClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>): void => {
      event.stopPropagation()
      onRemoveSongs()
      onClose()
    },
    [onClose, onRemoveSongs],
  )

  const handleDeleteClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>): void => {
      event.stopPropagation()
      onDelete()
      onClose()
    },
    [onClose, onDelete],
  )

  useDismissibleMenu(isOpen, menuRootRef, onClose)

  return (
    <div ref={menuRootRef} className="music-library-track-options relative shrink-0">
      <button
        type="button"
        onClick={handleToggleClick}
        aria-label={`Opciones de ${playlist.name}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="music-library-track-options__trigger flex items-center justify-center rounded-md px-1 py-2 text-[var(--player-text-muted)] transition-colors hover:bg-[var(--player-background)] hover:text-[var(--player-text)]"
      >
        <NavigationMenuDotsIcon merged={isOpen} />
      </button>

      {isOpen ? (
        <div
          role="menu"
          aria-label={`Opciones de ${playlist.name}`}
          className="music-library-track-options__panel"
        >
          <button
            type="button"
            role="menuitem"
            onClick={handleRenameClick}
            className="music-library-track-options__action montserrat-regular"
          >
            <PencilLine size={MENU_ICON_SIZE_PX} aria-hidden="true" className="shrink-0" />
            Cambiar nombre de carpeta
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={handleRemoveSongsClick}
            className="music-library-track-options__action montserrat-regular"
          >
            <Trash2 size={MENU_ICON_SIZE_PX} aria-hidden="true" className="shrink-0" />
            Eliminar canciones de carpeta
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={handleDeleteClick}
            className="music-library-track-options__action montserrat-regular"
          >
            <FolderX size={MENU_ICON_SIZE_PX} aria-hidden="true" className="shrink-0" />
            Eliminar carpeta
          </button>
        </div>
      ) : null}
    </div>
  )
})
