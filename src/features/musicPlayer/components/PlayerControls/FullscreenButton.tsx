/** Botón de pantalla completa; solo visible en la app de escritorio. */
import { Monitor } from 'lucide-react'
import { memo } from 'react'
import { ControlButton } from './ControlButton'

interface FullscreenButtonProps {
  isFullscreen: boolean
  onClick: () => void
}

/**
 * Icono de pantalla que alterna el modo pantalla completa (equivalente a F11).
 */
export const FullscreenButton = memo(function FullscreenButton({
  isFullscreen,
  onClick,
}: FullscreenButtonProps) {
  return (
    <ControlButton
      ariaLabel={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
      isActive={isFullscreen}
      onClick={onClick}
    >
      <Monitor size={18} aria-hidden="true" />
    </ControlButton>
  )
})
