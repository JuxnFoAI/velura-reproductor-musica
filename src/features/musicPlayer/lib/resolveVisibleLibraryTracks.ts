/** Filtra pistas ocultas de la biblioteca para listas y cola de reproducción. */
import type { Track } from '../types'

/**
 * Devuelve las pistas visibles de la biblioteca, excluyendo las marcadas como ocultas.
 */
export function resolveVisibleLibraryTracks(
  libraryQueue: Track[],
  hiddenTrackIds: string[],
): Track[] {
  if (hiddenTrackIds.length === 0) {
    return libraryQueue
  }

  const hiddenIds = new Set(hiddenTrackIds)
  return libraryQueue.filter((track) => !hiddenIds.has(track.id))
}

/**
 * Devuelve solo las pistas ocultas de la biblioteca.
 */
export function resolveHiddenLibraryTracks(
  libraryQueue: Track[],
  hiddenTrackIds: string[],
): Track[] {
  if (hiddenTrackIds.length === 0) {
    return []
  }

  const hiddenIds = new Set(hiddenTrackIds)
  return libraryQueue.filter((track) => hiddenIds.has(track.id))
}
