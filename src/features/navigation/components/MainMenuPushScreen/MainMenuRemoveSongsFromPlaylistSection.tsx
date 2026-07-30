/** Vista para quitar canciones de una lista de reproducción del usuario. */

import { useCallback, useMemo, useState } from 'react'

import { MusicLibrary } from '@features/musicPlayer/components/MusicLibrary'
import { useLocalMusicLibrary } from '@features/musicPlayer/hooks'
import { filterTracksBySearchQuery } from '@features/musicPlayer/lib/filterTracksBySearchQuery'
import { resolveTracksByIds } from '@features/musicPlayer/lib/resolveTracksByIds'
import { usePlaylistsStore } from '@features/musicPlayer/store/playlistsStore'
import { usePlayerStore } from '@features/musicPlayer/store/playerStore'
import { useToastStore } from '@features/musicPlayer/store/toastStore'
import type { Track } from '@features/musicPlayer/types'
import { MAIN_MENU_SEARCH_EMPTY_MESSAGE } from '../../lib/mainMenuConstants'
import { MainMenuAllSongsSearchBar } from './MainMenuAllSongsSearchBar'
import { MainMenuPlaylistNotFoundPlaceholder } from './MainMenuPlaylistNotFoundPlaceholder'

const REMOVE_SONGS_EMPTY_MESSAGE = 'Esta carpeta no tiene canciones para eliminar.'
const SONG_REMOVED_TOAST_MESSAGE = 'Canción eliminada de la carpeta'

interface MainMenuRemoveSongsFromPlaylistSectionProps {
  playlistId: string
}

/**
 * Muestra las pistas de la lista para quitarlas al pulsar cada canción.
 */
export function MainMenuRemoveSongsFromPlaylistSection({
  playlistId,
}: MainMenuRemoveSongsFromPlaylistSectionProps) {
  const { status, errorMessage } = useLocalMusicLibrary()
  const libraryQueue = usePlayerStore((state) => state.libraryQueue)
  const playlist = usePlaylistsStore((state) => state.getPlaylistById(playlistId))
  const removeTrackFromPlaylist = usePlaylistsStore((state) => state.removeTrackFromPlaylist)
  const addToast = useToastStore((state) => state.addToast)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearchQueryChange = useCallback((value: string): void => {
    setSearchQuery(value)
  }, [])

  const playlistTracks = useMemo(
    () => resolveTracksByIds(libraryQueue, playlist?.trackIds ?? []),
    [libraryQueue, playlist?.trackIds],
  )

  const displayedTracks = useMemo(
    () => filterTracksBySearchQuery(playlistTracks, searchQuery),
    [playlistTracks, searchQuery],
  )

  const emptyMessage = useMemo(() => {
    if (searchQuery.trim().length > 0) {
      return MAIN_MENU_SEARCH_EMPTY_MESSAGE
    }

    return REMOVE_SONGS_EMPTY_MESSAGE
  }, [searchQuery])

  const handleRemoveTrack = useCallback(
    (track: Track): void => {
      const wasRemoved = removeTrackFromPlaylist(playlistId, track.id)

      if (!wasRemoved) {
        return
      }

      addToast({
        type: 'remove',
        message: SONG_REMOVED_TOAST_MESSAGE,
        duration: 2500,
      })
    },
    [addToast, playlistId, removeTrackFromPlaylist],
  )

  if (!playlist) {
    return <MainMenuPlaylistNotFoundPlaceholder />
  }

  return (
    <section
      className="main-menu-remove-songs-section flex min-h-0 flex-1 flex-col"
      aria-label={`Eliminar canciones de ${playlist.name}`}
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
        onTrackClick={handleRemoveTrack}
        trackClickLabel="Eliminar de la carpeta"
      />
    </section>
  )
}
