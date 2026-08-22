/** Resolución, poda y rename de letras asociadas a una pista. */

import fs from 'node:fs'
import path from 'node:path'
import { LYRICS_EXTENSIONS } from './constants'
import { LYRICS_DIRECTORY } from './musicDirectoryResolver'
import {
  resolveAbsolutePathWithinMusicDirectory,
  resolveSafeAudioPath,
  resolveSafeLyricsPath,
  resolveValidatedLyricsRelativePath,
} from './safePaths'
import {
  collectMatchingAssetsInDirectory,
  ensureDirectoryExists,
  findAssetRelativePathByNormalizedStem,
  migrateAssetToCanonicalRelativePath,
  normalizeRelativePath,
  removeDuplicateAssetFilesInDirectory,
  removeIdenticalContentFilesInDirectory,
} from './trackAssetFs'

export function resolveTrackLyricsPath(
  musicDirectory: string,
  relativePath: string,
  filename: string,
): string | null {
  const stem = path.basename(filename, path.extname(filename))
  const directory = path.dirname(relativePath)

  for (const extension of LYRICS_EXTENSIONS) {
    const lyricsInLyricsDirectory = buildLyricsRelativePath(`${stem}${extension}`)

    if (isExistingLyricsFile(musicDirectory, lyricsInLyricsDirectory)) {
      return lyricsInLyricsDirectory
    }
  }

  for (const extension of LYRICS_EXTENSIONS) {
    const lyricsFilename = `${stem}${extension}`
    const lyricsRelativePath =
      directory === '.' ? lyricsFilename : path.join(directory, lyricsFilename)

    if (isExistingLyricsFile(musicDirectory, lyricsRelativePath)) {
      return lyricsRelativePath
    }
  }

  const normalizedLyricsMatch = findAssetRelativePathByNormalizedStem(
    musicDirectory,
    LYRICS_DIRECTORY,
    stem,
    LYRICS_EXTENSIONS,
  )

  if (normalizedLyricsMatch) {
    return normalizedLyricsMatch
  }

  return null
}

function isExistingLyricsFile(musicDirectory: string, relativePath: string): boolean {
  return resolveSafeLyricsPath(musicDirectory, relativePath) !== null
}

function buildLyricsRelativePath(lyricsFilename: string): string {
  return path.join(LYRICS_DIRECTORY, lyricsFilename)
}

/**
 * Resuelve la ruta canónica de letra usando el mismo stem del MP3 asociado.
 * Debe coincidir con la lógica de `resolveTrackLyricsPath` para que persista al recargar.
 */
export function resolveStemBasedLyricsWriteTarget(
  musicDirectory: string,
  trackRelativePath: string,
  lyricsExtension: (typeof LYRICS_EXTENSIONS)[number],
): { relativePath: string; absolutePath: string } | null {
  const safeTrackPath = resolveSafeAudioPath(musicDirectory, trackRelativePath)

  if (!safeTrackPath) {
    return null
  }

  const filename = path.basename(trackRelativePath)
  const mp3Stem = path.basename(filename, path.extname(filename))
  const nextRelativePath = buildLyricsRelativePath(`${mp3Stem}${lyricsExtension}`)
  const nextAbsolutePath = resolveAbsolutePathWithinMusicDirectory(musicDirectory, nextRelativePath)

  if (!nextAbsolutePath) {
    return null
  }

  return {
    relativePath: nextRelativePath,
    absolutePath: nextAbsolutePath,
  }
}

export function collectAssociatedLyricsStems(
  trackRelativePath: string,
  knownLyricsRelativePath: string | null,
  sourceLyricsFilename?: string | null,
): string[] {
  const filename = path.basename(trackRelativePath)
  const mp3Stem = path.basename(filename, path.extname(filename))
  const stems = new Set<string>([mp3Stem])

  if (knownLyricsRelativePath) {
    stems.add(
      path.basename(knownLyricsRelativePath, path.extname(knownLyricsRelativePath)),
    )
  }

  if (sourceLyricsFilename) {
    stems.add(
      path.basename(sourceLyricsFilename, path.extname(sourceLyricsFilename)),
    )
  }

  return [...stems]
}

export function removeDuplicateLyricsForTrack(
  musicDirectory: string,
  trackRelativePath: string,
  keepAbsolutePath: string,
  knownLyricsRelativePath: string | null = null,
  sourceLyricsFilename: string | null = null,
): void {
  removeDuplicateAssetFilesInDirectory(
    musicDirectory,
    LYRICS_DIRECTORY,
    LYRICS_EXTENSIONS,
    collectAssociatedLyricsStems(
      trackRelativePath,
      knownLyricsRelativePath,
      sourceLyricsFilename,
    ),
    keepAbsolutePath,
  )
}

