/** Mutaciones de pistas en cola, biblioteca y pista actual. */
import { audioEngine } from '../services/audioEngine'
import { revokeTrackResources } from '../services/fileService'
import { clearPersistedSession } from '../services/persistenceService'
import type { Track } from '../types'
import { persistSettings } from './playerStoreRuntime'
import type { PlayerStoreGet, PlayerStoreSet } from './playerStoreTypes'
import { resolveFavoriteTracks } from './playerQueueLogic'

export function revokeQueueUrls(queue: Track[]): void {
  queue.forEach((track) => revokeTrackResources(track))
}

export function isSameTrackLibrary(currentQueue: Track[], nextQueue: Track[]): boolean {
  if (currentQueue.length !== nextQueue.length) {
    return false
  }

  if (currentQueue.length === 0) {
    return true
  }

  return currentQueue.every((track, index) => track.id === nextQueue[index]?.id)
}

function updateTrackCoverInList(
  tracks: Track[],
  trackId: string,
  coverUrl: string,
  coverRelativePath?: string | null,
): Track[] {
  return tracks.map((track) => {
    if (track.id !== trackId) {
      return track
    }

    return {
      ...track,
      coverUrl,
      ...(coverRelativePath !== undefined ? { coverRelativePath } : {}),
    }
  })
}

export function updateTrackCoverInState(
  set: PlayerStoreSet,
  trackId: string,
  coverUrl: string,
  coverRelativePath?: string | null,
): void {
  set((currentState) => ({
    ...currentState,
    queue: updateTrackCoverInList(currentState.queue, trackId, coverUrl, coverRelativePath),
    libraryQueue: updateTrackCoverInList(
      currentState.libraryQueue,
      trackId,
      coverUrl,
      coverRelativePath,
    ),
    currentTrack:
      currentState.currentTrack?.id === trackId
        ? {
            ...currentState.currentTrack,
            coverUrl,
            ...(coverRelativePath !== undefined ? { coverRelativePath } : {}),
          }
        : currentState.currentTrack,
  }))
}

function updateTrackLyricsInList(
  tracks: Track[],
  trackId: string,
  lyricsRelativePath: string,
): Track[] {
  return tracks.map((track) => {
    if (track.id !== trackId) {
      return track
    }

    return {
      ...track,
      lyricsRelativePath,
    }
  })
}

export function updateTrackLyricsInState(
  set: PlayerStoreSet,
  trackId: string,
  lyricsRelativePath: string,
): void {
  set((currentState) => ({
    ...currentState,
    queue: updateTrackLyricsInList(currentState.queue, trackId, lyricsRelativePath),
    libraryQueue: updateTrackLyricsInList(
      currentState.libraryQueue,
      trackId,
      lyricsRelativePath,
    ),
    currentTrack:
      currentState.currentTrack?.id === trackId
        ? {
            ...currentState.currentTrack,
            lyricsRelativePath,
          }
        : currentState.currentTrack,
  }))
}

export function bumpLyricsContentRevision(set: PlayerStoreSet, trackId: string): void {
  set((currentState) => ({
    ...currentState,
    lyricsContentRevisions: {
      ...currentState.lyricsContentRevisions,
      [trackId]: (currentState.lyricsContentRevisions[trackId] ?? 0) + 1,
    },
  }))
}

export function replaceTrackInState(
  set: PlayerStoreSet,
  previousTrackId: string,
  nextTrack: Track,
): void {
  set((currentState) => ({
    ...currentState,
    queue: currentState.queue.map((track) =>
      track.id === previousTrackId ? nextTrack : track,
    ),
    libraryQueue: currentState.libraryQueue.map((track) =>
      track.id === previousTrackId ? nextTrack : track,
    ),
    currentTrack:
      currentState.currentTrack?.id === previousTrackId
        ? nextTrack
        : currentState.currentTrack,
  }))
}

export function removeTrackFromState(
  set: PlayerStoreSet,
  get: PlayerStoreGet,
  trackId: string,
  deletedTrack: Track,
): void {
  const state = get()
  const isCurrentTrack = state.currentTrack?.id === trackId

  if (isCurrentTrack) {
    audioEngine.stop()
    clearPersistedSession()
  }

  revokeTrackResources(deletedTrack)

  const nextLibraryQueue = state.libraryQueue.filter((track) => track.id !== trackId)
  const nextFavoriteTrackIds = state.favoriteTrackIds.filter((id) => id !== trackId)
  const nextHiddenTrackIds = state.hiddenTrackIds.filter((id) => id !== trackId)
  const nextQueue =
    state.queueContext === 'favorites'
      ? resolveFavoriteTracks({
          ...state,
          libraryQueue: nextLibraryQueue,
          favoriteTrackIds: nextFavoriteTrackIds,
        })
      : nextLibraryQueue

  const nextLyricsRevisions = { ...state.lyricsContentRevisions }
  delete nextLyricsRevisions[trackId]

  set({
    libraryQueue: nextLibraryQueue,
    queue: nextQueue,
    favoriteTrackIds: nextFavoriteTrackIds,
    hiddenTrackIds: nextHiddenTrackIds,
    lyricsContentRevisions: nextLyricsRevisions,
    ...(isCurrentTrack
      ? {
          currentTrack: null,
          status: 'idle',
          currentTime: 0,
          duration: 0,
          isLyricsVisible: false,
        }
      : {}),
  })

  persistSettings({
    ...get(),
    favoriteTrackIds: nextFavoriteTrackIds,
    hiddenTrackIds: nextHiddenTrackIds,
  })
}
