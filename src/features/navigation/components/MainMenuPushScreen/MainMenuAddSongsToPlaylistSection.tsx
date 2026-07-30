/** Vista para agregar canciones de la biblioteca a una lista de reproducción. */

import { useCallback, useMemo, useState } from 'react'

import { MusicLibrary } from '@features/musicPlayer/components/MusicLibrary'
import { useLocalMusicLibrary } from '@features/musicPlayer/hooks'
import { filterTracksBySearchQuery } from '@features/musicPlayer/lib/filterTracksBySearchQuery'
import { resolveVisibleLibraryTracks } from '@features/musicPlayer/lib/resolveVisibleLibraryTracks'
import { usePlaylistsStore } from '@features/musicPlayer/store/playlistsStore'
import { usePlayerStore } from '@features/musicPlayer/store/playerStore'
import { useToastStore } from '@features/musicPlayer/store/toastStore'
import type { Track } from '@features/musicPlayer/types'
import { MAIN_MENU_SEARCH_EMPTY_MESSAGE } from '../../lib/mainMenuConstants'
import { MainMenuAllSongsSearchBar } from './MainMenuAllSongsSearchBar'
import { MainMenuPlaylistNotFoundPlaceholder } from './MainMenuPlaylistNotFoundPlaceholder'

const ADD_SONGS_EMPTY_MESSAGE = 'No hay canciones disponibles para agregar.'
const SONG_ADDED_TOAST_MESSAGE = 'Canción agregada a la lista'

interface MainMenuAddSongsToPlaylistSectionProps {
  playlistId: string
}

/**
 * Muestra la biblioteca filtrada para añadir pistas a la lista seleccionada.
 */
export function MainMenuAddSongsToPlaylistSection({
  playlistId,
}: MainMenuAddSongsToPlaylistSectionProps) {
  const { status, errorMessage } = useLocalMusicLibrary()
  const libraryQueue = usePlayerStore((state) => state.libraryQueue)
  const hiddenTrackIds = usePlayerStore((state) => state.hiddenTrackIds)
  const playlist = usePlaylistsStore((state) => state.getPlaylistById(playlistId))
  const addTrackToPlaylist = usePlaylistsStore((state) => state.addTrackToPlaylist)
  const addToast = useToastStore((state) => state.addToast)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearchQueryChange = useCallback((value: string): void => {
    setSearchQuery(value)
  }, [])

  const availableTracks = useMemo(() => {
    const visibleTracks = resolveVisibleLibraryTracks(libraryQueue, hiddenTrackIds)
    const playlistTrackIds = new Set(playlist?.trackIds ?? [])

    return visibleTracks.filter((track) => !playlistTrackIds.has(track.id))
  }, [hiddenTrackIds, libraryQueue, playlist?.trackIds])

  const displayedTracks = useMemo(
    () => filterTracksBySearchQuery(availableTracks, searchQuery),
    [availableTracks, searchQuery],
  )

  const emptyMessage = useMemo(() => {
    if (searchQuery.trim().length > 0) {
      return MAIN_MENU_SEARCH_EMPTY_MESSAGE
    }

    return ADD_SONGS_EMPTY_MESSAGE
  }, [searchQuery])

  const handleAddTrack = useCallback(
    (track: Track): void => {
      const wasAdded = addTrackToPlaylist(playlistId, track.id)

      if (!wasAdded) {
        return
      }

      addToast({
        type: 'success',
        message: SONG_ADDED_TOAST_MESSAGE,
        duration: 2500,
      })
    },
    [addToast, addTrackToPlaylist, playlistId],
  )

  if (!playlist) {
    return <MainMenuPlaylistNotFoundPlaceholder />
  }

  return (
    <section
      className="main-menu-add-songs-section flex min-h-0 flex-1 flex-col"
      aria-label={`Agregar canciones a ${playlist.name}`}
    >
      <MainMenuAllSongsSearchBar value={searchQuery} onChange={handleSearchQueryChange} />

      <MusicLibrary
        className="min-h-0 flex-1 p-0"
        status={status}
        errorMessage={errorMessage}
        showHeader={false}
        showTrackCovers
        showTrackIndex={false}
        showTrackDuration={false}
        tracks={displayedTracks}
        emptyMessage={emptyMessage}
        scrollClassName="main-menu-screen__scroll"
        onTrackClick={handleAddTrack}
      />
    </section>
  )
}
