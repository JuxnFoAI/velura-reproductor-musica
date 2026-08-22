/** Vista para quitar canciones de una lista de reproducción del usuario. */

import { useCallback, useMemo } from 'react'

import {
  resolveTracksByIds,
  usePlayerStore,
  usePlaylistsStore,
  useToastStore,
  type Track,
} from '@features/musicPlayer'
import { MainMenuPlaylistNotFoundPlaceholder } from './MainMenuPlaylistNotFoundPlaceholder'
import { MainMenuTrackListShell } from './MainMenuTrackListShell'

const REMOVE_SONGS_EMPTY_MESSAGE = 'Esta carpeta no tiene canciones para eliminar.'
const SONG_REMOVED_TOAST_MESSAGE = 'Canción eliminada de la carpeta'
const REMOVE_TRACK_ACTION_LABEL = 'Eliminar de la carpeta'

interface MainMenuRemoveSongsFromPlaylistSectionProps {
  playlistId: string
}

/**
 * Muestra las pistas de la lista para quitarlas al pulsar cada canción.
 */
export function MainMenuRemoveSongsFromPlaylistSection({
  playlistId,
}: MainMenuRemoveSongsFromPlaylistSectionProps) {
  const libraryQueue = usePlayerStore((state) => state.libraryQueue)
  const playlist = usePlaylistsStore((state) => state.getPlaylistById(playlistId))
  const removeTrackFromPlaylist = usePlaylistsStore((state) => state.removeTrackFromPlaylist)
  const addToast = useToastStore((state) => state.addToast)

  const tracks = useMemo(
    () => resolveTracksByIds(libraryQueue, playlist?.trackIds ?? []),
    [libraryQueue, playlist?.trackIds],
  )

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
    <MainMenuTrackListShell
      className="main-menu-remove-songs-section flex min-h-0 flex-1 flex-col"
      ariaLabel={`Eliminar canciones de ${playlist.name}`}
      tracks={tracks}
      emptyMessage={REMOVE_SONGS_EMPTY_MESSAGE}
      search
      onTrackAction={handleRemoveTrack}
      trackActionLabel={REMOVE_TRACK_ACTION_LABEL}
    />
  )
}
