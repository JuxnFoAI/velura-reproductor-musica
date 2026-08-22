/** Escritura de portadas en disco y tipo MIME asociado. */

import fs from 'node:fs'
import path from 'node:path'
import { COVER_EXTENSIONS } from './constants'
import {
  validateCoverImageBufferSize,
  validateCoverImageDataUrlSize,
} from './payloadLimits'
import { musicLibraryFailure, musicLibrarySuccess, type MusicLibraryResult } from './result'
import {
  resolveAbsolutePathWithinMusicDirectory,
  resolveSafeAudioPath,
  resolveValidatedCoverRelativePath,
} from './safePaths'
import { ensureDirectoryExists, removeIdenticalContentFilesInDirectory } from './trackAssetFs'
import {
  buildCoverRelativePath,
  collectObsoleteCoverAbsolutePaths,
  removeDuplicateCoversForTrack,
  removeObsoleteCoverFiles,
} from './trackCoverAssets'
import type { SaveTrackCoverRequest, SaveTrackCoverResponse } from './types'

export function resolveCoverContentType(relativePath: string): string {
  const extension = path.extname(relativePath).toLowerCase()

  switch (extension) {
    case '.png':
      return 'image/png'
    case '.webp':
      return 'image/webp'
    default:
      return 'image/jpeg'
  }
}

function parseImageDataUrl(imageDataUrl: string): Buffer | null {
  const match = /^data:image\/[\w+.-]+;base64,(.+)$/.exec(imageDataUrl)

  if (!match?.[1]) {
    return null
  }

  return Buffer.from(match[1], 'base64')
}

interface CoverWriteTarget {
  relativePath: string
  absolutePath: string
  obsoleteAbsolutePaths: string[]
}

/**
 * Determina dónde escribir la portada usando el stem del MP3 como nombre canónico.
 */
function resolveCoverWriteTarget(
  musicDirectory: string,
  trackRelativePath: string,
  knownCoverRelativePath: string | null,
): CoverWriteTarget | null {
  const safeTrackPath = resolveSafeAudioPath(musicDirectory, trackRelativePath)

  if (!safeTrackPath) {
    return null
  }

  const filename = path.basename(trackRelativePath)
  const mp3Stem = path.basename(filename, path.extname(filename))
  const nextRelativePath = buildCoverRelativePath(`${mp3Stem}.jpg`)
  const nextAbsolutePath = resolveAbsolutePathWithinMusicDirectory(musicDirectory, nextRelativePath)

  if (!nextAbsolutePath) {
    return null
  }

  return {
    relativePath: nextRelativePath,
    absolutePath: nextAbsolutePath,
    obsoleteAbsolutePaths: collectObsoleteCoverAbsolutePaths(
      musicDirectory,
      trackRelativePath,
      knownCoverRelativePath,
      nextAbsolutePath,
    ),
  }
}

export function saveTrackCover(
  musicDirectory: string | null,
  payload: SaveTrackCoverRequest,
): MusicLibraryResult<SaveTrackCoverResponse> {
  if (!musicDirectory) {
    return musicLibraryFailure(404, 'Biblioteca de música no disponible.')
  }

  if (
    typeof payload.trackRelativePath !== 'string' ||
    typeof payload.imageDataUrl !== 'string'
  ) {
    return musicLibraryFailure(400, 'Datos de portada incompletos.')
  }

  const coverDataUrlSizeError = validateCoverImageDataUrlSize(payload.imageDataUrl)
  if (coverDataUrlSizeError) {
    return coverDataUrlSizeError
  }

  const imageBuffer = parseImageDataUrl(payload.imageDataUrl)

  if (!imageBuffer || imageBuffer.length === 0) {
    return musicLibraryFailure(400, 'Imagen de portada inválida.')
  }

  const coverBufferSizeError = validateCoverImageBufferSize(imageBuffer)
  if (coverBufferSizeError) {
    return coverBufferSizeError
  }

  const validatedCoverRelativePath =
    typeof payload.coverRelativePath === 'string'
      ? resolveValidatedCoverRelativePath(musicDirectory, payload.coverRelativePath)
      : null

  const coverWriteTarget = resolveCoverWriteTarget(
    musicDirectory,
    payload.trackRelativePath,
    validatedCoverRelativePath,
  )

  if (!coverWriteTarget) {
    return musicLibraryFailure(404, 'No se pudo resolver la pista para guardar la portada.')
  }

  ensureDirectoryExists(path.dirname(coverWriteTarget.absolutePath))

  try {
    fs.writeFileSync(coverWriteTarget.absolutePath, imageBuffer)

    removeDuplicateCoversForTrack(
      musicDirectory,
      payload.trackRelativePath,
      coverWriteTarget.absolutePath,
      validatedCoverRelativePath,
    )

    removeObsoleteCoverFiles(coverWriteTarget.obsoleteAbsolutePaths)

    removeIdenticalContentFilesInDirectory(
      path.dirname(coverWriteTarget.absolutePath),
      COVER_EXTENSIONS,
      coverWriteTarget.absolutePath,
    )
  } catch {
    return musicLibraryFailure(500, 'No se pudo escribir la portada en disco.')
  }

  return musicLibrarySuccess({
    coverRelativePath: coverWriteTarget.relativePath,
  })
}
