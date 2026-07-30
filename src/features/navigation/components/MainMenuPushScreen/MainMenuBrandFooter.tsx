/** Pie de marca del menú principal con logo y nombre de la aplicación. */

import { logoUrl } from '@assets'
import { APP_NAME } from '@lib/appInfo'

/**
 * Muestra el logo y el nombre de la app al final del menú principal.
 */
export function MainMenuBrandFooter() {
  return (
    <footer className="main-menu-screen__brand" aria-label={APP_NAME}>
      <img
        className="main-menu-screen__brand-logo"
        src={logoUrl}
        alt=""
        width={48}
        height={48}
        draggable={false}
      />
      <p className="main-menu-screen__brand-name bebas-neue-regular">{APP_NAME}</p>
    </footer>
  )
}
