/** Botón con flecha izquierda para abrir el menú principal en navegación push. */

import { ChevronLeft } from 'lucide-react'

import { useNavigationStore } from '@features/navigation'

interface MainMenuButtonProps {
  className?: string
}

/**
 * Flecha izquierda fija en la esquina superior izquierda.
 * Cierra el menú en la raíz o regresa al menú principal desde una sección.
 */
export function MainMenuButton({ className }: MainMenuButtonProps) {
  const isMainMenuOpen = useNavigationStore((state) => state.isMainMenuOpen)
  const mainMenuSection = useNavigationStore((state) => state.mainMenuSection)
  const toggleMainMenu = useNavigationStore((state) => state.toggleMainMenu)
  const goBackMainMenu = useNavigationStore((state) => state.goBackMainMenu)

  const isRootSection = mainMenuSection === 'root'
  const isCloseMode = isMainMenuOpen && isRootSection

  const handleClick = (): void => {
    if (!isMainMenuOpen) {
      toggleMainMenu()
      return
    }

    if (isRootSection) {
      toggleMainMenu()
      return
    }

    goBackMainMenu()
  }

  const ariaLabel = !isMainMenuOpen
    ? 'Abrir menú principal'
    : isRootSection
      ? 'Cerrar menú principal'
      : 'Volver al menú principal'

  const iconClassName = [
    'main-menu-button__icon',
    isCloseMode ? 'main-menu-button__icon--close' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-expanded={isMainMenuOpen}
      aria-label={ariaLabel}
      className={`fixed top-8 left-8 z-[70] rounded-full p-2 text-[var(--player-text-muted)] transition-colors hover:bg-white hover:bg-opacity-10 hover:text-[var(--player-text)] ${className ?? ''}`}
    >
      <ChevronLeft size={22} aria-hidden="true" className={iconClassName} />
    </button>
  )
}
