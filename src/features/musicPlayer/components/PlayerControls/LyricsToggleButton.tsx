/** Botón de texto plano para activar o desactivar el panel de letras sincronizadas. */
import { memo } from 'react'

const UNDERLINE_TRANSITION_MS = 280

interface LyricsToggleButtonProps {
  isActive: boolean
  disabled?: boolean
  onClick: () => void
  className?: string
}

/**
 * Toggle "LETRA" con subrayado animado desde el centro y cambio gris/blanco.
 */
export const LyricsToggleButton = memo(function LyricsToggleButton({
  isActive,
  disabled = false,
  onClick,
  className,
}: LyricsToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={isActive ? 'Ocultar letra' : 'Mostrar letra'}
      aria-pressed={isActive}
      aria-disabled={disabled}
      className={`relative shrink-0 border-0 bg-transparent p-0 text-sm tracking-wide transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${className ?? ''}`}
    >
      <span
        className={`montserrat-regular relative z-[1] transition-colors duration-200 ${
          isActive ? 'text-white' : 'text-[var(--player-text-muted)]'
        }`}
      >
        LETRA
      </span>
      <span
        aria-hidden="true"
        className={`absolute bottom-0 left-0 h-0.5 w-full origin-center bg-white transition-transform ease-out ${
          isActive ? 'scale-x-100' : 'scale-x-0'
        }`}
        style={{ transitionDuration: `${UNDERLINE_TRANSITION_MS}ms` }}
      />
    </button>
  )
})
