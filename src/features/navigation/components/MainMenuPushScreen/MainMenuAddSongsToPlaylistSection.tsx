/** Vista para agregar canciones de la biblioteca a una lista de reproducción. */

import { useCallback, useMemo } from 'react'

import {
  resolveVisibleLibraryTracks,
  usePlayerStore,
  usePlaylistsStore,
  useToastStore,
  type Track,
} from '@features/musicPlayer'
import { MainMenuPlaylistNotFoundPlaceholder } from './MainMenuPlaylistNotFoundPlaceholder'
import { MainMenuTrackListShell } from './MainMenuTrackListShell'

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
  const libraryQueue = usePlayerStore((state) => state.libraryQueue)
  const hiddenTrackIds = usePlayerStore((state) => state.hiddenTrackIds)
  const playlist = usePlaylistsStore((state) => state.getPlaylistById(playlistId))
  const addTrackToPlaylist = usePlaylistsStore((state) => state.addTrackToPlaylist)
  const addToast = useToastStore((state) => state.addToast)

  const tracks = useMemo(() => {
    const visibleTracks = resolveVisibleLibraryTracks(libraryQueue, hiddenTrackIds)
    const playlistTrackIds = new Set(playlist?.trackIds ?? [])

    return visibleTracks.filter((track) => !playlistTrackIds.has(track.id))
  }, [hiddenTrackIds, libraryQueue, playlist?.trackIds])

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
    <MainMenuTrackListShell
      className="main-menu-add-songs-section flex min-h-0 flex-1 flex-col"
      ariaLabel={`Agregar canciones a ${playlist.name}`}
      tracks={tracks}
      emptyMessage={ADD_SONGS_EMPTY_MESSAGE}
      search
      onTrackAction={handleAddTrack}
    />
  )
}
