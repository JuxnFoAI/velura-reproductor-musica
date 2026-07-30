/** Store de listas de reproducción personalizadas del reproductor. */

import { create } from 'zustand'

import {
  loadPersistedPlaylists,
  savePersistedPlaylists,
} from '../services/persistenceService'
import type { Playlist } from '../types/playlist'

interface PlaylistsState {
  playlists: Playlist[]
  addPlaylist: (name: string) => string
  renamePlaylist: (playlistId: string, name: string) => boolean
  deletePlaylist: (playlistId: string) => boolean
  addTrackToPlaylist: (playlistId: string, trackId: string) => boolean
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => boolean
  getPlaylistById: (playlistId: string) => Playlist | undefined
}

function persistPlaylists(playlists: Playlist[]): void {
  savePersistedPlaylists(playlists)
}

export const usePlaylistsStore = create<PlaylistsState>((set, get) => ({
  playlists: loadPersistedPlaylists(),

  addPlaylist: (name) => {
    const trimmedName = name.trim()

    if (trimmedName.length === 0) {
      return ''
    }

    const id = crypto.randomUUID()
    const nextPlaylist: Playlist = { id, name: trimmedName, trackIds: [] }
    const nextPlaylists = [...get().playlists, nextPlaylist]

    set({ playlists: nextPlaylists })
    persistPlaylists(nextPlaylists)

    return id
  },

  renamePlaylist: (playlistId, name) => {
    const trimmedName = name.trim()

    if (trimmedName.length === 0 || !get().getPlaylistById(playlistId)) {
      return false
    }

    const nextPlaylists = get().playlists.map((entry) =>
      entry.id === playlistId ? { ...entry, name: trimmedName } : entry,
    )

    set({ playlists: nextPlaylists })
    persistPlaylists(nextPlaylists)

    return true
  },

  deletePlaylist: (playlistId) => {
    if (!get().getPlaylistById(playlistId)) {
      return false
    }

    const nextPlaylists = get().playlists.filter((entry) => entry.id !== playlistId)

    set({ playlists: nextPlaylists })
    persistPlaylists(nextPlaylists)

    return true
  },

  addTrackToPlaylist: (playlistId, trackId) => {
    const playlist = get().getPlaylistById(playlistId)

    if (!playlist || playlist.trackIds.includes(trackId)) {
      return false
    }

    const nextPlaylists = get().playlists.map((entry) =>
      entry.id === playlistId
        ? { ...entry, trackIds: [...entry.trackIds, trackId] }
        : entry,
    )

    set({ playlists: nextPlaylists })
    persistPlaylists(nextPlaylists)

    return true
  },

  removeTrackFromPlaylist: (playlistId, trackId) => {
    const playlist = get().getPlaylistById(playlistId)

    if (!playlist || !playlist.trackIds.includes(trackId)) {
      return false
    }

    const nextPlaylists = get().playlists.map((entry) =>
      entry.id === playlistId
        ? { ...entry, trackIds: entry.trackIds.filter((id) => id !== trackId) }
        : entry,
    )

    set({ playlists: nextPlaylists })
    persistPlaylists(nextPlaylists)

    return true
  },

  getPlaylistById: (playlistId) =>
    get().playlists.find((playlist) => playlist.id === playlistId),
}))
