/** Menú de opciones del encabezado de Todas las canciones. */
import { memo, useCallback, useRef, type MouseEvent } from 'react'
import { useDismissibleMenu } from '@lib/useDismissibleMenu'
import { Eye } from 'lucide-react'
import { NavigationMenuDotsIcon } from '@components/NavigationMenuDotsIcon'

const MENU_ICON_SIZE_PX = 16

interface MainMenuAllSongsOptionsMenuProps {
  isOpen: boolean
  isShowingHiddenTracks: boolean
  onToggle: () => void
  onClose: () => void
  onToggleHiddenTracksView: () => void
}

/**
 * Despliega acciones globales de la sección Todas las canciones.
 */
export const MainMenuAllSongsOptionsMenu = memo(function MainMenuAllSongsOptionsMenu({
  isOpen,
  isShowingHiddenTracks,
  onToggle,
  onClose,
  onToggleHiddenTracksView,
}: MainMenuAllSongsOptionsMenuProps) {
  const menuRootRef = useRef<HTMLDivElement>(null)

  const handleToggleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>): void => {
      event.stopPropagation()
      onToggle()
    },
    [onToggle],
  )

  const handleViewHiddenClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>): void => {
      event.stopPropagation()
      onToggleHiddenTracksView()
      onClose()
    },
    [onClose, onToggleHiddenTracksView],
  )

  useDismissibleMenu(isOpen, menuRootRef, onClose)

  return (
    <div ref={menuRootRef} className="music-library-track-options relative shrink-0">
      <button
        type="button"
        onClick={handleToggleClick}
        aria-label="Opciones de Todas las canciones"
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="music-library-track-options__trigger flex items-center justify-center rounded-md px-1 py-2 text-[var(--player-text-muted)] transition-colors hover:bg-[var(--player-background)] hover:text-[var(--player-text)]"
      >
        <NavigationMenuDotsIcon merged={isOpen} />
      </button>

      {isOpen ? (
        <div
          role="menu"
          aria-label="Opciones de Todas las canciones"
          className="music-library-track-options__panel"
        >
          <button
            type="button"
            role="menuitem"
            onClick={handleViewHiddenClick}
            aria-pressed={isShowingHiddenTracks}
            className="music-library-track-options__action montserrat-regular"
          >
            <Eye size={MENU_ICON_SIZE_PX} aria-hidden="true" className="shrink-0" />
            Ver canciones ocultas
          </button>
        </div>
      ) : null}
    </div>
  )
})
