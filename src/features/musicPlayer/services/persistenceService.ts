/** Persistencia en localStorage de preferencias y sesión del reproductor. */

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

/**
 * Carga preferencias guardadas del reproductor desde localStorage.
 */
export function loadPersistedSettings(): Partial<PersistedSettings> {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)

    if (!raw) {
      return {}
    }

    const parsed: unknown = JSON.parse(raw)

    if (typeof parsed !== 'object' || parsed === null) {
      return {}
    }

    const data = parsed as Partial<PersistedSettings>
    const result: Partial<PersistedSettings> = {}

    if (typeof data.volume === 'number' && data.volume >= 0 && data.volume <= 1) {
      result.volume = data.volume
    }

    if (Array.isArray(data.favoriteTrackIds)) {
      result.favoriteTrackIds = data.favoriteTrackIds.filter(
        (trackId): trackId is string => typeof trackId === 'string' && trackId.length > 0,
      )
    }

    if (Array.isArray(data.hiddenTrackIds)) {
      result.hiddenTrackIds = data.hiddenTrackIds.filter(
        (trackId): trackId is string => typeof trackId === 'string' && trackId.length > 0,
      )
    }

    return result
  } catch {
    return {}
  }
}

/**
 * Guarda preferencias del reproductor en localStorage.
 */
export function savePersistedSettings(settings: PersistedSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Ignorar errores de cuota o modo privado.
  }
}

/**
 * Carga la sesión de reproducción guardada, si existe y es válida.
 */
export function loadPersistedSession(): PersistedSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY)

    if (!raw) {
      return null
    }

    const parsed: unknown = JSON.parse(raw)

    if (typeof parsed !== 'object' || parsed === null) {
      return null
    }

    const data = parsed as Partial<PersistedSession>

    if (typeof data.trackRelativePath !== 'string' || !data.trackRelativePath) {
      return null
    }

    if (typeof data.currentTime !== 'number' || data.currentTime < 0) {
      return null
    }

    if (data.status !== 'playing' && data.status !== 'paused') {
      return null
    }

    if (typeof data.isLyricsVisible !== 'boolean') {
      return null
    }

    return {
      trackRelativePath: data.trackRelativePath,
      currentTime: data.currentTime,
      status: data.status,
      isLyricsVisible: data.isLyricsVisible,
    }
  } catch {
    return null
  }
}

/**
 * Guarda el estado de la sesión de reproducción en localStorage.
 */
export function savePersistedSession(session: PersistedSession): void {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
  } catch {
    // Ignorar errores de cuota o modo privado.
  }
}

/**
 * Elimina la sesión de reproducción guardada.
 */
export function clearPersistedSession(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY)
  } catch {
    // Ignorar errores de cuota o modo privado.
  }
}

function isValidPlaylist(value: unknown): value is Playlist {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const playlist = value as Partial<Playlist>

  return (
    typeof playlist.id === 'string' &&
    playlist.id.length > 0 &&
    typeof playlist.name === 'string' &&
    playlist.name.trim().length > 0 &&
    Array.isArray(playlist.trackIds) &&
    playlist.trackIds.every((trackId) => typeof trackId === 'string' && trackId.length > 0)
  )
}

/**
 * Carga las listas de reproducción personalizadas guardadas en localStorage.
 */
export function loadPersistedPlaylists(): Playlist[] {
  try {
    const raw = localStorage.getItem(PLAYLISTS_STORAGE_KEY)

    if (!raw) {
      return []
    }

    const parsed: unknown = JSON.parse(raw)

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter(isValidPlaylist)
  } catch {
    return []
  }
}

/**
 * Guarda las listas de reproducción personalizadas en localStorage.
 */
export function savePersistedPlaylists(playlists: Playlist[]): void {
  try {
    localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(playlists))
  } catch {
    // Ignorar errores de cuota o modo privado.
  }
}
