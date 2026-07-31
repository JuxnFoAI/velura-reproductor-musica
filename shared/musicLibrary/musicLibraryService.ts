/** Lógica de biblioteca musical en disco, compartida entre Vite y Electron. */
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { parseFile } from 'music-metadata'
import { parseAudioFilename } from '../../src/lib/parseAudioFilename'
import { buildAudioFilename } from '../../src/lib/buildAudioFilename'
import { COVER_EXTENSIONS, LYRICS_EXTENSIONS, MP3_EXTENSION } from './constants'
import { loadCoverOverrides } from './loadCoverOverrides'
import {
  validateCoverImageBufferSize,
  validateCoverImageDataUrlSize,
  validateLyricsContentSize,
} from './payloadLimits'
import {
  musicLibraryFailure,
  musicLibrarySuccess,
  type MusicLibraryResult,
} from './result'
import type {
  DeleteTrackRequest,
  DeleteTrackResponse,
  MusicLibraryResponse,
  RenameTrackRequest,
  RenameTrackResponse,
  SaveTrackCoverRequest,
  SaveTrackCoverResponse,
  SaveTrackLyricsRequest,
  SaveTrackLyricsResponse,
} from './types'
import { COVERS_DIRECTORY, LYRICS_DIRECTORY } from './musicDirectoryResolver'
import {
  resolveAbsolutePathWithinMusicDirectory,
  resolveSafeAudioPath,
  resolveSafeCoverPath,
  resolveSafeLyricsPath,
  resolveValidatedCoverRelativePath,
  resolveValidatedLyricsRelativePath,
} from './safePaths'

export {
  resolveSafeAudioPath,
  resolveSafeCoverPath,
  resolveSafeLyricsPath,
} from './safePaths'

export type {
  DeleteTrackRequest,
  DeleteTrackResponse,
  MusicFileEntry,
  MusicLibraryResponse,
  RenameTrackRequest,
  RenameTrackResponse,
  SaveTrackCoverRequest,
  SaveTrackCoverResponse,
  SaveTrackLyricsRequest,
  SaveTrackLyricsResponse,
} from './types'

export {
  COVER_EXTENSIONS,
  LYRICS_EXTENSIONS,
  MP3_EXTENSION,
  MUSIC_LIBRARY_ENDPOINTS,
} from './constants'

export {
  COVER_OVERRIDES_EXAMPLE_FILENAME,
  COVERS_DIRECTORY,
  EXAMPLE_DIRECTORY_NAME,
  LYRICS_DIRECTORY,
  ensureMusicDirectoryStructure,
  ensureProjectMusicDirectory,
  PROJECT_MUSIC_DIRECTORY_NAME,
  resolveProjectRootFromModule,
  resolveVeluraUserMusicDirectory,
  VELURA_APP_FOLDER_NAME,
} from './musicDirectoryResolver'

export { loadCoverOverrides, COVER_OVERRIDES_FILENAME } from './loadCoverOverrides'

export type { MusicLibraryResult } from './result'

function createTrackId(relativePath: string): string {
  return createHash('sha256').update(relativePath).digest('hex').slice(0, 16)
}

function scanMp3Files(
  directoryPath: string,
  rootDirectory: string,
): Array<{ relativePath: string; filename: string }> {
  const entries: Array<{ relativePath: string; filename: string }> = []

  const walkDirectory = (currentDirectory: string): void => {
    const directoryEntries = fs.readdirSync(currentDirectory, { withFileTypes: true })

    for (const entry of directoryEntries) {
      const entryPath = path.join(currentDirectory, entry.name)

      if (entry.isDirectory()) {
        walkDirectory(entryPath)
        continue
      }

      if (entry.isFile() && entry.name.toLowerCase().endsWith(MP3_EXTENSION)) {
        entries.push({
          relativePath: path.relative(rootDirectory, entryPath),
          filename: entry.name,
        })
      }
    }
  }

  walkDirectory(directoryPath)

  return entries.sort((left, right) => left.filename.localeCompare(right.filename, 'es'))
}

async function readTrackAudioMetadata(
  absolutePath: string,
): Promise<{ duration: number; replayGainTrackDb: number | null }> {
  try {
    const metadata = await parseFile(absolutePath, { duration: true })
    const duration = metadata.format.duration
    const replayGainFromTag = metadata.common.replaygain_track_gain?.dB
    const replayGainFromFormat = metadata.format.trackGain
    const replayGainTrackDb =
      typeof replayGainFromTag === 'number' && Number.isFinite(replayGainFromTag)
        ? replayGainFromTag
        : typeof replayGainFromFormat === 'number' && Number.isFinite(replayGainFromFormat)
          ? replayGainFromFormat
          : null

    return {
      duration:
        typeof duration === 'number' && Number.isFinite(duration) && duration > 0 ? duration : 0,
      replayGainTrackDb,
    }
  } catch {
    return {
      duration: 0,
      replayGainTrackDb: null,
    }
  }
}

