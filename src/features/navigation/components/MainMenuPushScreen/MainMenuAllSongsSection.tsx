/** Sección del menú principal con todas las canciones de la biblioteca. */

import { useMemo } from 'react'

import {
  resolveHiddenLibraryTracks,
  resolveVisibleLibraryTracks,
  usePlayerStore,
} from '@features/musicPlayer'
import { MainMenuTrackListShell } from './MainMenuTrackListShell'

interface MainMenuAllSongsSectionProps {
  isShowingHiddenTracks: boolean
}

const ALL_SONGS_EMPTY_MESSAGE = 'No hay canciones para mostrar.'
const HIDDEN_SONGS_EMPTY_MESSAGE = 'No hay canciones ocultas.'

/**
 * Muestra la biblioteca completa dentro del menú principal.
 */
export function MainMenuAllSongsSection({ isShowingHiddenTracks }: MainMenuAllSongsSectionProps) {
  const libraryQueue = usePlayerStore((state) => state.libraryQueue)
  const hiddenTrackIds = usePlayerStore((state) => state.hiddenTrackIds)

  const tracks = useMemo(() => {
    if (isShowingHiddenTracks) {
      return resolveHiddenLibraryTracks(libraryQueue, hiddenTrackIds)
    }

    return resolveVisibleLibraryTracks(libraryQueue, hiddenTrackIds)
  }, [hiddenTrackIds, isShowingHiddenTracks, libraryQueue])

  return (
    <MainMenuTrackListShell
      className="main-menu-all-songs-section flex min-h-0 flex-1 flex-col"
      ariaLabel="Todas las canciones"
      tracks={tracks}
      emptyMessage={isShowingHiddenTracks ? HIDDEN_SONGS_EMPTY_MESSAGE : ALL_SONGS_EMPTY_MESSAGE}
      search={!isShowingHiddenTracks}
      showNavDots
      showTrackIndex
      showTrackDuration
      isShowingHiddenTracks={isShowingHiddenTracks}
    />
  )
}
