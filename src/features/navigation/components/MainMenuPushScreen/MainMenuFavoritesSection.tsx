/** Sección de favoritos del menú principal con las canciones marcadas en el reproductor. */

import { useCallback, useMemo } from 'react'
import { MusicLibrary } from '@features/musicPlayer/components/MusicLibrary'
import { useLocalMusicLibrary } from '@features/musicPlayer/hooks'
import { resolveTracksByIds } from '@features/musicPlayer/lib/resolveTracksByIds'
import { usePlayerStore } from '@features/musicPlayer/store/playerStore'

const FAVORITES_EMPTY_MESSAGE = 'Aún no tienes canciones favoritas.'
const PLAY_FAVORITES_LIST_LABEL = 'Reproducir lista'

/**
 * Muestra las pistas guardadas como favoritas desde el botón de corazón del reproductor.
 */
export function MainMenuFavoritesSection() {
  const { status, errorMessage } = useLocalMusicLibrary()
  const libraryQueue = usePlayerStore((state) => state.libraryQueue)
  const favoriteTrackIds = usePlayerStore((state) => state.favoriteTrackIds)
  const playFavoritesList = usePlayerStore((state) => state.playFavoritesList)

  const favoriteTracks = useMemo(
    () => resolveTracksByIds(libraryQueue, favoriteTrackIds),
    [favoriteTrackIds, libraryQueue],
  )

  const canPlayFavoritesList = status === 'ready' && favoriteTracks.length > 0

  const handlePlayFavoritesList = useCallback((): void => {
    playFavoritesList()
  }, [playFavoritesList])

  return (
    <section
      className="main-menu-favorites-section flex min-h-0 flex-1 flex-col"
      aria-label="Canciones favoritas"
    >
      <MusicLibrary
        className="min-h-0 flex-1 p-0"
        status={status}
        errorMessage={errorMessage}
        showHeader={false}
        showTrackCovers
        showTrackIndex={false}
        showTrackDuration={false}
        tracks={favoriteTracks}
        emptyMessage={FAVORITES_EMPTY_MESSAGE}
        scrollClassName="main-menu-screen__scroll"
      />

      {canPlayFavoritesList ? (
        <div className="main-menu-favorites-section__footer shrink-0">
          <button
            type="button"
            onClick={handlePlayFavoritesList}
            className="main-menu-favorites-section__play-button montserrat-regular"
          >
            {PLAY_FAVORITES_LIST_LABEL}
          </button>
        </div>
      ) : null}
    </section>
  )
}
