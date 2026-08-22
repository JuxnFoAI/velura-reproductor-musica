/** Utilidades de disco compartidas por portadas, letras, rename y delete. */

import fs from 'node:fs'
import path from 'node:path'
import { resolveAbsolutePathWithinMusicDirectory } from './safePaths'

/**
 * Normaliza el stem de una pista para comparar variantes como
 * "Post Malone - Chemical" y "PostMalone-Chemical".
 */
export function normalizeTrackStem(stem: string): string {
  return stem.toLowerCase().replace(/[\s\-_.]+/g, '')
}

/**
 * Busca un asset en un subdirectorio cuyo stem normalizado coincida con el MP3.
 */
export function findAssetRelativePathByNormalizedStem(
  musicDirectory: string,
  assetDirectoryName: string,
  targetStem: string,
  allowedExtensions: readonly string[],
): string | null {
  const assetDirectory = path.join(musicDirectory, assetDirectoryName)
  const normalizedTargetStem = normalizeTrackStem(targetStem)

  if (!fs.existsSync(assetDirectory)) {
    return null
  }

  for (const entry of fs.readdirSync(assetDirectory, { withFileTypes: true })) {
    if (!entry.isFile()) {
      continue
    }

    const extension = path.extname(entry.name).toLowerCase()

    if (!allowedExtensions.includes(extension)) {
      continue
    }

    const entryStem = path.basename(entry.name, extension)

    if (normalizeTrackStem(entryStem) === normalizedTargetStem) {
      return path.join(assetDirectoryName, entry.name)
    }
  }

  return null
}

export function migrateAssetToCanonicalRelativePath(
  musicDirectory: string,
  currentAbsolutePath: string,
  canonicalRelativePath: string,
): string | null {
  const canonicalAbsolutePath = resolveAbsolutePathWithinMusicDirectory(
    musicDirectory,
    canonicalRelativePath,
  )

  if (!canonicalAbsolutePath) {
    return null
  }

  if (path.resolve(currentAbsolutePath) === path.resolve(canonicalAbsolutePath)) {
    return canonicalAbsolutePath
  }

  ensureDirectoryExists(path.dirname(canonicalAbsolutePath))

  if (
    fs.existsSync(canonicalAbsolutePath) &&
    path.resolve(canonicalAbsolutePath) !== path.resolve(currentAbsolutePath)
  ) {
    fs.unlinkSync(canonicalAbsolutePath)
  }

  fs.renameSync(currentAbsolutePath, canonicalAbsolutePath)

  return canonicalAbsolutePath
}

export function removeDuplicateAssetFilesInDirectory(
  musicDirectory: string,
  assetDirectoryName: string,
  allowedExtensions: readonly string[],
  trackStems: string[],
  keepAbsolutePath: string,
): void {
  const assetDirectory = path.join(musicDirectory, assetDirectoryName)

  if (!fs.existsSync(assetDirectory)) {
    return
  }

  const normalizedTrackStems = new Set(trackStems.map(normalizeTrackStem))
  const resolvedKeepPath = path.resolve(keepAbsolutePath)

  for (const entry of fs.readdirSync(assetDirectory, { withFileTypes: true })) {
    if (!entry.isFile()) {
      continue
    }

    const extension = path.extname(entry.name).toLowerCase()

    if (!allowedExtensions.includes(extension)) {
      continue
    }

    const entryAbsolutePath = path.join(assetDirectory, entry.name)

    if (path.resolve(entryAbsolutePath) === resolvedKeepPath) {
      continue
    }

    const entryStem = path.basename(entry.name, extension)

    if (!normalizedTrackStems.has(normalizeTrackStem(entryStem))) {
      continue
    }

    try {
      fs.unlinkSync(entryAbsolutePath)
    } catch {
      // Si no se puede eliminar un duplicado, el archivo canónico sigue siendo válido.
    }
  }
}

export function removeIdenticalContentFilesInDirectory(
  directoryAbsolutePath: string,
  allowedExtensions: readonly string[],
  keepAbsolutePath: string,
): void {
  if (!fs.existsSync(directoryAbsolutePath) || !fs.existsSync(keepAbsolutePath)) {
    return
  }

  let keepContent: Buffer

  try {
    keepContent = fs.readFileSync(keepAbsolutePath)
  } catch {
    return
  }

  const resolvedKeepPath = path.resolve(keepAbsolutePath)

  for (const entry of fs.readdirSync(directoryAbsolutePath, { withFileTypes: true })) {
    if (!entry.isFile()) {
      continue
    }

    const extension = path.extname(entry.name).toLowerCase()

    if (!allowedExtensions.includes(extension)) {
      continue
    }

    const entryAbsolutePath = path.join(directoryAbsolutePath, entry.name)

    if (path.resolve(entryAbsolutePath) === resolvedKeepPath) {
      continue
    }

    try {
      const entryContent = fs.readFileSync(entryAbsolutePath)

      if (Buffer.compare(keepContent, entryContent) === 0) {
        fs.unlinkSync(entryAbsolutePath)
      }
    } catch {
      // Si no se puede leer o eliminar un duplicado, se conserva el archivo canónico.
    }
  }
}

export function ensureDirectoryExists(directoryPath: string): void {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true })
  }
}

export function normalizeRelativePath(musicDirectory: string, absolutePath: string): string {
  return path.relative(musicDirectory, absolutePath)
}

export function collectMatchingAssetsInDirectory(
  musicDirectory: string,
  assetDirectoryName: string,
  allowedExtensions: readonly string[],
  trackStems: string[],
): string[] {
  const assetDirectory = path.join(musicDirectory, assetDirectoryName)
  const normalizedTrackStems = new Set(trackStems.map(normalizeTrackStem))
  const matchingAbsolutePaths: string[] = []

  if (!fs.existsSync(assetDirectory)) {
    return matchingAbsolutePaths
  }

  for (const entry of fs.readdirSync(assetDirectory, { withFileTypes: true })) {
    if (!entry.isFile()) {
      continue
    }

    const extension = path.extname(entry.name).toLowerCase()

    if (!allowedExtensions.includes(extension)) {
      continue
    }

    const entryStem = path.basename(entry.name, extension)

    if (!normalizedTrackStems.has(normalizeTrackStem(entryStem))) {
      continue
    }

    matchingAbsolutePaths.push(path.join(assetDirectory, entry.name))
  }

  return matchingAbsolutePaths
}

export function tryDeleteFile(absolutePath: string): boolean {
  try {
    if (!fs.existsSync(absolutePath)) {
      return false
    }

    fs.unlinkSync(absolutePath)
    return true
  } catch {
    return false
  }
}
