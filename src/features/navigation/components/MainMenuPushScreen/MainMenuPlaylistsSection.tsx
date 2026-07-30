/** Sección de listas de reproducción del menú principal. */

import { useCallback, useState } from 'react'
import { Plus } from 'lucide-react'

import { PlaylistFolderDiscIcon } from '@components/PlaylistFolderDiscIcon'
import { usePlaylistsStore } from '@features/musicPlayer/store/playlistsStore'
import { useToastStore } from '@features/musicPlayer/store/toastStore'
import type { Playlist } from '@features/musicPlayer/types/playlist'
import { useNavigationStore } from '../../store'
import { DeletePlaylistConfirmDialog } from './DeletePlaylistConfirmDialog'
import { MainMenuAddSongsToPlaylistSection } from './MainMenuAddSongsToPlaylistSection'
import { MainMenuCreatePlaylistForm } from './MainMenuCreatePlaylistForm'
import { MainMenuPlaylistDetailSection } from './MainMenuPlaylistDetailSection'
import { MainMenuPlaylistOptionsMenu } from './MainMenuPlaylistOptionsMenu'
import { MainMenuRemoveSongsFromPlaylistSection } from './MainMenuRemoveSongsFromPlaylistSection'

const PLAYLIST_DELETED_TOAST_MESSAGE = 'Carpeta eliminada'

/**
 * Muestra la acción para crear una nueva lista y el estado vacío inicial.
 */
