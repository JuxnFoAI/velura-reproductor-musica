/** Fila de letra con selector de archivos .txt / .lrc en el panel push. */
import { memo, useCallback, useRef, type ChangeEvent } from 'react'
import { Pencil } from 'lucide-react'
import {
  getLyricsFilename,
  LYRICS_FILE_ACCEPT,
} from '@features/musicPlayer/services/lyricsFileService'

const PENCIL_ICON_SIZE_PX = 16
const LYRICS_ADD_LABEL = 'agregar letra'

interface TrackLyricsRowProps {
  lyricsRelativePath?: string | null
  isEditable: boolean
  onLyricsFileSelect: (file: File) => void
  onEditLyrics?: () => void
}

/**
 * Muestra la letra de la pista y permite adjuntar un archivo con el icono de lápiz.
 */
export const TrackLyricsRow = memo(function TrackLyricsRow({
  lyricsRelativePath,
  isEditable,
  onLyricsFileSelect,
  onEditLyrics,
}: TrackLyricsRowProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const hasLyricsAttached = Boolean(lyricsRelativePath)
  const lyricsLabel = lyricsRelativePath
    ? getLyricsFilename(lyricsRelativePath)
    : LYRICS_ADD_LABEL

  const openFilePicker = useCallback((): void => {
    if (!isEditable) {
      return
    }

    fileInputRef.current?.click()
  }, [isEditable])

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      const selectedFile = event.target.files?.[0]
      event.target.value = ''

      if (!selectedFile) {
        return
      }

      onLyricsFileSelect(selectedFile)
    },
    [onLyricsFileSelect],
  )

  return (
    <div className="track-lyrics-row">
      <div className="track-detail-row">
        <span className="track-detail-row__label">Letra:</span>

        <div className="track-detail-row__value-group flex flex-col gap-2">
          <div className="flex min-w-0 items-start gap-2">
            <span className="montserrat-regular min-w-0 flex-1 truncate text-base text-[var(--player-text)]">
              {lyricsLabel}
            </span>

            {isEditable ? (
              <button
                type="button"
                onClick={openFilePicker}
                aria-label={
                  hasLyricsAttached ? 'Cambiar archivo de letra' : 'Agregar archivo de letra'
                }
                className="track-detail-row__edit-button shrink-0"
              >
                <Pencil size={PENCIL_ICON_SIZE_PX} aria-hidden="true" />
              </button>
            ) : null}
          </div>

          {hasLyricsAttached ? (
            <button
              type="button"
              onClick={onEditLyrics}
              disabled={!isEditable}
              className="track-lyrics-row__edit-button montserrat-regular"
            >
              Editar Letra
            </button>
          ) : null}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={LYRICS_FILE_ACCEPT}
        onChange={handleFileChange}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  )
})
