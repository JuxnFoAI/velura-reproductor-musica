/** Menú de opciones del encabezado de la sección Fuentes. */

import { memo, useCallback, useRef, type MouseEvent } from 'react'
import { RotateCcw } from 'lucide-react'

import { NavigationMenuDotsIcon } from '@components/NavigationMenuDotsIcon'
import { useToastStore } from '@features/musicPlayer'
import { useDismissibleMenu } from '@lib/useDismissibleMenu'

import { useCustomizationStore } from '../store'
import { DEFAULT_LYRICS_FONT_ID } from '../types/lyricsFonts'

const MENU_ICON_SIZE_PX = 16
const LYRICS_RESET_TOAST_MESSAGE = 'Letras restablecidas a los ajustes predeterminados.'

interface LyricsFontsOptionsMenuProps {
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
}

/**
 * Despliega acciones de la sección Fuentes del modo letra.
 */
export const LyricsFontsOptionsMenu = memo(
  function LyricsFontsOptionsMenu({
    isOpen,
    onToggle,
    onClose,
  }: LyricsFontsOptionsMenuProps) {
    const menuRootRef = useRef<HTMLDivElement>(null)
    const appliedLyricsFontId = useCustomizationStore((state) => state.appliedLyricsFontId)
    const resetLyricsFontToDefault = useCustomizationStore(
      (state) => state.resetLyricsFontToDefault,
    )
    const addToast = useToastStore((state) => state.addToast)

    const isDefaultFontApplied = appliedLyricsFontId === DEFAULT_LYRICS_FONT_ID

    const handleToggleClick = useCallback(
      (event: MouseEvent<HTMLButtonElement>): void => {
        event.stopPropagation()
        onToggle()
      },
      [onToggle],
    )

    const handleResetToDefaultClick = useCallback(
      (event: MouseEvent<HTMLButtonElement>): void => {
        event.stopPropagation()

        if (isDefaultFontApplied) {
          return
        }

        void resetLyricsFontToDefault()
          .then(() => {
            addToast({
              type: 'success',
              message: LYRICS_RESET_TOAST_MESSAGE,
              duration: 2500,
            })
          })
          .catch(() => {
            addToast({
              type: 'error',
              message: 'No se pudieron restablecer las letras predeterminadas.',
              duration: 2500,
            })
          })

        onClose()
      },
      [addToast, isDefaultFontApplied, onClose, resetLyricsFontToDefault],
    )

    useDismissibleMenu(isOpen, menuRootRef, onClose)

    return (
      <div ref={menuRootRef} className="music-library-track-options relative shrink-0">
        <button
          type="button"
          onClick={handleToggleClick}
          aria-label="Opciones de fuentes"
          aria-expanded={isOpen}
          aria-haspopup="true"
          className="music-library-track-options__trigger flex items-center justify-center rounded-md px-1 py-2 text-[var(--player-text-muted)] transition-colors hover:bg-[var(--player-background)] hover:text-[var(--player-text)]"
        >
          <NavigationMenuDotsIcon merged={isOpen} />
        </button>

        {isOpen ? (
          <div
            role="menu"
            aria-label="Opciones de fuentes"
            className="music-library-track-options__panel"
          >
            <button
              type="button"
              role="menuitem"
              disabled={isDefaultFontApplied}
              onClick={handleResetToDefaultClick}
              className="music-library-track-options__action montserrat-regular disabled:cursor-not-allowed disabled:opacity-45"
            >
              <RotateCcw size={MENU_ICON_SIZE_PX} aria-hidden="true" className="shrink-0" />
              Restablecer letras predeterminadas
            </button>
          </div>
        ) : null}
      </div>
    )
  },
)
