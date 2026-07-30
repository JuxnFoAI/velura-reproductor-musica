/** Layout contenedor principal del reproductor de música para escritorio. */
import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { smoothScrollToElement } from '@lib/smoothScrollToElement'
import { useKeyboardShortcuts, useLocalMusicLibrary, useMediaSession } from '../../hooks'
import { AudioBlockedBanner } from '../AudioBlockedBanner'
import { MusicLibrary } from '../MusicLibrary'
import { PlayerControls } from '../PlayerControls'
import { ToastContainer } from '../Toast'
import { TrackInfo } from '../TrackInfo'

const LIBRARY_PANEL_TRANSITION_MS = 500
const PLAYER_HORIZONTAL_PADDING = 'px-8 sm:px-12 md:px-16 lg:px-20 xl:px-24'
const PLAYER_TOP_PADDING = 'pt-12 md:pt-14 lg:pt-16 xl:pt-20'

/**
 * Ensambla el reproductor con panel deslizable de biblioteca musical.
 */
export function MusicPlayer() {
  useKeyboardShortcuts()
  useMediaSession()
  const { status: libraryStatus, errorMessage: libraryErrorMessage } = useLocalMusicLibrary()
  const [isLibraryOpen, setIsLibraryOpen] = useState(false)
  const playerSectionRef = useRef<HTMLDivElement>(null)
  const wasLibraryOpenRef = useRef(isLibraryOpen)

  useEffect(() => {
    const wasLibraryOpen = wasLibraryOpenRef.current
    wasLibraryOpenRef.current = isLibraryOpen

    if (wasLibraryOpen && !isLibraryOpen && playerSectionRef.current) {
      smoothScrollToElement(playerSectionRef.current, {
        durationMs: LIBRARY_PANEL_TRANSITION_MS,
      })
    }
  }, [isLibraryOpen])

  const toggleLibrary = useCallback((): void => {
    setIsLibraryOpen((previous) => !previous)
  }, [])

  const panelTransitionStyle = {
    transitionDuration: `${LIBRARY_PANEL_TRANSITION_MS}ms`,
  }

  const libraryGridStyle = {
    gridTemplateRows: isLibraryOpen ? 'auto minmax(0, 1fr)' : 'auto 0fr',
    transitionDuration: `${LIBRARY_PANEL_TRANSITION_MS}ms`,
  }

  return (
    <>
      <div
        className={`mx-auto flex w-full flex-col px-0 pb-8 pt-8 ${
          isLibraryOpen ? 'min-h-screen' : ''
        }`}
      >
        <AudioBlockedBanner />

        <div
          className={`grid w-full overflow-hidden transition-[grid-template-rows] ease-in-out ${
            isLibraryOpen ? 'min-h-0 flex-1' : ''
          }`}
          style={libraryGridStyle}
        >
          <div
            ref={playerSectionRef}
            className={`flex w-full shrink-0 flex-col items-center gap-8 pb-2 ${PLAYER_TOP_PADDING} ${PLAYER_HORIZONTAL_PADDING}`}
          >
            <TrackInfo plainCover className="w-full" />

            <div className="flex w-full shrink-0 flex-col items-center gap-4">
              <PlayerControls className="items-center" />

              <button
                type="button"
                onClick={toggleLibrary}
                aria-expanded={isLibraryOpen}
                aria-label={
                  isLibraryOpen ? 'Ocultar biblioteca de música' : 'Mostrar biblioteca de música'
                }
                className="rounded-full p-2 text-[var(--player-text-muted)] transition-colors hover:bg-white hover:bg-opacity-10 hover:text-[var(--player-text)]"
              >
                <ChevronDown
                  size={22}
                  aria-hidden="true"
                  className={`transition-transform ease-in-out ${
                    isLibraryOpen ? 'rotate-180' : 'rotate-0'
                  }`}
                  style={{ transitionDuration: `${LIBRARY_PANEL_TRANSITION_MS}ms` }}
                />
              </button>
            </div>
          </div>

          <div className="min-h-0 overflow-hidden">
            <div
              className={`h-full min-h-0 overflow-hidden transition-opacity ease-in-out ${
                isLibraryOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
              }`}
              style={panelTransitionStyle}
              aria-hidden={!isLibraryOpen}
            >
              <MusicLibrary
                className={`h-full min-h-0 pt-2 ${PLAYER_HORIZONTAL_PADDING}`}
                status={libraryStatus}
                errorMessage={libraryErrorMessage}
              />
            </div>
          </div>
        </div>
      </div>

      <ToastContainer />
    </>
  )
}
