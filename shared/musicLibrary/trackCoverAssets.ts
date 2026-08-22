/** Resolución, poda y rename de portadas asociadas a una pista. */

import fs from 'node:fs'
import path from 'node:path'
import { COVER_EXTENSIONS } from './constants'
import { loadCoverOverrides } from './loadCoverOverrides'
import { COVERS_DIRECTORY } from './musicDirectoryResolver'
import {
  resolveAbsolutePathWithinMusicDirectory,
  resolveSafeCoverPath,
  resolveValidatedCoverRelativePath,
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

export function resolveTrackCoverPath(
  musicDirectory: string,
  relativePath: string,
  filename: string,
): string | null {
  const overrideFilename = loadCoverOverrides(musicDirectory)[filename]

  if (overrideFilename) {
    const overrideCoverPath = buildCoverRelativePath(overrideFilename)

    if (
      resolveValidatedCoverRelativePath(musicDirectory, overrideCoverPath) &&
      isExistingCoverFile(musicDirectory, overrideCoverPath)
    ) {
      return overrideCoverPath
    }
  }

  const stem = path.basename(filename, path.extname(filename))
  const directory = path.dirname(relativePath)

  if (directory !== '.') {
    for (const extension of COVER_EXTENSIONS) {
      const coverInTrackCoversDirectory = path.join(
        directory,
        COVERS_DIRECTORY,
        `${stem}${extension}`,
      )

      if (isExistingCoverFile(musicDirectory, coverInTrackCoversDirectory)) {
        return coverInTrackCoversDirectory
      }
    }
  }

  for (const extension of COVER_EXTENSIONS) {
    const coverInCoversDirectory = buildCoverRelativePath(`${stem}${extension}`)

    if (isExistingCoverFile(musicDirectory, coverInCoversDirectory)) {
      return coverInCoversDirectory
    }
  }

  for (const extension of COVER_EXTENSIONS) {
    const coverFilename = `${stem}${extension}`
    const coverRelativePath = directory === '.' ? coverFilename : path.join(directory, coverFilename)

    if (isExistingCoverFile(musicDirectory, coverRelativePath)) {
      return coverRelativePath
    }
  }

  const normalizedCoverMatch = findAssetRelativePathByNormalizedStem(
    musicDirectory,
    COVERS_DIRECTORY,
    stem,
    COVER_EXTENSIONS,
  )

  if (normalizedCoverMatch) {
    return normalizedCoverMatch
  }

  return null
}

export function collectAssociatedCoverStems(
  musicDirectory: string,
  trackRelativePath: string,
  knownCoverRelativePath: string | null,
): string[] {
  const filename = path.basename(trackRelativePath)
  const mp3Stem = path.basename(filename, path.extname(filename))
  const stems = new Set<string>([mp3Stem])

  const overrideFilename = loadCoverOverrides(musicDirectory)[filename]

  if (overrideFilename) {
    stems.add(path.basename(overrideFilename, path.extname(overrideFilename)))
  }

  if (knownCoverRelativePath) {
    const validatedCoverPath = resolveValidatedCoverRelativePath(
      musicDirectory,
      knownCoverRelativePath,
    )

    if (validatedCoverPath) {
      stems.add(path.basename(validatedCoverPath, path.extname(validatedCoverPath)))
    }
  }

  return [...stems]
}

export function removeDuplicateCoversForTrack(
  musicDirectory: string,
  trackRelativePath: string,
  keepAbsolutePath: string,
  knownCoverRelativePath: string | null = null,
): void {
  removeDuplicateAssetFilesInDirectory(
    musicDirectory,
    COVERS_DIRECTORY,
    COVER_EXTENSIONS,
    collectAssociatedCoverStems(musicDirectory, trackRelativePath, knownCoverRelativePath),
    keepAbsolutePath,
  )
}

/**
 * Localiza portadas obsoletas de la pista fuera del archivo canónico que se conservará.
 */
export function collectObsoleteCoverAbsolutePaths(
  musicDirectory: string,
  trackRelativePath: string,
  knownCoverRelativePath: string | null,
  keepAbsolutePath: string,
): string[] {
  const filename = path.basename(trackRelativePath)
  const trackDirectory = path.dirname(trackRelativePath)
  const candidateRelativePaths = new Set<string>()
  const associatedStems = collectAssociatedCoverStems(
    musicDirectory,
    trackRelativePath,
    knownCoverRelativePath,
  )
  const resolvedCoverPath = resolveTrackCoverPath(musicDirectory, trackRelativePath, filename)

  if (knownCoverRelativePath) {
    const validatedCoverPath = resolveValidatedCoverRelativePath(
      musicDirectory,
      knownCoverRelativePath,
    )

    if (validatedCoverPath) {
      candidateRelativePaths.add(validatedCoverPath)
    }
  }

  if (resolvedCoverPath) {
    candidateRelativePaths.add(resolvedCoverPath)
  }

  const overrideFilename = loadCoverOverrides(musicDirectory)[filename]

  if (overrideFilename) {
    candidateRelativePaths.add(buildCoverRelativePath(overrideFilename))
  }

  for (const stem of associatedStems) {
    for (const extension of COVER_EXTENSIONS) {
      candidateRelativePaths.add(buildCoverRelativePath(`${stem}${extension}`))

      const coverFilename = `${stem}${extension}`
      candidateRelativePaths.add(
        trackDirectory === '.' ? coverFilename : path.join(trackDirectory, coverFilename),
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

export function resolveCanonicalCoverKeepAbsolutePath(
  musicDirectory: string,
  trackRelativePath: string,
  filename: string,
): string | null {
  const mp3Stem = path.basename(filename, path.extname(filename))

  for (const extension of COVER_EXTENSIONS) {
    const canonicalAbsolutePath = resolveSafeCoverPath(
      musicDirectory,
      buildCoverRelativePath(`${mp3Stem}${extension}`),
    )

    if (canonicalAbsolutePath) {
      return canonicalAbsolutePath
    }
  }

  const resolvedCoverRelativePath = resolveTrackCoverPath(
    musicDirectory,
    trackRelativePath,
    filename,
  )

  if (!resolvedCoverRelativePath) {
    return null
  }

  return resolveSafeCoverPath(musicDirectory, resolvedCoverRelativePath)
}

export function pruneDuplicateCoverAssets(
  musicDirectory: string,
  trackRelativePath: string,
  filename: string,
): void {
  let keepAbsolutePath = resolveCanonicalCoverKeepAbsolutePath(
    musicDirectory,
    trackRelativePath,
    filename,
  )

  if (!keepAbsolutePath) {
    return
  }

  const mp3Stem = path.basename(filename, path.extname(filename))
  const keepExtension = path.extname(keepAbsolutePath)
  const canonicalRelativePath = buildCoverRelativePath(`${mp3Stem}${keepExtension}`)
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

  removeDuplicateCoversForTrack(
    musicDirectory,
    trackRelativePath,
    keepAbsolutePath,
    keepRelativePath,
  )

  removeObsoleteCoverFiles(
    collectObsoleteCoverAbsolutePaths(
      musicDirectory,
      trackRelativePath,
      keepRelativePath,
      keepAbsolutePath,
    ),
  )

  removeIdenticalContentFilesInDirectory(
    path.join(musicDirectory, COVERS_DIRECTORY),
    COVER_EXTENSIONS,
    keepAbsolutePath,
  )
}

export function removeObsoleteCoverFiles(obsoleteAbsolutePaths: string[]): void {
  for (const obsoletePath of obsoleteAbsolutePaths) {
    if (!fs.existsSync(obsoletePath)) {
      continue
    }

    try {
      fs.unlinkSync(obsoletePath)
    } catch {
      // Si no se puede eliminar una portada obsoleta, la canónica sigue siendo válida.
    }
  }
}

function isExistingCoverFile(musicDirectory: string, relativePath: string): boolean {
  return resolveSafeCoverPath(musicDirectory, relativePath) !== null
}

export function buildCoverRelativePath(coverFilename: string): string {
  return path.join(COVERS_DIRECTORY, coverFilename)
}

export function renameAssociatedCoverIfNeeded(
  musicDirectory: string,
  oldTrackRelativePath: string,
  newTrackRelativePath: string,
  knownCoverRelativePath: string | null,
): string | null {
  const oldFilename = path.basename(oldTrackRelativePath)
  const newFilename = path.basename(newTrackRelativePath)
  const oldStem = path.basename(oldFilename, path.extname(oldFilename))
  const newStem = path.basename(newFilename, path.extname(newFilename))

  const existingCoverRelativePath =
    knownCoverRelativePath ??
    resolveTrackCoverPath(musicDirectory, oldTrackRelativePath, oldFilename)

  if (!existingCoverRelativePath) {
    return null
  }

  const existingCoverAbsolutePath = resolveSafeCoverPath(
    musicDirectory,
    existingCoverRelativePath,
  )

  if (!existingCoverAbsolutePath) {
    return null
  }

  if (oldStem === newStem) {
    return existingCoverRelativePath
  }

  const coverExtension = path.extname(existingCoverAbsolutePath)
  const canonicalRelativePath = buildCoverRelativePath(`${newStem}${coverExtension}`)
  const canonicalAbsolutePath = resolveAbsolutePathWithinMusicDirectory(
    musicDirectory,
    canonicalRelativePath,
  )

  if (!canonicalAbsolutePath) {
    return existingCoverRelativePath
  }

  ensureDirectoryExists(path.dirname(canonicalAbsolutePath))

  if (
    fs.existsSync(canonicalAbsolutePath) &&
    path.resolve(canonicalAbsolutePath) !== path.resolve(existingCoverAbsolutePath)
  ) {
    fs.unlinkSync(canonicalAbsolutePath)
  }

  if (path.resolve(existingCoverAbsolutePath) !== path.resolve(canonicalAbsolutePath)) {
    fs.renameSync(existingCoverAbsolutePath, canonicalAbsolutePath)
  }

  removeDuplicateCoversForTrack(
    musicDirectory,
    newTrackRelativePath,
    canonicalAbsolutePath,
    canonicalRelativePath,
  )

  removeObsoleteCoverFiles(
    collectObsoleteCoverAbsolutePaths(
      musicDirectory,
      newTrackRelativePath,
      canonicalRelativePath,
      canonicalAbsolutePath,
    ),
  )

  return canonicalRelativePath
}

export function collectAllCoverAbsolutePathsForTrack(
  musicDirectory: string,
  trackRelativePath: string,
  knownCoverRelativePath: string | null,
): string[] {
  const filename = path.basename(trackRelativePath)
  const keepAbsolutePath = resolveCanonicalCoverKeepAbsolutePath(
    musicDirectory,
    trackRelativePath,
    filename,
  )
  const fallbackKeepAbsolutePath = path.resolve(musicDirectory, '__missing-cover__')
  const absolutePaths = new Set<string>(
    collectObsoleteCoverAbsolutePaths(
      musicDirectory,
      trackRelativePath,
      knownCoverRelativePath,
      keepAbsolutePath ?? fallbackKeepAbsolutePath,
    ),
  )

  if (keepAbsolutePath) {
    absolutePaths.add(keepAbsolutePath)
  }

  for (const matchingAbsolutePath of collectMatchingAssetsInDirectory(
    musicDirectory,
    COVERS_DIRECTORY,
    COVER_EXTENSIONS,
    collectAssociatedCoverStems(musicDirectory, trackRelativePath, knownCoverRelativePath),
  )) {
    absolutePaths.add(matchingAbsolutePath)
  }

  return [...absolutePaths]
}
