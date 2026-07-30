/** Icono de carpeta con un disco saliendo, usado en listas de reproducción. */

interface PlaylistFolderDiscIconProps {
  size?: number
  className?: string
}

/**
 * Representa una carpeta con un disco/vinilo emergiendo de su apertura superior.
 */
export function PlaylistFolderDiscIcon({
  size = 24,
  className,
}: PlaylistFolderDiscIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 20a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-5l-2-2H6a2 2 0 0 0-2 2v13z" />
      <circle cx="16" cy="7.5" r="3.25" />
      <circle cx="16" cy="7.5" r="1" />
    </svg>
  )
}
