/** Hook para cerrar menús contextuales al pulsar fuera o presionar Escape. */
import { useEffect, type RefObject } from 'react'

/**
 * Registra listeners globales que cierran el menú cuando está abierto.
 */
export function useDismissibleMenu(
  isOpen: boolean,
  menuRootRef: RefObject<HTMLElement | null>,
  onClose: () => void,
): void {
  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const handlePointerDown = (event: PointerEvent): void => {
      if (menuRootRef.current?.contains(event.target as Node)) {
        return
      }

      onClose()
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') {
        return
      }

      onClose()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, menuRootRef, onClose])
}
