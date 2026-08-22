/** Persistencia en localStorage de preferencias y sesión del reproductor. */

import { createPersistedJsonStorage, isJsonObject } from '@lib/createPersistedJsonStorage'

import type { Playlist } from '../types/playlist'

const SETTINGS_STORAGE_KEY = 'music-player-settings'
const SESSION_STORAGE_KEY = 'music-player-session'
const PLAYLISTS_STORAGE_KEY = 'music-player-playlists'

interface PersistedSettings {
  volume: number
  favoriteTrackIds?: string[]
  hiddenTrackIds?: string[]
}

export type PersistedPlaybackStatus = 'playing' | 'paused'

export interface PersistedSession {
  trackRelativePath: string
  currentTime: number
  status: PersistedPlaybackStatus
  isLyricsVisible: boolean
}

function readStringIdList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }

  return value.filter((trackId): trackId is string => typeof trackId === 'string' && trackId.length > 0)
}

function validateSettings(value: unknown): Partial<PersistedSettings> | null {
  if (!isJsonObject(value)) {
    return null
  }

  const result: Partial<PersistedSettings> = {}

  if (typeof value.volume === 'number' && value.volume >= 0 && value.volume <= 1) {
    result.volume = value.volume
  }

  const favoriteTrackIds = readStringIdList(value.favoriteTrackIds)
  const hiddenTrackIds = readStringIdList(value.hiddenTrackIds)

  if (favoriteTrackIds) {
    result.favoriteTrackIds = favoriteTrackIds
  }

  if (hiddenTrackIds) {
    result.hiddenTrackIds = hiddenTrackIds
  }

  return result
}

function isPersistedPlaybackStatus(value: unknown): value is PersistedPlaybackStatus {
  return value === 'playing' || value === 'paused'
}

function validateSession(value: unknown): PersistedSession | null {
  if (!isJsonObject(value)) {
    return null
  }

  if (typeof value.trackRelativePath !== 'string' || !value.trackRelativePath) {
    return null
  }

  if (typeof value.currentTime !== 'number' || value.currentTime < 0) {
    return null
  }

  if (!isPersistedPlaybackStatus(value.status) || typeof value.isLyricsVisible !== 'boolean') {
    return null
  }

  return {
    trackRelativePath: value.trackRelativePath,
    currentTime: value.currentTime,
    status: value.status,
    isLyricsVisible: value.isLyricsVisible,
  }
}

function isValidPlaylist(value: unknown): value is Playlist {
  if (!isJsonObject(value)) {
    return false
  }

  return (
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    typeof value.name === 'string' &&
    value.name.trim().length > 0 &&
    Array.isArray(value.trackIds) &&
    value.trackIds.every((trackId) => typeof trackId === 'string' && trackId.length > 0)
  )
}

function validatePlaylists(value: unknown): Playlist[] | null {
  if (!Array.isArray(value)) {
    return null
  }

  return value.filter(isValidPlaylist)
}

const settingsStorage = createPersistedJsonStorage<Partial<PersistedSettings>>(
  SETTINGS_STORAGE_KEY,
  {},
  validateSettings,
)
const persistedSessionStorage = createPersistedJsonStorage<PersistedSession | null>(
  SESSION_STORAGE_KEY,
  null,
  validateSession,
)
const playlistsStorage = createPersistedJsonStorage<Playlist[]>(
  PLAYLISTS_STORAGE_KEY,
  [],
  validatePlaylists,
)

export const loadPersistedSettings = settingsStorage.load
export const savePersistedSettings = settingsStorage.save
export const loadPersistedSession = persistedSessionStorage.load
export function savePersistedSession(session: PersistedSession): void {
  persistedSessionStorage.save(session)
}
export const clearPersistedSession = persistedSessionStorage.clear
export const loadPersistedPlaylists = playlistsStorage.load
export const savePersistedPlaylists = playlistsStorage.save
