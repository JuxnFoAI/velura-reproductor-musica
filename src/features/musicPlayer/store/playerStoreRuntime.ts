/** Constantes, persistencia y efectos compartidos del store del reproductor. */
import {
  AUDIO_CONTEXT_BLOCKED_ERROR,
  audioEngine,
} from '../services/audioEngine'
import {
  loadPersistedSettings,
  savePersistedSession,
  savePersistedSettings,
  type PersistedPlaybackStatus,
} from '../services/persistenceService'
import type { PlayerState, RepeatMode } from '../types'
import { toastStore } from './toastStore'
import type { PlayerStoreGet } from './playerStoreTypes'

export const DEFAULT_VOLUME = 0.8
export const DEFAULT_REPEAT_MODE: RepeatMode = 'none'
export const RESTART_THRESHOLD_SECONDS = 3
export const TRACK_FADE_MS = 200
export const TRACK_END_TOLERANCE_SECONDS = 0.25
export const SESSION_PERSIST_INTERVAL_MS = 5000
export const REPEAT_RECOVERY_DELAY_MS = 50

let isRepeatingCurrentTrack = false
let lastSessionPersistAt = 0
let playbackRequestId = 0
let shouldAutoPlayAfterTrackChange = false

export function beginPlaybackRequest(): number {
  playbackRequestId += 1
  return playbackRequestId
}

export function isStalePlaybackRequest(requestId: number): boolean {
  return requestId !== playbackRequestId
}

export function isCurrentlyRepeatingTrack(): boolean {
  return isRepeatingCurrentTrack
}

export function setRepeatingCurrentTrack(isRepeating: boolean): void {
  isRepeatingCurrentTrack = isRepeating
}

/**
 * Conserva la intención de reproducir o pausar al saltar de pista.
 * Si la cola estaba sonando, el salto sigue en play; si estaba en pausa, permanece en pausa.
 */
export function resolveAutoPlayAfterTrackChange(state: PlayerState): boolean {
  if (state.status === 'playing' || audioEngine.isPlayingActive()) {
    shouldAutoPlayAfterTrackChange = true
    return true
  }

  if (state.status === 'paused' || state.status === 'idle') {
    shouldAutoPlayAfterTrackChange = false
    return false
  }

  return shouldAutoPlayAfterTrackChange
}

export function createInitialPlayerState(): PlayerState {
  const persisted = loadPersistedSettings()

  return {
    currentTrack: null,
    queue: [],
    libraryQueue: [],
    queueContext: 'library',
    status: 'idle',
    volume: persisted.volume ?? DEFAULT_VOLUME,
    isMuted: false,
    currentTime: 0,
    duration: 0,
    repeatMode: DEFAULT_REPEAT_MODE,
    isShuffle: false,
    isAudioBlocked: false,
    isLyricsVisible: false,
    favoriteTrackIds: persisted.favoriteTrackIds ?? [],
    hiddenTrackIds: persisted.hiddenTrackIds ?? [],
  }
}

export function clampVolume(volume: number): number {
  return Math.max(0, Math.min(volume, 1))
}

export function syncAudioSettings(state: PlayerState): void {
  audioEngine.setVolume(state.volume)
  audioEngine.setMuted(state.isMuted)
}

export function isAudioContextBlockedError(message: string): boolean {
  return message.includes(AUDIO_CONTEXT_BLOCKED_ERROR)
}

export function showErrorToast(message: string): void {
  toastStore.getState().addToast({ type: 'error', message })
}

export function persistSettings(state: PlayerState): void {
  savePersistedSettings({
    volume: state.volume,
    favoriteTrackIds: state.favoriteTrackIds,
    hiddenTrackIds: state.hiddenTrackIds,
  })
}

function resolvePersistedPlaybackStatus(status: PlayerState['status']): PersistedPlaybackStatus {
  return status === 'playing' ? 'playing' : 'paused'
}

export function persistCurrentSession(get: PlayerStoreGet): void {
  const state = get()
  const relativePath = state.currentTrack?.relativePath

  if (!relativePath || state.status === 'loading' || !state.currentTrack) {
    return
  }

  savePersistedSession({
    trackRelativePath: relativePath,
    currentTime: state.currentTime,
    status: resolvePersistedPlaybackStatus(state.status),
    isLyricsVisible: state.isLyricsVisible,
  })
}

export function persistCurrentSessionThrottled(get: PlayerStoreGet): void {
  const now = Date.now()

  if (now - lastSessionPersistAt < SESSION_PERSIST_INTERVAL_MS) {
    return
  }

  lastSessionPersistAt = now
  persistCurrentSession(get)
}
