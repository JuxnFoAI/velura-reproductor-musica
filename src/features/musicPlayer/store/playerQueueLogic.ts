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

export function popLastTrackHistory(): void {
  if (trackHistory.length >= 2) {
    trackHistory.pop()
  }
}

/** Indica si el motor tiene cargada exactamente la pista visible en la UI. */
export function isEngineSyncedWithTrack(track: Track): boolean {
  return audioEngine.hasLoadedBuffer() && audioEngine.getLoadedTrack()?.id === track.id
}

export function resolvePlaybackAnchorTrack(state: PlayerState): Track | null {
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

export interface GetNextTrackOptions {
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

export function getPreviousTrack(state: PlayerState): Track | null {
  const { queue, currentTrack, repeatMode } = state

  if (!currentTrack || queue.length === 0) {
    return null
  }

  if (trackHistory.length >= 2) {
    const previousTrackId = trackHistory[trackHistory.length - 2]
    return queue.find((track) => track.id === previousTrackId) ?? null
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
