/** Vista de detalle de una lista de reproducción del menú principal. */

import { useCallback, useMemo } from 'react'
import { Plus } from 'lucide-react'

import { MainMenuNavItem } from '@components/MainMenuNavItem'
import { resolveTracksByIds, usePlayerStore, usePlaylistsStore } from '@features/musicPlayer'
import { useNavigationStore } from '../../store'
import { MainMenuPlaylistNotFoundPlaceholder } from './MainMenuPlaylistNotFoundPlaceholder'
import { MainMenuTrackListShell } from './MainMenuTrackListShell'

const PLAYLIST_EMPTY_MESSAGE = 'Esta lista aún no tiene canciones.'
const ADD_SONGS_LABEL = 'Agregar canciones'

interface MainMenuPlaylistDetailSectionProps {
  playlistId: string
}

/**
 * Muestra las canciones de una lista y la acción para agregar más pistas.
 */
export function MainMenuPlaylistDetailSection({ playlistId }: MainMenuPlaylistDetailSectionProps) {
  const libraryQueue = usePlayerStore((state) => state.libraryQueue)
  const playlist = usePlaylistsStore((state) => state.getPlaylistById(playlistId))
  const openAddSongsToPlaylist = useNavigationStore((state) => state.openAddSongsToPlaylist)

  const tracks = useMemo(
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
    <MainMenuTrackListShell
      className="main-menu-playlist-detail-section flex min-h-0 flex-1 flex-col gap-4"
      ariaLabel={`Lista ${playlist.name}`}
      tracks={tracks}
      emptyMessage={PLAYLIST_EMPTY_MESSAGE}
      header={
        <nav aria-label="Acciones de la lista">
          <MainMenuNavItem
            label={ADD_SONGS_LABEL}
            icon={<Plus size={20} />}
            onClick={handleOpenAddSongs}
            showChevron={false}
          />
        </nav>
      }
    />
  )
}
