/** Diálogo de confirmación para eliminar una pista de la biblioteca. */
import { memo } from 'react'
import { ConfirmDialog } from '@components/ConfirmDialog'
import type { Track } from '../../types'

interface DeleteTrackConfirmDialogProps {
  isOpen: boolean
  track: Track | null
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Pregunta al usuario si desea eliminar la pista seleccionada.
 */
export const DeleteTrackConfirmDialog = memo(function DeleteTrackConfirmDialog({
  isOpen,
  track,
  onConfirm,
  onCancel,
}: DeleteTrackConfirmDialogProps) {
  if (!track) {
    return null
  }

  return (
    <ConfirmDialog
      isOpen={isOpen}
      titleId="delete-track-confirm-dialog-title"
      cancelAriaLabel="Cancelar eliminación"
      message={<>¿Deseas Eliminar la canción {track.title}?</>}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
})
