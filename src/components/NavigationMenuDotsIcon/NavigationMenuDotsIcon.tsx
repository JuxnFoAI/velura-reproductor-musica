/** Icono vertical de dos puntos usado en navegación push y listas del menú principal. */

interface NavigationMenuDotsIconProps {
  /** Une los dos puntos en uno (estado activo del botón de navegación). */
  merged?: boolean
  className?: string
}

/**
 * Representación visual de dos puntos apilados, igual al botón de información de canción.
 */
export function NavigationMenuDotsIcon({
  merged = false,
  className,
}: NavigationMenuDotsIconProps) {
  const iconClassName = [
    'navigation-menu-button__icon',
    merged ? 'navigation-menu-button__icon--merged' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={iconClassName} aria-hidden="true">
      <span className="navigation-menu-button__dot navigation-menu-button__dot--top" />
      <span className="navigation-menu-button__dot navigation-menu-button__dot--bottom" />
    </span>
  )
}
