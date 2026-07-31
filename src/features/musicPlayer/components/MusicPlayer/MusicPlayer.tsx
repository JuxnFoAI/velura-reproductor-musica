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

  return (
    <>
      <div
        className={`music-player mx-auto flex w-full flex-col px-0 pt-8 ${
          isLibraryOpen ? 'min-h-screen pb-8' : 'music-player--focused pb-4'
        }`}
      >
        <AudioBlockedBanner />

        <div
          className={`music-player__body flex w-full flex-col overflow-hidden ${
            isLibraryOpen ? 'min-h-0 flex-1' : ''
          }`}
        >
          <div
            ref={playerSectionRef}
            className={`music-player__stage flex w-full shrink-0 flex-col items-center ${
              isLibraryOpen ? 'gap-8 pb-2' : 'min-h-0 flex-1 pb-0'
            } ${PLAYER_HORIZONTAL_PADDING}`}
          >
            <div
              className={`music-player__track-area flex w-full flex-col ${
                isLibraryOpen ? '' : 'min-h-0 flex-1 justify-center'
              }`}
            >
              <TrackInfo plainCover className="w-full" />
            </div>

            <div className="music-player__controls-dock flex w-full shrink-0 flex-col items-center">
              <PlayerControls className="items-center" />

              <button
                type="button"
                onClick={toggleLibrary}
                aria-expanded={isLibraryOpen}
                aria-label={
                  isLibraryOpen ? 'Ocultar biblioteca de música' : 'Mostrar biblioteca de música'
                }
                className="music-player__library-toggle rounded-full p-1.5 text-[var(--player-text-muted)] transition-colors hover:bg-white hover:bg-opacity-10 hover:text-[var(--player-text)]"
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

          <div
            className={`min-h-0 overflow-hidden transition-[flex-grow,opacity] ease-in-out ${
              isLibraryOpen
                ? 'flex-1 opacity-100'
                : 'pointer-events-none max-h-0 flex-none opacity-0'
            }`}
            style={panelTransitionStyle}
            aria-hidden={!isLibraryOpen}
            {...(!isLibraryOpen ? { inert: true } : {})}
          >
            <MusicLibrary
              className={`h-full min-h-0 pt-2 ${PLAYER_HORIZONTAL_PADDING}`}
              status={libraryStatus}
              errorMessage={libraryErrorMessage}
            />
          </div>
        </div>
      </div>

      <ToastContainer />
    </>
  )
}
