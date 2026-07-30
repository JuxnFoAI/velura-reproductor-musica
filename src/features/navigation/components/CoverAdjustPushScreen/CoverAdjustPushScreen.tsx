/** Pantalla push para ajustar escala y rotación de la portada seleccionada. */
import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { usePlayerStore } from '@features/musicPlayer/store/playerStore'
import { toastStore } from '@features/musicPlayer/store/toastStore'
import { usePushScreenVisibility } from '../../hooks'
import { renderAdjustedCover } from '../../lib/renderAdjustedCover'
import { useNavigationStore } from '../../store'
import { CoverImageEditor } from './CoverImageEditor'

const COVER_ADJUST_SCREEN_TITLE = 'AJUSTA LA IMAGEN'
const DEFAULT_SCALE = 1
const DEFAULT_ROTATION = 0

/**
 * Panel deslizable que aparece al seleccionar una nueva imagen de portada.
 */
export function CoverAdjustPushScreen() {
  const isCoverAdjustScreenOpen = useNavigationStore((state) => state.isCoverAdjustScreenOpen)
  const coverAdjustSession = useNavigationStore((state) => state.coverAdjustSession)
  const closeCoverAdjustScreen = useNavigationStore((state) => state.closeCoverAdjustScreen)
  const updateTrackCover = usePlayerStore((state) => state.updateTrackCover)

  const { isMounted, isVisible } = usePushScreenVisibility(isCoverAdjustScreenOpen, false)
  const [scale, setScale] = useState(DEFAULT_SCALE)
  const [rotation, setRotation] = useState(DEFAULT_ROTATION)
  const [isSaving, setIsSaving] = useState(false)

  if (
    !isCoverAdjustScreenOpen &&
    (scale !== DEFAULT_SCALE || rotation !== DEFAULT_ROTATION || isSaving)
  ) {
    setScale(DEFAULT_SCALE)
    setRotation(DEFAULT_ROTATION)
    setIsSaving(false)
  }

  const handleCancel = useCallback((): void => {
    if (isSaving) {
      return
    }

    closeCoverAdjustScreen()
  }, [closeCoverAdjustScreen, isSaving])

  const handleSave = useCallback(async (): Promise<void> => {
    if (!coverAdjustSession || isSaving) {
      return
    }

    setIsSaving(true)

    try {
      const adjustedCoverUrl = await renderAdjustedCover(coverAdjustSession.imageUrl, {
        scale,
        rotation,
      })

      updateTrackCover(coverAdjustSession.trackId, adjustedCoverUrl)
      closeCoverAdjustScreen()

      toastStore.getState().addToast({
        type: 'success',
        message: 'Portada actualizada correctamente.',
      })
    } catch {
      toastStore.getState().addToast({
        type: 'error',
        message: 'No se pudo guardar la portada ajustada.',
      })
    } finally {
      setIsSaving(false)
    }
  }, [closeCoverAdjustScreen, coverAdjustSession, isSaving, rotation, scale, updateTrackCover])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        handleCancel()
      }
    },
    [handleCancel],
  )

  useEffect(() => {
    if (!isMounted) {
      return
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, isMounted])

  if (!isMounted || !coverAdjustSession) {
    return null
  }

  return (
    <div
      className="push-screen push-screen--nested fixed inset-0 z-[65] overflow-hidden"
      aria-hidden={!isVisible}
    >
      <button
        type="button"
        aria-label="Cancelar ajuste de portada"
        onClick={handleCancel}
        disabled={isSaving}
        className={`push-screen__backdrop absolute inset-0 ${
          isVisible ? 'push-screen__backdrop--visible' : ''
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cover-adjust-screen-title"
        className={`push-screen__panel pointer-events-none absolute ${
          isVisible ? 'push-screen__panel--visible' : ''
        }`}
      >
        <div className="push-screen__content pointer-events-auto flex h-full min-h-[100dvh] w-full flex-col overflow-hidden">
          <div className="push-screen__layout">
            <header className="cover-adjust-screen__header shrink-0">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                aria-label="Volver sin guardar"
                className="cover-adjust-screen__back-button"
              >
                <ChevronLeft size={22} aria-hidden="true" />
              </button>

              <h1
                id="cover-adjust-screen-title"
                className="push-screen__title bebas-neue-regular text-2xl tracking-wide text-[var(--player-play-button)]"
              >
                {COVER_ADJUST_SCREEN_TITLE}
              </h1>
            </header>

            <CoverImageEditor
              imageUrl={coverAdjustSession.imageUrl}
              scale={scale}
              rotation={rotation}
              onScaleChange={setScale}
              onRotationChange={setRotation}
            />

            <div className="cover-adjust-screen__actions">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="cover-adjust-screen__button cover-adjust-screen__button--secondary montserrat-regular"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={isSaving}
                className="cover-adjust-screen__button cover-adjust-screen__button--primary montserrat-regular"
              >
                {isSaving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
