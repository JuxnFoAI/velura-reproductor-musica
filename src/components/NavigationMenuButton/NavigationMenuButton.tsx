/** Botón de dos puntos para abrir la navegación push sobre la pantalla actual. */

import { NavigationMenuDotsIcon } from '@components/NavigationMenuDotsIcon'
import { useNavigationStore } from '@features/navigation'
import { usePlayerStore } from '@features/musicPlayer'


interface NavigationMenuButtonProps {

  className?: string

}



/**

 * Icono vertical de dos puntos que se unen en uno al abrir la pantalla push.

 */

export function NavigationMenuButton({ className }: NavigationMenuButtonProps) {

  const isPushScreenOpen = useNavigationStore((state) => state.isPushScreenOpen)

  const isMainMenuOpen = useNavigationStore((state) => state.isMainMenuOpen)

  const isShowingHiddenTracks = useNavigationStore((state) => state.isShowingHiddenTracks)

  const togglePushScreen = useNavigationStore((state) => state.togglePushScreen)

  const hasActiveTrack = usePlayerStore((state) => state.currentTrack !== null)



  const handleClick = (): void => {

    if (!hasActiveTrack) {

      return

    }



    togglePushScreen()

  }



  if (isMainMenuOpen && isShowingHiddenTracks) {

    return null

  }



  return (

    <button

      type="button"

      onClick={handleClick}

      disabled={!hasActiveTrack}

      aria-label={isPushScreenOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}

      aria-expanded={isPushScreenOpen}

      aria-disabled={!hasActiveTrack}

      className={`fixed top-8 right-8 z-[70] flex items-center justify-center rounded-full p-3 text-[var(--player-text-muted)] transition-colors hover:bg-white hover:bg-opacity-10 hover:text-[var(--player-text)] disabled:cursor-not-allowed disabled:opacity-40 ${className ?? ''}`}

    >

      <NavigationMenuDotsIcon merged={isPushScreenOpen} />
    </button>

  )

}

