/** Lógica pura de cola, navegación e historial del reproductor. */

import type { PlayerState, Track } from '../types'
import { audioEngine } from '../services/audioEngine'
import { resolveVisibleLibraryTracks } from '../lib/resolveVisibleLibraryTracks'
import { resolveTracksByIds } from '../lib/resolveTracksByIds'

const trackHistory: string[] = []

export function pushTrackHistory(trackId: string): void {
  if (trackHistory.at(-1) !== trackId) {
    trackHistory.push(trackId)
  }
}

export function resetTrackHistory(): void {
  trackHistory.length = 0
}

function findTrackInQueue(queue: Track[], trackId: string): Track | null {
  return queue.find((track) => track.id === trackId) ?? null
}

/** Recorre el historial real de reproducción, ignorando ids que ya no están en cola. */
function findPreviousTrackInHistory(state: PlayerState): Track | null {
  const { queue, currentTrack } = state

  if (!currentTrack || trackHistory.length === 0) {
    return null
  }

  const lastIndex = trackHistory.length - 1
  const startIndex =
    trackHistory[lastIndex] === currentTrack.id ? lastIndex - 1 : lastIndex

  for (let index = startIndex; index >= 0; index -= 1) {
    const candidate = findTrackInQueue(queue, trackHistory[index])

    if (candidate !== null && candidate.id !== currentTrack.id) {
      return candidate
    }
  }

  return null
}

function rewindHistoryToTrack(trackId: string): void {
  while (trackHistory.length > 0 && trackHistory.at(-1) !== trackId) {
    trackHistory.pop()
  }
}

function getSequentialPreviousTrack(state: PlayerState): Track | null {
  const { queue, currentTrack, repeatMode, isShuffle } = state

  if (!currentTrack || isShuffle) {
    return null
  }

  const currentIndex = queue.findIndex((track) => track.id === currentTrack.id)

  if (currentIndex > 0) {
    return queue[currentIndex - 1]
  }

  if (repeatMode === 'all') {
    return queue[queue.length - 1]
  }

  return null
}

/** Indica si el motor tiene cargada exactamente la pista visible en la UI. */
export function isEngineSyncedWithTrack(track: Track): boolean {
  return audioEngine.hasLoadedBuffer() && audioEngine.getLoadedTrack()?.id === track.id
}

function resolvePlaybackAnchorTrack(state: PlayerState): Track | null {
  return state.currentTrack ?? audioEngine.getLoadedTrack()
}

export function getNavigationState(state: PlayerState): PlayerState {
  const anchorTrack = resolvePlaybackAnchorTrack(state)

  if (anchorTrack === null || anchorTrack.id === state.currentTrack?.id) {
    return state
  }

  return { ...state, currentTrack: anchorTrack }
}

export function resolveFavoriteTracks(state: PlayerState): Track[] {
  return resolveTracksByIds(state.libraryQueue, state.favoriteTrackIds)
}

export function resolveLibraryPlaybackQueue(state: PlayerState): Track[] {
  return resolveVisibleLibraryTracks(state.libraryQueue, state.hiddenTrackIds)
}

export function syncActiveQueueWithLibrary(
  libraryTracks: Track[],
  activeQueue: Track[],
): Track[] {
  if (activeQueue.length === 0) {
    return libraryTracks
  }

  const libraryById = new Map(libraryTracks.map((track) => [track.id, track]))
  const syncedQueue = activeQueue
    .map((track) => libraryById.get(track.id))
    .filter((track): track is Track => track !== undefined)

  return syncedQueue.length > 0 ? syncedQueue : libraryTracks
}

interface GetNextTrackOptions {
  /** Al estar en la última pista, devuelve la primera de la cola. */
  wrapQueue?: boolean
}

export function getNextTrack(
  state: PlayerState,
  options: GetNextTrackOptions = {},
): Track | null {
  const { queue, currentTrack, isShuffle, repeatMode } = state
  const { wrapQueue = false } = options

  if (queue.length === 0 || !currentTrack) {
    return queue[0] ?? null
  }

  const currentIndex = queue.findIndex((track) => track.id === currentTrack.id)

  if (repeatMode === 'one') {
    return currentTrack
  }

  if (isShuffle) {
    if (queue.length === 1) {
      return repeatMode === 'all' ? queue[0] : null
    }

    const candidateIndices = queue
      .map((_, index) => index)
      .filter((index) => index !== currentIndex)

    if (candidateIndices.length === 0) {
      return repeatMode === 'all' ? queue[Math.floor(Math.random() * queue.length)] : null
    }

    const randomIndex =
      candidateIndices[Math.floor(Math.random() * candidateIndices.length)]

    return queue[randomIndex] ?? null
  }

  if (currentIndex < queue.length - 1) {
    return queue[currentIndex + 1]
  }

  if (repeatMode === 'all' || wrapQueue) {
    return queue[0]
  }

  return null
}

function getPreviousTrack(state: PlayerState): Track | null {
  if (!state.currentTrack || state.queue.length === 0) {
    return null
  }

  return findPreviousTrackInHistory(state) ?? getSequentialPreviousTrack(state)
}

/**
 * Elige la pista anterior y deja el historial apuntando a ella.
 * Así varios clics rápidos retroceden en orden, sin mezclar la cola.
 */
export function consumePreviousTrack(state: PlayerState): Track | null {
  const previousTrack = getPreviousTrack(state)

  if (!previousTrack) {
    return null
  }

  rewindHistoryToTrack(previousTrack.id)
  return previousTrack
}

export function getNextTrackAfterFailure(
  state: PlayerState,
  failedTrackId: string,
): Track | null {
  const failedIndex = state.queue.findIndex((track) => track.id === failedTrackId)

  if (failedIndex === -1) {
    return null
  }

  for (let index = failedIndex + 1; index < state.queue.length; index += 1) {
    return state.queue[index]
  }

  if (state.repeatMode === 'all' && state.queue.length > 1) {
    return state.queue.find((track) => track.id !== failedTrackId) ?? null
  }

  return null
}
