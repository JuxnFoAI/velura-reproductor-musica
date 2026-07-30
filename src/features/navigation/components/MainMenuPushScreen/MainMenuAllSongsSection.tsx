/** Sección del menú principal con todas las canciones de la biblioteca. */

import { useCallback, useMemo, useState } from 'react'

import { MusicLibrary } from '@features/musicPlayer/components/MusicLibrary'
import { useLocalMusicLibrary } from '@features/musicPlayer/hooks'
import { filterTracksBySearchQuery } from '@features/musicPlayer/lib/filterTracksBySearchQuery'
import {
  resolveHiddenLibraryTracks,
  resolveVisibleLibraryTracks,
} from '@features/musicPlayer/lib/resolveVisibleLibraryTracks'
import { usePlayerStore } from '@features/musicPlayer/store/playerStore'
import { MAIN_MENU_SEARCH_EMPTY_MESSAGE } from '../../lib/mainMenuConstants'
import { MainMenuAllSongsSearchBar } from './MainMenuAllSongsSearchBar'

interface MainMenuAllSongsSectionProps {
  isShowingHiddenTracks: boolean
}

const ALL_SONGS_EMPTY_MESSAGE = 'No hay canciones para mostrar.'
const HIDDEN_SONGS_EMPTY_MESSAGE = 'No hay canciones ocultas.'

/**
 * Muestra la biblioteca completa dentro del menú principal.
 */
export function MainMenuAllSongsSection({ isShowingHiddenTracks }: MainMenuAllSongsSectionProps) {
  const { status, errorMessage } = useLocalMusicLibrary()
  const libraryQueue = usePlayerStore((state) => state.libraryQueue)
  const hiddenTrackIds = usePlayerStore((state) => state.hiddenTrackIds)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearchQueryChange = useCallback((value: string): void => {
    setSearchQuery(value)
  }, [])

  const baseTracks = useMemo(() => {
    if (isShowingHiddenTracks) {
      return resolveHiddenLibraryTracks(libraryQueue, hiddenTrackIds)
    }

    return resolveVisibleLibraryTracks(libraryQueue, hiddenTrackIds)
  }, [hiddenTrackIds, isShowingHiddenTracks, libraryQueue])

  const displayedTracks = useMemo(() => {
    if (isShowingHiddenTracks) {
      return baseTracks
    }

    return filterTracksBySearchQuery(baseTracks, searchQuery)
  }, [baseTracks, isShowingHiddenTracks, searchQuery])

  const emptyMessage = useMemo(() => {
    if (isShowingHiddenTracks) {
      return HIDDEN_SONGS_EMPTY_MESSAGE
    }

    if (searchQuery.trim().length > 0) {
      return MAIN_MENU_SEARCH_EMPTY_MESSAGE
    }

    return ALL_SONGS_EMPTY_MESSAGE
  }, [isShowingHiddenTracks, searchQuery])

  return (
    <section
      className="main-menu-all-songs-section flex min-h-0 flex-1 flex-col"
      aria-label="Todas las canciones"
    >
      {!isShowingHiddenTracks ? (
        <MainMenuAllSongsSearchBar value={searchQuery} onChange={handleSearchQueryChange} />
      ) : null}

      <MusicLibrary
        className="min-h-0 flex-1 p-0"
        status={status}
        errorMessage={errorMessage}
        showHeader={false}
        showTrackCovers
        showNavDots
        isShowingHiddenTracks={isShowingHiddenTracks}
        tracks={displayedTracks}
        emptyMessage={emptyMessage}
        scrollClassName="main-menu-screen__scroll"
      />
    </section>
  )
}