/**
 * Localiza letras obsoletas de la pista fuera del archivo canónico que se conservará.
 */
export function collectObsoleteLyricsAbsolutePaths(
  musicDirectory: string,
  trackRelativePath: string,
  knownLyricsRelativePath: string | null,
  keepAbsolutePath: string,
  sourceLyricsFilename: string | null = null,
): string[] {
  const filename = path.basename(trackRelativePath)
  const trackDirectory = path.dirname(trackRelativePath)
  const associatedStems = collectAssociatedLyricsStems(
    trackRelativePath,
    knownLyricsRelativePath,
    sourceLyricsFilename,
  )
  const resolvedLyricsPath = resolveTrackLyricsPath(musicDirectory, trackRelativePath, filename)
  const candidateRelativePaths = new Set<string>()

  if (knownLyricsRelativePath) {
    const validatedLyricsPath = resolveValidatedLyricsRelativePath(
      musicDirectory,
      knownLyricsRelativePath,
    )

    if (validatedLyricsPath) {
      candidateRelativePaths.add(validatedLyricsPath)
    }
  }

  if (resolvedLyricsPath) {
    candidateRelativePaths.add(resolvedLyricsPath)
  }

  for (const stem of associatedStems) {
    for (const extension of LYRICS_EXTENSIONS) {
      candidateRelativePaths.add(buildLyricsRelativePath(`${stem}${extension}`))

      const lyricsFilename = `${stem}${extension}`
      candidateRelativePaths.add(
        trackDirectory === '.' ? lyricsFilename : path.join(trackDirectory, lyricsFilename),
      )
    }
  }

  const keepResolvedPath = path.resolve(keepAbsolutePath)
  const obsoletePaths: string[] = []

  for (const relativePath of candidateRelativePaths) {
    const absolutePath = resolveAbsolutePathWithinMusicDirectory(musicDirectory, relativePath)

    if (!absolutePath || path.resolve(absolutePath) === keepResolvedPath) {
      continue
    }

    if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()) {
      obsoletePaths.push(absolutePath)
    }
  }

  return obsoletePaths
}

export function removeObsoleteLyricsFiles(obsoleteAbsolutePaths: string[]): void {
  for (const obsoletePath of obsoleteAbsolutePaths) {
    if (!fs.existsSync(obsoletePath)) {
      continue
    }

    try {
      fs.unlinkSync(obsoletePath)
    } catch {
      // Si no se puede eliminar una letra obsoleta, la canónica sigue siendo válida.
    }
  }
}

export function resolveCanonicalLyricsKeepAbsolutePath(
  musicDirectory: string,
  trackRelativePath: string,
  filename: string,
): string | null {
  const mp3Stem = path.basename(filename, path.extname(filename))

  for (const extension of LYRICS_EXTENSIONS) {
    const canonicalAbsolutePath = resolveSafeLyricsPath(
      musicDirectory,
      buildLyricsRelativePath(`${mp3Stem}${extension}`),
    )

    if (canonicalAbsolutePath) {
      return canonicalAbsolutePath
    }
  }

  const resolvedLyricsRelativePath = resolveTrackLyricsPath(
    musicDirectory,
    trackRelativePath,
    filename,
  )

  if (!resolvedLyricsRelativePath) {
    return null
  }

  return resolveSafeLyricsPath(musicDirectory, resolvedLyricsRelativePath)
}

export function pruneDuplicateLyricsAssets(
  musicDirectory: string,
  trackRelativePath: string,
  filename: string,
): void {
  let keepAbsolutePath = resolveCanonicalLyricsKeepAbsolutePath(
    musicDirectory,
    trackRelativePath,
    filename,
  )

  if (!keepAbsolutePath) {
    return
  }

  const mp3Stem = path.basename(filename, path.extname(filename))
  const keepExtension = path.extname(keepAbsolutePath)
  const canonicalRelativePath = buildLyricsRelativePath(`${mp3Stem}${keepExtension}`)
  const canonicalAbsolutePath = resolveAbsolutePathWithinMusicDirectory(
    musicDirectory,
    canonicalRelativePath,
  )

  if (
    canonicalAbsolutePath &&
    path.resolve(keepAbsolutePath) !== path.resolve(canonicalAbsolutePath)
  ) {
    const migratedAbsolutePath = migrateAssetToCanonicalRelativePath(
      musicDirectory,
      keepAbsolutePath,
      canonicalRelativePath,
    )

    if (migratedAbsolutePath) {
      keepAbsolutePath = migratedAbsolutePath
    }
  }

  const keepRelativePath = normalizeRelativePath(musicDirectory, keepAbsolutePath)

  removeDuplicateLyricsForTrack(
    musicDirectory,
    trackRelativePath,
    keepAbsolutePath,
    keepRelativePath,
  )

  removeObsoleteLyricsFiles(
    collectObsoleteLyricsAbsolutePaths(
      musicDirectory,
      trackRelativePath,
      keepRelativePath,
      keepAbsolutePath,
    ),
  )

  removeIdenticalContentFilesInDirectory(
    path.join(musicDirectory, LYRICS_DIRECTORY),
    LYRICS_EXTENSIONS,
    keepAbsolutePath,
  )
}

