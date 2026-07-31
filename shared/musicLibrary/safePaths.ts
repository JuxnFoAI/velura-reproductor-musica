/** Validación centralizada de rutas relativas dentro de mi-musica. */
import fs from 'node:fs'
import path from 'node:path'
import { COVER_EXTENSIONS, LYRICS_EXTENSIONS, MP3_EXTENSION } from './constants'

export function normalizeRelativePathInput(requestedPath: string): string {
  return path.normalize(requestedPath)
}

export function isRelativePathWithinMusicDirectory(
  musicDirectory: string,
  requestedPath: string,
): boolean {
  const normalizedRelativePath = normalizeRelativePathInput(requestedPath)

  if (normalizedRelativePath.startsWith('..') || path.isAbsolute(normalizedRelativePath)) {
    return false
  }

  const absolutePath = path.resolve(musicDirectory, normalizedRelativePath)
  const relativeToRoot = path.relative(musicDirectory, absolutePath)

  return !relativeToRoot.startsWith('..') && !path.isAbsolute(relativeToRoot)
}

export function resolveAbsolutePathWithinMusicDirectory(
  musicDirectory: string,
  requestedPath: string,
): string | null {
  if (!isRelativePathWithinMusicDirectory(musicDirectory, requestedPath)) {
    return null
  }

  return path.resolve(musicDirectory, normalizeRelativePathInput(requestedPath))
}

function hasAllowedExtension(
  filePath: string,
  allowedExtensions: readonly string[],
): boolean {
  const extension = path.extname(filePath).toLowerCase()

  return allowedExtensions.includes(extension as (typeof allowedExtensions)[number])
}

function resolveSafeExistingFilePath(
  musicDirectory: string,
  requestedPath: string,
  allowedExtensions: readonly string[],
): string | null {
  const absolutePath = resolveAbsolutePathWithinMusicDirectory(musicDirectory, requestedPath)

  if (!absolutePath) {
    return null
  }

  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
    return null
  }

  if (!hasAllowedExtension(absolutePath, allowedExtensions)) {
    return null
  }

  return absolutePath
}

export function resolveSafeLyricsPath(musicDirectory: string, requestedPath: string): string | null {
  return resolveSafeExistingFilePath(musicDirectory, requestedPath, LYRICS_EXTENSIONS)
}

export function resolveSafeCoverPath(musicDirectory: string, requestedPath: string): string | null {
  return resolveSafeExistingFilePath(musicDirectory, requestedPath, COVER_EXTENSIONS)
}

export function resolveSafeAudioPath(musicDirectory: string, requestedPath: string): string | null {
  const absolutePath = resolveAbsolutePathWithinMusicDirectory(musicDirectory, requestedPath)

  if (!absolutePath) {
    return null
  }

  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
    return null
  }

  if (!absolutePath.toLowerCase().endsWith(MP3_EXTENSION)) {
    return null
  }

  return absolutePath
}

export function resolveValidatedCoverRelativePath(
  musicDirectory: string,
  requestedPath: string,
): string | null {
  if (!isRelativePathWithinMusicDirectory(musicDirectory, requestedPath)) {
    return null
  }

  const normalizedRelativePath = normalizeRelativePathInput(requestedPath)

  if (!hasAllowedExtension(normalizedRelativePath, COVER_EXTENSIONS)) {
    return null
  }

  return normalizedRelativePath
}

export function resolveValidatedLyricsRelativePath(
  musicDirectory: string,
  requestedPath: string,
): string | null {
  if (!isRelativePathWithinMusicDirectory(musicDirectory, requestedPath)) {
    return null
  }

  const normalizedRelativePath = normalizeRelativePathInput(requestedPath)

  if (!hasAllowedExtension(normalizedRelativePath, LYRICS_EXTENSIONS)) {
    return null
  }

  return normalizedRelativePath
}

export function sanitizeCoverOverrideFilename(filename: unknown): string | null {
  if (typeof filename !== 'string') {
    return null
  }

  const trimmedFilename = filename.trim()

  if (!trimmedFilename) {
    return null
  }

  const basename = path.basename(trimmedFilename)

  if (basename !== trimmedFilename || basename.includes('..')) {
    return null
  }

  if (!hasAllowedExtension(basename, COVER_EXTENSIONS)) {
    return null
  }

  return basename
}

export function sanitizeCoverOverrideKey(mp3Filename: unknown): string | null {
  if (typeof mp3Filename !== 'string') {
    return null
  }

  const trimmedKey = mp3Filename.trim()

  if (!trimmedKey) {
    return null
  }

  const basename = path.basename(trimmedKey)

  if (basename !== trimmedKey || basename.includes('..')) {
    return null
  }

  if (!basename.toLowerCase().endsWith(MP3_EXTENSION)) {
    return null
  }

  return basename
}
