/** Pantalla push con información detallada de la canción en reproducción. */

import { useCallback, useEffect } from 'react'

import { LYRICS_FORMAT_HINT } from '@features/musicPlayer/services/lyricsFileService'

import { PushScreenTrackCover } from '../PushScreenTrackCover'
import { PushScreenTrackDetails } from '../PushScreenTrackDetails'
import { usePushScreenVisibility } from '../../hooks'
import { useNavigationStore } from '../../store'

const PUSH_SCREEN_TITLE = 'INFORMACIÓN DE LA CANCIÓN'

/**
 * Panel deslizable que aparece sobre la pantalla principal al pulsar el menú.
 */
export function SongInfoPushScreen() {
  const isPushScreenOpen = useNavigationStore((state) => state.isPushScreenOpen)
  const isCoverAdjustScreenOpen = useNavigationStore((state) => state.isCoverAdjustScreenOpen)
  const isLyricsEditScreenOpen = useNavigationStore((state) => state.isLyricsEditScreenOpen)
  const closePushScreen = useNavigationStore((state) => state.closePushScreen)
  const { isMounted, isVisible } = usePushScreenVisibility(isPushScreenOpen)

  const handleBackdropClick = useCallback((): void => {
    if (isCoverAdjustScreenOpen || isLyricsEditScreenOpen) {
      return
    }

    closePushScreen()
  }, [closePushScreen, isCoverAdjustScreenOpen, isLyricsEditScreenOpen])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && !isCoverAdjustScreenOpen && !isLyricsEditScreenOpen) {
        closePushScreen()
      }
    },
    [closePushScreen, isCoverAdjustScreenOpen, isLyricsEditScreenOpen],
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

  if (!isMounted) {
    return null
  }

  return (
    <div
      className="push-screen fixed inset-0 z-[60] overflow-hidden"
      aria-hidden={!isVisible}
    >
      <button
        type="button"
        aria-label="Cerrar información de la canción"
        onClick={handleBackdropClick}
        className={`push-screen__backdrop absolute inset-0 ${
          isVisible ? 'push-screen__backdrop--visible' : ''
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="push-screen-title"
        className={`push-screen__panel pointer-events-none absolute ${
          isVisible ? 'push-screen__panel--visible' : ''
        }`}
      >
        <div className="push-screen__content pointer-events-auto flex h-full min-h-[100dvh] w-full flex-col overflow-hidden">
          <div className="song-info-screen flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="push-screen__layout song-info-screen__body min-h-0 flex-1 overflow-y-auto">
              <header className="shrink-0 text-center">
                <h1
                  id="push-screen-title"
                  className="push-screen__title bebas-neue-regular text-2xl tracking-wide text-[var(--player-play-button)]"
                >
                  {PUSH_SCREEN_TITLE}
                </h1>
              </header>

              <div className="flex shrink-0 justify-center">
                <PushScreenTrackCover />
              </div>

              <PushScreenTrackDetails />
            </div>

            <footer className="song-info-screen__footer shrink-0">
              <p className="song-info-screen__footer-hint montserrat-regular">
                {LYRICS_FORMAT_HINT}
              </p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  )
}
