/** Sección de favoritos del menú principal con las canciones marcadas en el reproductor. */

import { useCallback, useMemo } from 'react'

import {
  resolveTracksByIds,
  useLocalMusicLibrary,
  usePlayerStore,
} from '@features/musicPlayer'
import { MainMenuTrackListShell } from './MainMenuTrackListShell'

const FAVORITES_EMPTY_MESSAGE = 'Aún no tienes canciones favoritas.'
const PLAY_FAVORITES_LIST_LABEL = 'Reproducir lista'

/**
 * Muestra las pistas guardadas como favoritas desde el botón de corazón del reproductor.
 */
export function MainMenuFavoritesSection() {
  const { status } = useLocalMusicLibrary()
  const libraryQueue = usePlayerStore((state) => state.libraryQueue)
  const favoriteTrackIds = usePlayerStore((state) => state.favoriteTrackIds)
  const playFavoritesList = usePlayerStore((state) => state.playFavoritesList)

  const tracks = useMemo(
    () => resolveTracksByIds(libraryQueue, favoriteTrackIds),
    [favoriteTrackIds, libraryQueue],
  )

  const canPlayFavoritesList = status === 'ready' && tracks.length > 0

  const handlePlayFavoritesList = useCallback((): void => {
    playFavoritesList()
  }, [playFavoritesList])

  return (
    <MainMenuTrackListShell
      className="main-menu-favorites-section flex min-h-0 flex-1 flex-col"
      ariaLabel="Canciones favoritas"
      tracks={tracks}
      emptyMessage={FAVORITES_EMPTY_MESSAGE}
    >
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
    </MainMenuTrackListShell>
  )
}
