/** Portada interactiva de la pista activa en el panel push de información. */
import { memo, useCallback, useRef, type ChangeEvent } from 'react'
import { Plus } from 'lucide-react'
import { usePlayerStore } from '@features/musicPlayer/store/playerStore'
import { toastStore } from '@features/musicPlayer/store/toastStore'
import { useNavigationStore } from '../../store'

const PUSH_COVER_SIZE_CLASS = 'aspect-square w-full max-w-52'
const COVER_IMAGE_ACCEPT = 'image/*'
const PLUS_ICON_SIZE_PX = 36

/**
 * Valida que el archivo seleccionado sea una imagen utilizable como portada.
 */
function isValidCoverFile(file: File): boolean {
  return file.type.startsWith('image/')
}

/**
 * Portada editable con efecto hover y selector de imagen local.
 */
export const PushScreenTrackCover = memo(function PushScreenTrackCover() {
  const currentTrack = usePlayerStore((state) => state.currentTrack)
  const status = usePlayerStore((state) => state.status)
  const openCoverAdjustScreen = useNavigationStore((state) => state.openCoverAdjustScreen)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isInitialLoad = status === 'loading' && !currentTrack
  const isCoverChangeDisabled = !currentTrack

  const openFilePicker = useCallback((): void => {
    if (isCoverChangeDisabled) {
      return
    }

    fileInputRef.current?.click()
  }, [isCoverChangeDisabled])

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      const selectedFile = event.target.files?.[0]
      event.target.value = ''

      if (!selectedFile || !currentTrack) {
        return
      }

      if (!isValidCoverFile(selectedFile)) {
        toastStore.getState().addToast({
          type: 'error',
          message: 'Selecciona un archivo de imagen válido.',
        })
        return
      }

      const imageUrl = URL.createObjectURL(selectedFile)

      openCoverAdjustScreen({
        trackId: currentTrack.id,
        imageUrl,
      })
    },
    [currentTrack, openCoverAdjustScreen],
  )

  if (isInitialLoad) {
    return (
      <div
        className={`${PUSH_COVER_SIZE_CLASS} rounded-2xl bg-[var(--player-surface)]`}
        aria-busy="true"
        aria-label="Cargando portada de la pista"
      />
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={openFilePicker}
        disabled={isCoverChangeDisabled}
        aria-label={
          isCoverChangeDisabled
            ? 'No hay pista seleccionada para cambiar la portada'
            : 'Cambiar portada de la canción'
        }
        className={`push-screen-cover ${PUSH_COVER_SIZE_CLASS} ${
          isCoverChangeDisabled ? 'push-screen-cover--disabled' : ''
        }`}
      >
        {currentTrack?.coverUrl ? (
          <img
            src={currentTrack.coverUrl}
            alt={`Portada de ${currentTrack.title}`}
            decoding="async"
            className="push-screen-cover__image h-full w-full rounded-2xl object-cover"
          />
        ) : (
          <div className="push-screen-cover__image flex h-full w-full items-center justify-center rounded-2xl bg-[var(--player-cover-white)] ring-1 ring-[var(--player-primary)] ring-opacity-10">
            <span className="text-4xl text-black">♪</span>
          </div>
        )}

        {!isCoverChangeDisabled ? (
          <span className="push-screen-cover__overlay" aria-hidden="true">
            <Plus size={PLUS_ICON_SIZE_PX} className="text-white" strokeWidth={2.5} />
          </span>
        ) : null}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept={COVER_IMAGE_ACCEPT}
        onChange={handleFileChange}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
    </>
  )
})
