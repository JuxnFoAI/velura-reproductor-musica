/** Botón genérico de control de transporte del reproductor. */
import { memo, type ReactNode } from 'react'

interface ControlButtonProps {
  ariaLabel: string
  isActive?: boolean
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}

/**
 * Botón accesible compartido por los controles del reproductor y la isla dinámica.
 */
export const ControlButton = memo(function ControlButton({
  ariaLabel,
  isActive = false,
  disabled = false,
  onClick,
  children,
}: ControlButtonProps) {
  const buttonClassName = [
    'player-control-button',
    isActive ? 'player-control-button--active' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={isActive}
      aria-disabled={disabled}
      className={buttonClassName}
    >
      {children}
    </button>
  )
})
