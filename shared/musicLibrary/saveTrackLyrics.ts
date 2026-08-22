/** Lectura y escritura de letras en disco. */

import fs from 'node:fs'
import path from 'node:path'
import { LYRICS_EXTENSIONS } from './constants'
import { validateLyricsContentSize } from './payloadLimits'
import { musicLibraryFailure, musicLibrarySuccess, type MusicLibraryResult } from './result'
import {
  resolveSafeLyricsPath,
  resolveValidatedLyricsRelativePath,
} from './safePaths'
import { ensureDirectoryExists, removeIdenticalContentFilesInDirectory } from './trackAssetFs'
import {
  collectObsoleteLyricsAbsolutePaths,
  removeDuplicateLyricsForTrack,
  removeObsoleteLyricsFiles,
  resolveStemBasedLyricsWriteTarget,
} from './trackLyricsAssets'
import type { SaveTrackLyricsRequest, SaveTrackLyricsResponse } from './types'

export function readTrackLyricsFromDisk(
  musicDirectory: string,
  relativePath: string,
): MusicLibraryResult<string> {
  const lyricsPath = resolveSafeLyricsPath(musicDirectory, relativePath)

  if (!lyricsPath) {
    return musicLibraryFailure(404, 'Letra no encontrada.')
  }

  try {
    return musicLibrarySuccess(fs.readFileSync(lyricsPath, 'utf8'))
  } catch {
    return musicLibraryFailure(500, 'No se pudo leer la letra en disco.')
  }
}

export function saveTrackLyrics(
  musicDirectory: string | null,
  payload: SaveTrackLyricsRequest,
): MusicLibraryResult<SaveTrackLyricsResponse> {
  if (!musicDirectory) {
    return musicLibraryFailure(404, 'Biblioteca de música no disponible.')
  }

  if (
    typeof payload.trackRelativePath !== 'string' ||
    typeof payload.lyricsContent !== 'string' ||
    !LYRICS_EXTENSIONS.includes(payload.lyricsExtension)
  ) {
    return musicLibraryFailure(400, 'Datos de letra incompletos.')
  }

  const lyricsSizeError = validateLyricsContentSize(payload.lyricsContent)
  if (lyricsSizeError) {
    return lyricsSizeError
  }

  const isEditingExistingLyrics = Boolean(payload.existingLyricsRelativePath)

  if (!payload.lyricsContent.trim() && !isEditingExistingLyrics) {
    return musicLibraryFailure(400, 'El archivo de letra está vacío.')
  }

  const lyricsWriteTarget = resolveStemBasedLyricsWriteTarget(
    musicDirectory,
    payload.trackRelativePath,
    payload.lyricsExtension,
  )

  if (!lyricsWriteTarget) {
    return musicLibraryFailure(404, 'No se pudo resolver la pista para guardar la letra.')
  }

  const validatedExistingLyricsRelativePath =
    typeof payload.existingLyricsRelativePath === 'string'
      ? resolveValidatedLyricsRelativePath(musicDirectory, payload.existingLyricsRelativePath)
      : null

  removeDuplicateLyricsForTrack(
    musicDirectory,
    payload.trackRelativePath,
    lyricsWriteTarget.absolutePath,
    validatedExistingLyricsRelativePath,
    payload.sourceLyricsFilename ?? null,
  )

  ensureDirectoryExists(path.dirname(lyricsWriteTarget.absolutePath))

  try {
    fs.writeFileSync(lyricsWriteTarget.absolutePath, payload.lyricsContent, 'utf8')
  } catch {
    return musicLibraryFailure(500, 'No se pudo escribir la letra en disco.')
  }

  removeObsoleteLyricsFiles(
    collectObsoleteLyricsAbsolutePaths(
      musicDirectory,
      payload.trackRelativePath,
      validatedExistingLyricsRelativePath,
      lyricsWriteTarget.absolutePath,
      payload.sourceLyricsFilename ?? null,
    ),
  )

  removeIdenticalContentFilesInDirectory(
    path.dirname(lyricsWriteTarget.absolutePath),
    LYRICS_EXTENSIONS,
    lyricsWriteTarget.absolutePath,
  )

  return musicLibrarySuccess({
    lyricsRelativePath: lyricsWriteTarget.relativePath,
  })
}
