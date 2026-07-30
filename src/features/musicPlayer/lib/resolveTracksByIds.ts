/** Resuelve pistas de la biblioteca a partir de una lista ordenada de identificadores. */

import type { Track } from '../types'

/**
 * Devuelve las pistas presentes en la biblioteca, conservando el orden de `trackIds`.
 */
export function resolveTracksByIds(
  libraryQueue: Track[],
  trackIds: readonly string[],
): Track[] {
  return trackIds
    .map((trackId) => libraryQueue.find((track) => track.id === trackId))
    .filter((track): track is Track => track !== undefined)
}