export async function buildMusicLibrary(musicDirectory: string | null): Promise<MusicLibraryResponse> {
  if (!musicDirectory) {
    return {
      musicDirectory: null,
      tracks: [],
    }
  }

  const mp3Files = scanMp3Files(musicDirectory, musicDirectory)

  for (const { relativePath, filename } of mp3Files) {
    pruneDuplicateTrackAssets(musicDirectory, relativePath, filename)
  }

  const tracks = await Promise.all(
    mp3Files.map(async ({ relativePath, filename }) => {
      const { title, artist } = parseAudioFilename(filename)
      const absolutePath = resolveSafeAudioPath(musicDirectory, relativePath)

      if (!absolutePath) {
        throw new Error(`Ruta MP3 inválida durante indexación: ${relativePath}`)
      }

      const fileSizeBytes = fs.statSync(absolutePath).size
      const { duration, replayGainTrackDb } = await readTrackAudioMetadata(absolutePath)

      return {
        id: createTrackId(relativePath),
        filename,
        title,
        artist,
        relativePath,
        duration,
        fileSizeBytes,
        coverRelativePath: resolveTrackCoverPath(musicDirectory, relativePath, filename),
        lyricsRelativePath: resolveTrackLyricsPath(musicDirectory, relativePath, filename),
        replayGainTrackDb,
      }
    }),
  )

  return {
    musicDirectory,
    tracks,
  }
}

/**
 * Normaliza el stem de una pista para comparar variantes como
 * "Post Malone - Chemical" y "PostMalone-Chemical".
 */
function normalizeTrackStem(stem: string): string {
  return stem.toLowerCase().replace(/[\s\-_.]+/g, '')
}

/**
 * Busca un asset en un subdirectorio cuyo stem normalizado coincida con el MP3.
 */
function findAssetRelativePathByNormalizedStem(
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

function migrateAssetToCanonicalRelativePath(
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

function resolveTrackCoverPath(
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

function resolveTrackLyricsPath(
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
function resolveStemBasedLyricsWriteTarget(
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

/**
 * Elimina archivos duplicados en un directorio de assets cuando comparten el mismo stem normalizado.
 */
function removeDuplicateAssetFilesInDirectory(
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

function collectAssociatedLyricsStems(
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

/**
 * Elimina archivos en un directorio cuyo contenido es idéntico al archivo que se conserva.
 */
function removeIdenticalContentFilesInDirectory(
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

function removeDuplicateLyricsForTrack(
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
function collectObsoleteLyricsAbsolutePaths(
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

function removeObsoleteLyricsFiles(obsoleteAbsolutePaths: string[]): void {
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

/**
 * Reúne todos los stems de portada que pueden pertenecer a la misma pista
 * (nombre del MP3, override manual y portada conocida en estado).
 */
function collectAssociatedCoverStems(
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

function removeDuplicateCoversForTrack(
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
function collectObsoleteCoverAbsolutePaths(
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

/**
 * Determina la portada canónica a conservar, priorizando el stem del MP3.
 */
function resolveCanonicalCoverKeepAbsolutePath(
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

/**
 * Determina la letra canónica a conservar, priorizando el stem del MP3.
 */
function resolveCanonicalLyricsKeepAbsolutePath(
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

/**
 * Elimina portadas duplicadas u obsoletas detectadas al indexar la biblioteca.
 */
function pruneDuplicateCoverAssets(
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
function pruneDuplicateLyricsAssets(
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

function pruneDuplicateTrackAssets(
  musicDirectory: string,
  trackRelativePath: string,
  filename: string,
): void {
  pruneDuplicateCoverAssets(musicDirectory, trackRelativePath, filename)
  pruneDuplicateLyricsAssets(musicDirectory, trackRelativePath, filename)
}

function removeObsoleteCoverFiles(obsoleteAbsolutePaths: string[]): void {
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

function buildCoverRelativePath(coverFilename: string): string {
  return path.join(COVERS_DIRECTORY, coverFilename)
}

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

function parseImageDataUrl(imageDataUrl: string): Buffer | null {
  const match = /^data:image\/[\w+.-]+;base64,(.+)$/.exec(imageDataUrl)

  if (!match?.[1]) {
    return null
  }

  return Buffer.from(match[1], 'base64')
}

function ensureDirectoryExists(directoryPath: string): void {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true })
  }
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

function normalizeRelativePath(musicDirectory: string, absolutePath: string): string {
  return path.relative(musicDirectory, absolutePath)
}

/**
 * Renombra la portada asociada al nuevo stem del MP3 y elimina variantes obsoletas.
 */
function renameAssociatedCoverIfNeeded(
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

/**
 * Renombra la letra asociada al nuevo stem del MP3 y elimina variantes obsoletas.
 */
function renameAssociatedLyricsIfNeeded(
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

function collectMatchingAssetsInDirectory(
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

function collectAllCoverAbsolutePathsForTrack(
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

function collectAllLyricsAbsolutePathsForTrack(
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

function tryDeleteFile(absolutePath: string): boolean {
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
