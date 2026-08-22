/** Eliminación de una pista y de sus portadas y letras asociadas. */

import { musicLibraryFailure, musicLibrarySuccess, type MusicLibraryResult } from './result'
import {
  resolveSafeAudioPath,
  resolveValidatedCoverRelativePath,
  resolveValidatedLyricsRelativePath,
} from './safePaths'
import { tryDeleteFile } from './trackAssetFs'
import { collectAllCoverAbsolutePathsForTrack } from './trackCoverAssets'
import { collectAllLyricsAbsolutePathsForTrack } from './trackLyricsAssets'
import type { DeleteTrackRequest, DeleteTrackResponse } from './types'

export function deleteTrack(
  musicDirectory: string | null,
  payload: DeleteTrackRequest,
): MusicLibraryResult<DeleteTrackResponse> {
  if (!musicDirectory) {
    return musicLibraryFailure(404, 'Biblioteca de música no disponible.')
  }

  if (typeof payload.trackRelativePath !== 'string') {
    return musicLibraryFailure(400, 'Datos de eliminación incompletos.')
  }

  const trackAbsolutePath = resolveSafeAudioPath(musicDirectory, payload.trackRelativePath)

  if (!trackAbsolutePath) {
    return musicLibraryFailure(404, 'No se encontró la pista para eliminar.')
  }

  const coverRelativePath =
    typeof payload.coverRelativePath === 'string'
      ? resolveValidatedCoverRelativePath(musicDirectory, payload.coverRelativePath)
      : null
  const lyricsRelativePath =
    typeof payload.lyricsRelativePath === 'string'
      ? resolveValidatedLyricsRelativePath(musicDirectory, payload.lyricsRelativePath)
      : null

  const coverAbsolutePaths = collectAllCoverAbsolutePathsForTrack(
    musicDirectory,
    payload.trackRelativePath,
    coverRelativePath,
  )
  const lyricsAbsolutePaths = collectAllLyricsAbsolutePathsForTrack(
    musicDirectory,
    payload.trackRelativePath,
    lyricsRelativePath,
  )

  let deletedCoverCount = 0
  let deletedLyricsCount = 0

  for (const coverAbsolutePath of coverAbsolutePaths) {
    if (tryDeleteFile(coverAbsolutePath)) {
      deletedCoverCount += 1
    }
  }

  for (const lyricsAbsolutePath of lyricsAbsolutePaths) {
    if (tryDeleteFile(lyricsAbsolutePath)) {
      deletedLyricsCount += 1
    }
  }

  if (!tryDeleteFile(trackAbsolutePath)) {
    return musicLibraryFailure(500, 'No se pudo eliminar el archivo de audio.')
  }

  return musicLibrarySuccess({
    deletedTrackRelativePath: payload.trackRelativePath,
    deletedCoverCount,
    deletedLyricsCount,
  })
}