export function renameAssociatedLyricsIfNeeded(
  musicDirectory: string,
  oldTrackRelativePath: string,
  newTrackRelativePath: string,
  knownLyricsRelativePath: string | null,
): string | null {
  const oldFilename = path.basename(oldTrackRelativePath)
  const newFilename = path.basename(newTrackRelativePath)
  const oldStem = path.basename(oldFilename, path.extname(oldFilename))
  const newStem = path.basename(newFilename, path.extname(newFilename))

  const existingLyricsRelativePath =
    knownLyricsRelativePath ??
    resolveTrackLyricsPath(musicDirectory, oldTrackRelativePath, oldFilename)

  if (!existingLyricsRelativePath) {
    return null
  }

  const existingLyricsAbsolutePath = resolveSafeLyricsPath(
    musicDirectory,
    existingLyricsRelativePath,
  )

  if (!existingLyricsAbsolutePath) {
    return null
  }

  if (oldStem === newStem) {
    return existingLyricsRelativePath
  }

  const lyricsExtension = path.extname(existingLyricsAbsolutePath)
  const canonicalRelativePath = buildLyricsRelativePath(`${newStem}${lyricsExtension}`)
  const canonicalAbsolutePath = resolveAbsolutePathWithinMusicDirectory(
    musicDirectory,
    canonicalRelativePath,
  )

  if (!canonicalAbsolutePath) {
    return existingLyricsRelativePath
  }

  ensureDirectoryExists(path.dirname(canonicalAbsolutePath))

  if (
    fs.existsSync(canonicalAbsolutePath) &&
    path.resolve(canonicalAbsolutePath) !== path.resolve(existingLyricsAbsolutePath)
  ) {
    fs.unlinkSync(canonicalAbsolutePath)
  }

  if (path.resolve(existingLyricsAbsolutePath) !== path.resolve(canonicalAbsolutePath)) {
    fs.renameSync(existingLyricsAbsolutePath, canonicalAbsolutePath)
  }

  removeDuplicateLyricsForTrack(
    musicDirectory,
    newTrackRelativePath,
    canonicalAbsolutePath,
    canonicalRelativePath,
  )

  removeObsoleteLyricsFiles(
    collectObsoleteLyricsAbsolutePaths(
      musicDirectory,
      newTrackRelativePath,
      canonicalRelativePath,
      canonicalAbsolutePath,
    ),
  )

  return canonicalRelativePath
}

export function collectAllLyricsAbsolutePathsForTrack(
  musicDirectory: string,
  trackRelativePath: string,
  knownLyricsRelativePath: string | null,
): string[] {
  const filename = path.basename(trackRelativePath)
  const keepAbsolutePath = resolveCanonicalLyricsKeepAbsolutePath(
    musicDirectory,
    trackRelativePath,
    filename,
  )
  const fallbackKeepAbsolutePath = path.resolve(musicDirectory, '__missing-lyrics__')
  const absolutePaths = new Set<string>(
    collectObsoleteLyricsAbsolutePaths(
      musicDirectory,
      trackRelativePath,
      knownLyricsRelativePath,
      keepAbsolutePath ?? fallbackKeepAbsolutePath,
    ),
  )

  if (keepAbsolutePath) {
    absolutePaths.add(keepAbsolutePath)
  }

  for (const matchingAbsolutePath of collectMatchingAssetsInDirectory(
    musicDirectory,
    LYRICS_DIRECTORY,
    LYRICS_EXTENSIONS,
    collectAssociatedLyricsStems(trackRelativePath, knownLyricsRelativePath),
  )) {
    absolutePaths.add(matchingAbsolutePath)
  }

  return [...absolutePaths]
}
