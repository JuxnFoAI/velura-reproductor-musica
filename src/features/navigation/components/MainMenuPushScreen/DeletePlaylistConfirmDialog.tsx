/** Diálogo de confirmación para eliminar una carpeta de reproducción. */
import { memo } from 'react'
import { ConfirmDialog } from '@components/ConfirmDialog'
import type { Playlist } from '@features/musicPlayer'

interface DeletePlaylistConfirmDialogProps {
  isOpen: boolean
  playlist: Playlist | null
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Pregunta al usuario si desea eliminar la carpeta seleccionada.
 */
export const DeletePlaylistConfirmDialog = memo(function DeletePlaylistConfirmDialog({
  isOpen,
  playlist,
  onConfirm,
  onCancel,
}: DeletePlaylistConfirmDialogProps) {
  if (!playlist) {
    return null
  }

  return (
    <ConfirmDialog
      isOpen={isOpen}
      titleId="delete-playlist-confirm-dialog-title"
      cancelAriaLabel="Cancelar eliminación"
      message={<>¿Deseas eliminar la carpeta {playlist.name}?</>}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
})
