/** Diálogo modal reutilizable de confirmación Sí/No con cierre por Escape. */
import { memo, useCallback, useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface ConfirmDialogProps {
  isOpen: boolean
  titleId: string
  cancelAriaLabel: string
  message: ReactNode
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Renderiza un alertdialog modal con acciones de confirmación y cancelación.
 */
export const ConfirmDialog = memo(function ConfirmDialog({
  isOpen,
  titleId,
  cancelAriaLabel,
  message,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') {
        return
      }

      onCancel()
    },
    [onCancel],
  )

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, isOpen])

  if (!isOpen) {
    return null
  }

  return createPortal(
    <div className="confirm-dialog fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={cancelAriaLabel}
        onClick={onCancel}
        className="confirm-dialog__backdrop absolute inset-0"
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="confirm-dialog__panel relative w-full max-w-md"
      >
        <p id={titleId} className="confirm-dialog__message montserrat-regular">
          {message}
        </p>

        <div className="confirm-dialog__actions">
          <button
            type="button"
            onClick={onConfirm}
            className="confirm-dialog__button confirm-dialog__button--confirm montserrat-regular"
          >
            Sí
          </button>

          <span className="confirm-dialog__separator" aria-hidden="true">
            |
          </span>

          <button
            type="button"
            onClick={onCancel}
            className="confirm-dialog__button confirm-dialog__button--cancel montserrat-regular"
          >
            No
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
})
