/** Vista de detalle de una lista de reproducción del menú principal. */

import { useCallback, useMemo } from 'react'
import { Plus } from 'lucide-react'

import { MusicLibrary } from '@features/musicPlayer/components/MusicLibrary'
import { useLocalMusicLibrary } from '@features/musicPlayer/hooks'
import { resolveTracksByIds } from '@features/musicPlayer/lib/resolveTracksByIds'
import { usePlaylistsStore } from '@features/musicPlayer/store/playlistsStore'
import { usePlayerStore } from '@features/musicPlayer/store/playerStore'
import { useNavigationStore } from '../../store'
import { MainMenuNavItem } from './MainMenuNavItem'
import { MainMenuPlaylistNotFoundPlaceholder } from './MainMenuPlaylistNotFoundPlaceholder'

const PLAYLIST_EMPTY_MESSAGE = 'Esta lista aún no tiene canciones.'
const ADD_SONGS_LABEL = 'Agregar canciones'

interface MainMenuPlaylistDetailSectionProps {
  playlistId: string
}

/**
 * Muestra las canciones de una lista y la acción para agregar más pistas.
 */
export function MainMenuPlaylistDetailSection({ playlistId }: MainMenuPlaylistDetailSectionProps) {
  const { status, errorMessage } = useLocalMusicLibrary()
  const libraryQueue = usePlayerStore((state) => state.libraryQueue)
  const playlist = usePlaylistsStore((state) => state.getPlaylistById(playlistId))
  const openAddSongsToPlaylist = useNavigationStore((state) => state.openAddSongsToPlaylist)

  const playlistTracks = useMemo(
    () => resolveTracksByIds(libraryQueue, playlist?.trackIds ?? []),
    [libraryQueue, playlist?.trackIds],
  )

  const handleOpenAddSongs = useCallback((): void => {
    openAddSongsToPlaylist()
  }, [openAddSongsToPlaylist])

  if (!playlist) {
    return <MainMenuPlaylistNotFoundPlaceholder />
  }

  return (
    <section
      className="main-menu-playlist-detail-section flex min-h-0 flex-1 flex-col gap-4"
      aria-label={`Lista ${playlist.name}`}
    >
      <nav aria-label="Acciones de la lista">
        <MainMenuNavItem
          label={ADD_SONGS_LABEL}
          icon={<Plus size={20} />}
          onClick={handleOpenAddSongs}
          showChevron={false}
        />
      </nav>

      <MusicLibrary
        className="min-h-0 flex-1 p-0"
        status={status}
        errorMessage={errorMessage}
        showHeader={false}
        showTrackCovers
        showTrackIndex={false}
        showTrackDuration={false}
        tracks={playlistTracks}
        emptyMessage={PLAYLIST_EMPTY_MESSAGE}
        scrollClassName="main-menu-screen__scroll"
      />
    </section>
  )
}