export function MainMenuPlaylistsSection() {
  const playlists = usePlaylistsStore((state) => state.playlists)
  const addPlaylist = usePlaylistsStore((state) => state.addPlaylist)
  const renamePlaylist = usePlaylistsStore((state) => state.renamePlaylist)
  const deletePlaylist = usePlaylistsStore((state) => state.deletePlaylist)
  const addToast = useToastStore((state) => state.addToast)
  const playlistsSubSection = useNavigationStore((state) => state.playlistsSubSection)
  const selectedPlaylistId = useNavigationStore((state) => state.selectedPlaylistId)
  const openPlaylistDetail = useNavigationStore((state) => state.openPlaylistDetail)
  const openRemoveSongsFromPlaylist = useNavigationStore(
    (state) => state.openRemoveSongsFromPlaylist,
  )
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false)
  const [draftPlaylistName, setDraftPlaylistName] = useState('')
  const [openOptionsPlaylistId, setOpenOptionsPlaylistId] = useState<string | null>(null)
  const [renamingPlaylistId, setRenamingPlaylistId] = useState<string | null>(null)
  const [draftRenameName, setDraftRenameName] = useState('')
  const [playlistPendingDelete, setPlaylistPendingDelete] = useState<Playlist | null>(null)

  const handleOpenCreateForm = useCallback((): void => {
    setDraftPlaylistName('')
    setIsCreatingPlaylist(true)
    setOpenOptionsPlaylistId(null)
  }, [])

  const handleCancelCreate = useCallback((): void => {
    setDraftPlaylistName('')
    setIsCreatingPlaylist(false)
  }, [])

  const handleAcceptCreate = useCallback((): void => {
    const trimmedName = draftPlaylistName.trim()

    if (trimmedName.length === 0) {
      return
    }

    addPlaylist(trimmedName)
    setDraftPlaylistName('')
    setIsCreatingPlaylist(false)
  }, [addPlaylist, draftPlaylistName])

  const handleOpenPlaylist = useCallback(
    (playlistId: string): void => {
      openPlaylistDetail(playlistId)
    },
    [openPlaylistDetail],
  )

  const handleToggleOptions = useCallback((playlistId: string): void => {
    setOpenOptionsPlaylistId((currentId) => (currentId === playlistId ? null : playlistId))
  }, [])

  const handleCloseOptions = useCallback((): void => {
    setOpenOptionsPlaylistId(null)
  }, [])

  const handleStartRename = useCallback((playlistId: string, currentName: string): void => {
    setRenamingPlaylistId(playlistId)
    setDraftRenameName(currentName)
    setOpenOptionsPlaylistId(null)
  }, [])

  const handleCancelRename = useCallback((): void => {
    setRenamingPlaylistId(null)
    setDraftRenameName('')
  }, [])

  const handleAcceptRename = useCallback((): void => {
    if (!renamingPlaylistId) {
      return
    }

    const wasRenamed = renamePlaylist(renamingPlaylistId, draftRenameName)

    if (!wasRenamed) {
      return
    }

    setRenamingPlaylistId(null)
    setDraftRenameName('')
  }, [draftRenameName, renamePlaylist, renamingPlaylistId])

  const handleRemoveSongs = useCallback(
    (playlistId: string): void => {
      openRemoveSongsFromPlaylist(playlistId)
    },
    [openRemoveSongsFromPlaylist],
  )

  const handleRequestDelete = useCallback((playlist: Playlist): void => {
    setPlaylistPendingDelete(playlist)
    setOpenOptionsPlaylistId(null)
  }, [])

  const handleCancelDelete = useCallback((): void => {
    setPlaylistPendingDelete(null)
  }, [])

  const handleConfirmDelete = useCallback((): void => {
    if (!playlistPendingDelete) {
      return
    }

    const wasDeleted = deletePlaylist(playlistPendingDelete.id)

    if (wasDeleted) {
      if (renamingPlaylistId === playlistPendingDelete.id) {
        setRenamingPlaylistId(null)
        setDraftRenameName('')
      }

      addToast({
        type: 'remove',
        message: PLAYLIST_DELETED_TOAST_MESSAGE,
        duration: 2500,
      })
    }

    setPlaylistPendingDelete(null)
  }, [addToast, deletePlaylist, playlistPendingDelete, renamingPlaylistId])

  if (playlistsSubSection === 'detail' && selectedPlaylistId) {
    return <MainMenuPlaylistDetailSection playlistId={selectedPlaylistId} />
  }

  if (playlistsSubSection === 'add-songs' && selectedPlaylistId) {
    return <MainMenuAddSongsToPlaylistSection playlistId={selectedPlaylistId} />
  }

  if (playlistsSubSection === 'remove-songs' && selectedPlaylistId) {
    return <MainMenuRemoveSongsFromPlaylistSection playlistId={selectedPlaylistId} />
  }

  const hasPlaylists = playlists.length > 0

  return (
    <>
      <section
        className="main-menu-playlists-section flex min-h-0 flex-1 flex-col gap-4"
        aria-label="Listas de reproducción"
      >
      {isCreatingPlaylist ? (
        <MainMenuCreatePlaylistForm
          value={draftPlaylistName}
          onChange={setDraftPlaylistName}
          onAccept={handleAcceptCreate}
          onCancel={handleCancelCreate}
        />
      ) : (
        <button
          type="button"
          onClick={handleOpenCreateForm}
          className="main-menu-playlists-section__create-button bebas-neue-regular"
        >
          <span className="main-menu-playlists-section__create-label">CREAR TÚ LISTA</span>
          <Plus className="main-menu-playlists-section__create-icon" size={20} aria-hidden="true" />
        </button>
      )}

      {hasPlaylists ? (
        <ul className="main-menu-playlists-section__list main-menu-screen__scroll player-scroll flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
          {playlists.map((playlist) =>
            renamingPlaylistId === playlist.id ? (
              <li key={playlist.id}>
                <MainMenuCreatePlaylistForm
                  value={draftRenameName}
                  onChange={setDraftRenameName}
                  onAccept={handleAcceptRename}
                  onCancel={handleCancelRename}
                  formLabel="Nuevo nombre de la carpeta"
                  placeholder="Escribe el nuevo nombre"
                  ariaLabel="Cambiar nombre de carpeta"
                  inputId={`playlist-rename-input-${playlist.id}`}
                />
              </li>
            ) : (
              <li key={playlist.id} className="main-menu-playlists-section__list-item">
                <button
                  type="button"
                  onClick={() => handleOpenPlaylist(playlist.id)}
                  className="main-menu-playlists-section__list-item-main montserrat-regular"
                >
                  <span
                    className="main-menu-playlists-section__list-item-icon"
                    aria-hidden="true"
                  >
                    <PlaylistFolderDiscIcon size={44} />
                  </span>
                  <span className="main-menu-playlists-section__list-item-label">{playlist.name}</span>
                </button>

                <div className="main-menu-playlists-section__list-item-actions">
                  <MainMenuPlaylistOptionsMenu
                    playlist={playlist}
                    isOpen={openOptionsPlaylistId === playlist.id}
                    onToggle={() => handleToggleOptions(playlist.id)}
                    onClose={handleCloseOptions}
                    onRename={() => handleStartRename(playlist.id, playlist.name)}
                    onRemoveSongs={() => handleRemoveSongs(playlist.id)}
                    onDelete={() => handleRequestDelete(playlist)}
                  />
                </div>
              </li>
            ),
          )}
        </ul>
      ) : (
        !isCreatingPlaylist ? (
          <p className="main-menu-section__placeholder montserrat-regular text-sm text-[var(--player-text-muted)]">
            Aún no tienes listas de reproducción.
          </p>
        ) : null
      )}
      </section>

      <DeletePlaylistConfirmDialog
        isOpen={playlistPendingDelete !== null}
        playlist={playlistPendingDelete}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </>
  )
}
