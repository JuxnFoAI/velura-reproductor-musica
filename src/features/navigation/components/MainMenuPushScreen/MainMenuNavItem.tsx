/** Ítem de navegación dentro del menú principal push. */

import { memo, type ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'

interface MainMenuNavItemProps {
  label: string
  icon: ReactNode
  onClick: () => void
  showChevron?: boolean
}

/**
 * Botón de menú con icono, etiqueta y flecha de avance opcional.
 */
export const MainMenuNavItem = memo(function MainMenuNavItem({
  label,
  icon,
  onClick,
  showChevron = true,
}: MainMenuNavItemProps) {
  return (
    <button type="button" onClick={onClick} className="main-menu-nav-item">
      <span className="main-menu-nav-item__icon" aria-hidden="true">
        {icon}
      </span>
      <span className="main-menu-nav-item__label montserrat-regular">{label}</span>
      {showChevron ? (
        <ChevronRight className="main-menu-nav-item__chevron" size={18} aria-hidden="true" />
      ) : null}
    </button>
  )
})
