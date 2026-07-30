/** Placeholder cuando no se encuentra una lista de reproducción del menú. */

import { MAIN_MENU_PLAYLIST_NOT_FOUND_MESSAGE } from '../../lib/mainMenuConstants'

export function MainMenuPlaylistNotFoundPlaceholder() {
  return (
    <p className="main-menu-section__placeholder montserrat-regular text-sm text-[var(--player-text-muted)]">
      {MAIN_MENU_PLAYLIST_NOT_FOUND_MESSAGE}
    </p>
  )
}
