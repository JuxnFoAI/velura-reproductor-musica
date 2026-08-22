/** Renombrado de una pista y de sus portadas y letras asociadas. */

import fs from 'node:fs'
import path from 'node:path'
import { buildAudioFilename } from './buildAudioFilename'
import { createTrackId } from './createTrackId'
import { parseAudioFilename } from './parseAudioFilename'
import { musicLibraryFailure, musicLibrarySuccess, type MusicLibraryResult } from './result'
import {
  resolveSafeAudioPath,
  resolveSafeCoverPath,
  resolveSafeLyricsPath,
  resolveValidatedCoverRelativePath,
} from './safePaths'
import { normalizeRelativePath } from './trackAssetFs'
import {
  collectObsoleteCoverAbsolutePaths,
  removeDuplicateCoversForTrack,
  removeObsoleteCoverFiles,
  renameAssociatedCoverIfNeeded,
} from './trackCoverAssets'
import {
  collectObsoleteLyricsAbsolutePaths,
  removeDuplicateLyricsForTrack,
  removeObsoleteLyricsFiles,
  renameAssociatedLyricsIfNeeded,
  resolveTrackLyricsPath,
} from './trackLyricsAssets'
import type { RenameTrackRequest, RenameTrackResponse } from './types'

export function renameTrack(
  musicDirectory: string | null,
  payload: RenameTrackRequest,
): MusicLibraryResult<RenameTrackResponse> {
  if (!musicDirectory) {
    return musicLibraryFailure(404, 'Biblioteca de música no disponible.')
  }

  if (
    typeof payload.trackRelativePath !== 'string' ||
    typeof payload.title !== 'string' ||
    typeof payload.artist !== 'string'
  ) {
    return musicLibraryFailure(400, 'Datos de renombrado incompletos.')
  }

  const currentAbsolutePath = resolveSafeAudioPath(musicDirectory, payload.trackRelativePath)

  if (!currentAbsolutePath) {
    return musicLibraryFailure(404, 'No se encontró la pista para renombrar.')
  }

  let nextFilename: string

  try {
    nextFilename = buildAudioFilename(payload.artist, payload.title)
  } catch {
    return musicLibraryFailure(400, 'Artista y título no son válidos para renombrar.')
  }

  const nextAbsolutePath = path.join(path.dirname(currentAbsolutePath), nextFilename)
  const nextRelativePath = normalizeRelativePath(musicDirectory, nextAbsolutePath)
  const currentRelativePath = normalizeRelativePath(musicDirectory, currentAbsolutePath)

  if (path.resolve(nextAbsolutePath) !== path.resolve(currentAbsolutePath)) {
    if (fs.existsSync(nextAbsolutePath)) {
      return musicLibraryFailure(
        409,
        'Ya existe otra canción con ese nombre en la biblioteca.',
      )
    }

    try {
      fs.renameSync(currentAbsolutePath, nextAbsolutePath)
    } catch {
      return musicLibraryFailure(500, 'No se pudo renombrar el archivo de audio.')
    }
  }

  let nextCoverRelativePath: string | null
  let nextLyricsRelativePath = resolveTrackLyricsPath(
    musicDirectory,
    currentRelativePath,
    path.basename(currentRelativePath),
  )

  const validatedKnownCoverRelativePath =
    typeof payload.coverRelativePath === 'string'
      ? resolveValidatedCoverRelativePath(musicDirectory, payload.coverRelativePath)
      : null

  try {
    nextCoverRelativePath = renameAssociatedCoverIfNeeded(
      musicDirectory,
      currentRelativePath,
      nextRelativePath,
      validatedKnownCoverRelativePath,
    )
    nextLyricsRelativePath = renameAssociatedLyricsIfNeeded(
      musicDirectory,
      currentRelativePath,
      nextRelativePath,
      nextLyricsRelativePath,
    )
  } catch {
    return musicLibraryFailure(500, 'No se pudo renombrar los archivos asociados.')
  }

  if (nextLyricsRelativePath) {
    const nextLyricsAbsolutePath = resolveSafeLyricsPath(musicDirectory, nextLyricsRelativePath)

    if (nextLyricsAbsolutePath) {
      removeDuplicateLyricsForTrack(
        musicDirectory,
        nextRelativePath,
        nextLyricsAbsolutePath,
        nextLyricsRelativePath,
      )

      removeObsoleteLyricsFiles(
        collectObsoleteLyricsAbsolutePaths(
          musicDirectory,
          nextRelativePath,
          nextLyricsRelativePath,
          nextLyricsAbsolutePath,
        ),
      )
    }
  }

  if (nextCoverRelativePath) {
    const nextCoverAbsolutePath = resolveSafeCoverPath(musicDirectory, nextCoverRelativePath)

    if (nextCoverAbsolutePath) {
      removeDuplicateCoversForTrack(
        musicDirectory,
        nextRelativePath,
        nextCoverAbsolutePath,
        nextCoverRelativePath,
      )

      removeObsoleteCoverFiles(
        collectObsoleteCoverAbsolutePaths(
          musicDirectory,
          nextRelativePath,
          nextCoverRelativePath,
          nextCoverAbsolutePath,
        ),
      )
    }
  }

  const parsedFilename = parseAudioFilename(nextFilename)

  return musicLibrarySuccess({
    id: createTrackId(nextRelativePath),
    relativePath: nextRelativePath,
    filename: nextFilename,
    title: parsedFilename.title,
    artist: parsedFilename.artist,
    coverRelativePath: nextCoverRelativePath,
    lyricsRelativePath: nextLyricsRelativePath,
  })
}
