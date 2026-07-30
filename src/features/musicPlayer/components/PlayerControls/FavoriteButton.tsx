/** Botón de favoritos con icono de corazón estilo menú principal en blanco. */
import { Heart } from 'lucide-react'
import { memo } from 'react'

interface FavoriteButtonProps {
  isFavorite: boolean
  disabled?: boolean
  onClick: () => void
}

/**
 * Corazón blanco con animación de hover igual a la opción Favoritos del menú principal.
 */
export const FavoriteButton = memo(function FavoriteButton({
  isFavorite,
  disabled = false,
  onClick,
}: FavoriteButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
      aria-pressed={isFavorite}
      aria-disabled={disabled}
      className="player-control-button player-favorite-button"
    >
      <span className="player-favorite-button__icon" aria-hidden="true">
        <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
      </span>
    </button>
  )
})
