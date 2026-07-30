/** Plugin de Vite que expone la carpeta mi-musica del proyecto como biblioteca de MP3. */
import type { ServerResponse } from 'node:http'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { parseFile } from 'music-metadata'
import type { Connect } from 'vite'
import type { Plugin } from 'vite'
import { parseAudioFilename } from '../src/lib/parseAudioFilename'
import { buildAudioFilename } from '../src/lib/buildAudioFilename'
import {
  COVERS_DIRECTORY,
  LYRICS_DIRECTORY,
  ensureProjectMusicDirectory,
  resolveProjectRootFromModule,
} from './musicDirectoryResolver'
import { loadCoverOverrides } from './loadCoverOverrides'

const MP3_EXTENSION = '.mp3'
const COVER_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const
const TRACKS_ENDPOINT = '/api/music/tracks'
const TRACK_ENDPOINT = '/api/music/track'
const AUDIO_ENDPOINT_PREFIX = '/api/music/audio'
const COVER_ENDPOINT_PREFIX = '/api/music/cover'
const LYRICS_ENDPOINT = '/api/music/lyrics'
const LYRICS_EXTENSIONS = ['.txt', '.lrc'] as const

interface MusicFileEntry {
  id: string
  filename: string
  title: string
  artist: string
  relativePath: string
  duration: number
  fileSizeBytes: number
  coverRelativePath: string | null
  lyricsRelativePath: string | null
  replayGainTrackDb: number | null
}

interface MusicLibraryResponse {
  musicDirectory: string | null
  tracks: MusicFileEntry[]
}

interface SaveTrackCoverRequest {
  trackRelativePath: string
  coverRelativePath: string | null
  imageDataUrl: string
}

interface SaveTrackCoverResponse {
  coverRelativePath: string
}

interface RenameTrackRequest {
  trackRelativePath: string
  title: string
  artist: string
  coverRelativePath: string | null
}

interface RenameTrackResponse {
  id: string
  relativePath: string
  filename: string
  title: string
  artist: string
  coverRelativePath: string | null
  lyricsRelativePath: string | null
}

interface DeleteTrackRequest {
  trackRelativePath: string
  coverRelativePath: string | null
  lyricsRelativePath: string | null
}

interface DeleteTrackResponse {
  deletedTrackRelativePath: string
  deletedCoverCount: number
  deletedLyricsCount: number
}

interface SaveTrackLyricsRequest {
  trackRelativePath: string
  lyricsContent: string
  lyricsExtension: (typeof LYRICS_EXTENSIONS)[number]
  existingLyricsRelativePath?: string | null
  sourceLyricsFilename?: string | null
}

interface SaveTrackLyricsResponse {
  lyricsRelativePath: string
}

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

async function buildMusicLibrary(musicDirectory: string | null): Promise<MusicLibraryResponse> {
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
      const absolutePath = path.resolve(musicDirectory, relativePath)
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
): string {
  const canonicalAbsolutePath = path.resolve(musicDirectory, canonicalRelativePath)

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

    if (isExistingCoverFile(musicDirectory, overrideCoverPath)) {
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
  const absolutePath = path.resolve(musicDirectory, relativePath)

  return fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()
}

function resolveSafeLyricsPath(musicDirectory: string, requestedPath: string): string | null {
  const normalizedRelativePath = path.normalize(requestedPath)

  if (normalizedRelativePath.startsWith('..') || path.isAbsolute(normalizedRelativePath)) {
    return null
  }

  const absolutePath = path.resolve(musicDirectory, normalizedRelativePath)
  const relativeToRoot = path.relative(musicDirectory, absolutePath)

  if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) {
    return null
  }

  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
    return null
  }

  const extension = path.extname(absolutePath).toLowerCase()

  if (!LYRICS_EXTENSIONS.includes(extension as (typeof LYRICS_EXTENSIONS)[number])) {
    return null
  }

  return absolutePath
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
  const nextAbsolutePath = path.resolve(musicDirectory, nextRelativePath)

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
    candidateRelativePaths.add(knownLyricsRelativePath)
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
    const absolutePath = path.resolve(musicDirectory, relativePath)

    if (path.resolve(absolutePath) === keepResolvedPath) {
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
    stems.add(
      path.basename(knownCoverRelativePath, path.extname(knownCoverRelativePath)),
    )
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
    candidateRelativePaths.add(knownCoverRelativePath)
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
    const absolutePath = path.resolve(musicDirectory, relativePath)

    if (path.resolve(absolutePath) === keepResolvedPath) {
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
    const canonicalAbsolutePath = path.resolve(
      musicDirectory,
      buildCoverRelativePath(`${mp3Stem}${extension}`),
    )

    if (fs.existsSync(canonicalAbsolutePath) && fs.statSync(canonicalAbsolutePath).isFile()) {
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

  const resolvedAbsolutePath = path.resolve(musicDirectory, resolvedCoverRelativePath)

  if (fs.existsSync(resolvedAbsolutePath) && fs.statSync(resolvedAbsolutePath).isFile()) {
    return resolvedAbsolutePath
  }

  return null
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
    const canonicalAbsolutePath = path.resolve(
      musicDirectory,
      buildLyricsRelativePath(`${mp3Stem}${extension}`),
    )

    if (fs.existsSync(canonicalAbsolutePath) && fs.statSync(canonicalAbsolutePath).isFile()) {
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

  const resolvedAbsolutePath = path.resolve(musicDirectory, resolvedLyricsRelativePath)

  if (fs.existsSync(resolvedAbsolutePath) && fs.statSync(resolvedAbsolutePath).isFile()) {
    return resolvedAbsolutePath
  }

  return null
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
  const canonicalAbsolutePath = path.resolve(musicDirectory, canonicalRelativePath)

  if (path.resolve(keepAbsolutePath) !== path.resolve(canonicalAbsolutePath)) {
    keepAbsolutePath = migrateAssetToCanonicalRelativePath(
      musicDirectory,
      keepAbsolutePath,
      canonicalRelativePath,
    )
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
  const canonicalAbsolutePath = path.resolve(musicDirectory, canonicalRelativePath)

  if (path.resolve(keepAbsolutePath) !== path.resolve(canonicalAbsolutePath)) {
    keepAbsolutePath = migrateAssetToCanonicalRelativePath(
      musicDirectory,
      keepAbsolutePath,
      canonicalRelativePath,
    )
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

function buildCoverRelativePath(coverFilename: string): string {
  return path.join(COVERS_DIRECTORY, coverFilename)
}

function isExistingCoverFile(musicDirectory: string, relativePath: string): boolean {
  const absolutePath = path.resolve(musicDirectory, relativePath)

  return fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()
}

function resolveSafeCoverPath(musicDirectory: string, requestedPath: string): string | null {
  const normalizedRelativePath = path.normalize(requestedPath)

  if (normalizedRelativePath.startsWith('..') || path.isAbsolute(normalizedRelativePath)) {
    return null
  }

  const absolutePath = path.resolve(musicDirectory, normalizedRelativePath)
  const relativeToRoot = path.relative(musicDirectory, absolutePath)

  if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) {
    return null
  }

  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
    return null
  }

  const extension = path.extname(absolutePath).toLowerCase()

  if (!COVER_EXTENSIONS.includes(extension as (typeof COVER_EXTENSIONS)[number])) {
    return null
  }

  return absolutePath
}

function resolveCoverContentType(relativePath: string): string {
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

function resolveSafeAudioPath(musicDirectory: string, requestedPath: string): string | null {
  const normalizedRelativePath = path.normalize(requestedPath)

  if (normalizedRelativePath.startsWith('..') || path.isAbsolute(normalizedRelativePath)) {
    return null
  }

  const absolutePath = path.resolve(musicDirectory, normalizedRelativePath)
  const relativeToRoot = path.relative(musicDirectory, absolutePath)

  if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) {
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

function sendJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.statusCode = statusCode
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.end(JSON.stringify(payload))
}

function readRequestBody(request: Connect.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []

    request.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
    })

    request.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'))
    })

    request.on('error', reject)
  })
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
  const nextAbsolutePath = path.resolve(musicDirectory, nextRelativePath)

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

async function handleSaveTrackLyrics(
  request: Connect.IncomingMessage,
  response: ServerResponse,
  musicDirectory: string | null,
): Promise<void> {
  if (!musicDirectory) {
    sendJson(response, 404, { message: 'Biblioteca de música no disponible.' })
    return
  }

  let payload: SaveTrackLyricsRequest

  try {
    payload = JSON.parse(await readRequestBody(request)) as SaveTrackLyricsRequest
  } catch {
    sendJson(response, 400, { message: 'Solicitud de letra inválida.' })
    return
  }

  if (
    typeof payload.trackRelativePath !== 'string' ||
    typeof payload.lyricsContent !== 'string' ||
    !LYRICS_EXTENSIONS.includes(payload.lyricsExtension)
  ) {
    sendJson(response, 400, { message: 'Datos de letra incompletos.' })
    return
  }

  const isEditingExistingLyrics = Boolean(payload.existingLyricsRelativePath)

  if (!payload.lyricsContent.trim() && !isEditingExistingLyrics) {
    sendJson(response, 400, { message: 'El archivo de letra está vacío.' })
    return
  }

  const lyricsWriteTarget = resolveStemBasedLyricsWriteTarget(
    musicDirectory,
    payload.trackRelativePath,
    payload.lyricsExtension,
  )

  if (!lyricsWriteTarget) {
    sendJson(response, 404, { message: 'No se pudo resolver la pista para guardar la letra.' })
    return
  }

  removeDuplicateLyricsForTrack(
    musicDirectory,
    payload.trackRelativePath,
    lyricsWriteTarget.absolutePath,
    payload.existingLyricsRelativePath ?? null,
    payload.sourceLyricsFilename ?? null,
  )

  ensureDirectoryExists(path.dirname(lyricsWriteTarget.absolutePath))

  try {
    fs.writeFileSync(lyricsWriteTarget.absolutePath, payload.lyricsContent, 'utf8')
  } catch {
    sendJson(response, 500, { message: 'No se pudo escribir la letra en disco.' })
    return
  }

  removeObsoleteLyricsFiles(
    collectObsoleteLyricsAbsolutePaths(
      musicDirectory,
      payload.trackRelativePath,
      payload.existingLyricsRelativePath ?? null,
      lyricsWriteTarget.absolutePath,
      payload.sourceLyricsFilename ?? null,
    ),
  )

  removeIdenticalContentFilesInDirectory(
    path.dirname(lyricsWriteTarget.absolutePath),
    LYRICS_EXTENSIONS,
    lyricsWriteTarget.absolutePath,
  )

  const saveResponse: SaveTrackLyricsResponse = {
    lyricsRelativePath: lyricsWriteTarget.relativePath,
  }

  sendJson(response, 200, saveResponse)
}

async function handleSaveTrackCover(
  request: Connect.IncomingMessage,
  response: ServerResponse,
  musicDirectory: string | null,
): Promise<void> {
  if (!musicDirectory) {
    sendJson(response, 404, { message: 'Biblioteca de música no disponible.' })
    return
  }

  let payload: SaveTrackCoverRequest

  try {
    payload = JSON.parse(await readRequestBody(request)) as SaveTrackCoverRequest
  } catch {
    sendJson(response, 400, { message: 'Solicitud de portada inválida.' })
    return
  }

  if (
    typeof payload.trackRelativePath !== 'string' ||
    typeof payload.imageDataUrl !== 'string'
  ) {
    sendJson(response, 400, { message: 'Datos de portada incompletos.' })
    return
  }

  const imageBuffer = parseImageDataUrl(payload.imageDataUrl)

  if (!imageBuffer || imageBuffer.length === 0) {
    sendJson(response, 400, { message: 'Imagen de portada inválida.' })
    return
  }

  const coverWriteTarget = resolveCoverWriteTarget(
    musicDirectory,
    payload.trackRelativePath,
    payload.coverRelativePath,
  )

  if (!coverWriteTarget) {
    sendJson(response, 404, { message: 'No se pudo resolver la pista para guardar la portada.' })
    return
  }

  ensureDirectoryExists(path.dirname(coverWriteTarget.absolutePath))

  try {
    fs.writeFileSync(coverWriteTarget.absolutePath, imageBuffer)

    removeDuplicateCoversForTrack(
      musicDirectory,
      payload.trackRelativePath,
      coverWriteTarget.absolutePath,
      payload.coverRelativePath,
    )

    removeObsoleteCoverFiles(coverWriteTarget.obsoleteAbsolutePaths)

    removeIdenticalContentFilesInDirectory(
      path.dirname(coverWriteTarget.absolutePath),
      COVER_EXTENSIONS,
      coverWriteTarget.absolutePath,
    )
  } catch {
    sendJson(response, 500, { message: 'No se pudo escribir la portada en disco.' })
    return
  }

  const saveResponse: SaveTrackCoverResponse = {
    coverRelativePath: coverWriteTarget.relativePath,
  }

  sendJson(response, 200, saveResponse)
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

  const existingCoverAbsolutePath = path.resolve(musicDirectory, existingCoverRelativePath)

  if (!fs.existsSync(existingCoverAbsolutePath) || !fs.statSync(existingCoverAbsolutePath).isFile()) {
    return null
  }

  if (oldStem === newStem) {
    return existingCoverRelativePath
  }

  const coverExtension = path.extname(existingCoverAbsolutePath)
  const canonicalRelativePath = buildCoverRelativePath(`${newStem}${coverExtension}`)
  const canonicalAbsolutePath = path.resolve(musicDirectory, canonicalRelativePath)

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

  const existingLyricsAbsolutePath = path.resolve(musicDirectory, existingLyricsRelativePath)

  if (
    !fs.existsSync(existingLyricsAbsolutePath) ||
    !fs.statSync(existingLyricsAbsolutePath).isFile()
  ) {
    return null
  }

  if (oldStem === newStem) {
    return existingLyricsRelativePath
  }

  const lyricsExtension = path.extname(existingLyricsAbsolutePath)
  const canonicalRelativePath = buildLyricsRelativePath(`${newStem}${lyricsExtension}`)
  const canonicalAbsolutePath = path.resolve(musicDirectory, canonicalRelativePath)

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

async function handleDeleteTrack(
  request: Connect.IncomingMessage,
  response: ServerResponse,
  musicDirectory: string | null,
): Promise<void> {
  if (!musicDirectory) {
    sendJson(response, 404, { message: 'Biblioteca de música no disponible.' })
    return
  }

  let payload: DeleteTrackRequest

  try {
    payload = JSON.parse(await readRequestBody(request)) as DeleteTrackRequest
  } catch {
    sendJson(response, 400, { message: 'Solicitud de eliminación inválida.' })
    return
  }

  if (typeof payload.trackRelativePath !== 'string') {
    sendJson(response, 400, { message: 'Datos de eliminación incompletos.' })
    return
  }

  const trackAbsolutePath = resolveSafeAudioPath(musicDirectory, payload.trackRelativePath)

  if (!trackAbsolutePath) {
    sendJson(response, 404, { message: 'No se encontró la pista para eliminar.' })
    return
  }

  const coverRelativePath =
    typeof payload.coverRelativePath === 'string' ? payload.coverRelativePath : null
  const lyricsRelativePath =
    typeof payload.lyricsRelativePath === 'string' ? payload.lyricsRelativePath : null

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
    sendJson(response, 500, { message: 'No se pudo eliminar el archivo de audio.' })
    return
  }

  const deleteResponse: DeleteTrackResponse = {
    deletedTrackRelativePath: payload.trackRelativePath,
    deletedCoverCount,
    deletedLyricsCount,
  }

  sendJson(response, 200, deleteResponse)
}

async function handleRenameTrack(
  request: Connect.IncomingMessage,
  response: ServerResponse,
  musicDirectory: string | null,
): Promise<void> {
  if (!musicDirectory) {
    sendJson(response, 404, { message: 'Biblioteca de música no disponible.' })
    return
  }

  let payload: RenameTrackRequest

  try {
    payload = JSON.parse(await readRequestBody(request)) as RenameTrackRequest
  } catch {
    sendJson(response, 400, { message: 'Solicitud de renombrado inválida.' })
    return
  }

  if (
    typeof payload.trackRelativePath !== 'string' ||
    typeof payload.title !== 'string' ||
    typeof payload.artist !== 'string'
  ) {
    sendJson(response, 400, { message: 'Datos de renombrado incompletos.' })
    return
  }

  const currentAbsolutePath = resolveSafeAudioPath(musicDirectory, payload.trackRelativePath)

  if (!currentAbsolutePath) {
    sendJson(response, 404, { message: 'No se encontró la pista para renombrar.' })
    return
  }

  let nextFilename: string

  try {
    nextFilename = buildAudioFilename(payload.artist, payload.title)
  } catch {
    sendJson(response, 400, { message: 'Artista y título no son válidos para renombrar.' })
    return
  }

  const nextAbsolutePath = path.join(path.dirname(currentAbsolutePath), nextFilename)
  const nextRelativePath = normalizeRelativePath(musicDirectory, nextAbsolutePath)
  const currentRelativePath = normalizeRelativePath(musicDirectory, currentAbsolutePath)

  if (path.resolve(nextAbsolutePath) !== path.resolve(currentAbsolutePath)) {
    if (fs.existsSync(nextAbsolutePath)) {
      sendJson(response, 409, {
        message: 'Ya existe otra canción con ese nombre en la biblioteca.',
      })
      return
    }

    try {
      fs.renameSync(currentAbsolutePath, nextAbsolutePath)
    } catch {
      sendJson(response, 500, { message: 'No se pudo renombrar el archivo de audio.' })
      return
    }
  }

  let nextCoverRelativePath: string | null
  let nextLyricsRelativePath = resolveTrackLyricsPath(
    musicDirectory,
    currentRelativePath,
    path.basename(currentRelativePath),
  )

  try {
    nextCoverRelativePath = renameAssociatedCoverIfNeeded(
      musicDirectory,
      currentRelativePath,
      nextRelativePath,
      payload.coverRelativePath,
    )
    nextLyricsRelativePath = renameAssociatedLyricsIfNeeded(
      musicDirectory,
      currentRelativePath,
      nextRelativePath,
      nextLyricsRelativePath,
    )
  } catch {
    sendJson(response, 500, { message: 'No se pudo renombrar los archivos asociados.' })
    return
  }

  if (nextLyricsRelativePath) {
    removeDuplicateLyricsForTrack(
      musicDirectory,
      nextRelativePath,
      path.resolve(musicDirectory, nextLyricsRelativePath),
      nextLyricsRelativePath,
    )

    removeObsoleteLyricsFiles(
      collectObsoleteLyricsAbsolutePaths(
        musicDirectory,
        nextRelativePath,
        nextLyricsRelativePath,
        path.resolve(musicDirectory, nextLyricsRelativePath),
      ),
    )
  }

  if (nextCoverRelativePath) {
    removeDuplicateCoversForTrack(
      musicDirectory,
      nextRelativePath,
      path.resolve(musicDirectory, nextCoverRelativePath),
      nextCoverRelativePath,
    )

    removeObsoleteCoverFiles(
      collectObsoleteCoverAbsolutePaths(
        musicDirectory,
        nextRelativePath,
        nextCoverRelativePath,
        path.resolve(musicDirectory, nextCoverRelativePath),
      ),
    )
  }

  const parsedFilename = parseAudioFilename(nextFilename)
  const renameResponse: RenameTrackResponse = {
    id: createTrackId(nextRelativePath),
    relativePath: nextRelativePath,
    filename: nextFilename,
    title: parsedFilename.title,
    artist: parsedFilename.artist,
    coverRelativePath: nextCoverRelativePath,
    lyricsRelativePath: nextLyricsRelativePath,
  }

  sendJson(response, 200, renameResponse)
}

function createMusicLibraryMiddleware(getMusicDirectory: () => string): Connect.NextHandleFunction {
  return (request, response, next) => {
    if (!request.url) {
      next()
      return
    }

    const requestUrl = new URL(request.url, 'http://localhost')

    if (request.method === 'GET' && requestUrl.pathname === TRACKS_ENDPOINT) {
      void buildMusicLibrary(getMusicDirectory())
        .then((library) => {
          sendJson(response, 200, library)
        })
        .catch(() => {
          sendJson(response, 500, { message: 'No se pudo construir la biblioteca de música.' })
        })
      return
    }

    if (request.method === 'GET' && requestUrl.pathname === COVER_ENDPOINT_PREFIX) {
      const musicDirectory = getMusicDirectory()
      const relativePath = requestUrl.searchParams.get('path')

      if (!musicDirectory || !relativePath) {
        sendJson(response, 404, { message: 'Portada no encontrada.' })
        return
      }

      const coverPath = resolveSafeCoverPath(musicDirectory, relativePath)

      if (!coverPath) {
        sendJson(response, 404, { message: 'Portada no encontrada.' })
        return
      }

      response.statusCode = 200
      response.setHeader('Content-Type', resolveCoverContentType(relativePath))
      fs.createReadStream(coverPath).pipe(response)
      return
    }

    if (request.method === 'PUT' && requestUrl.pathname === COVER_ENDPOINT_PREFIX) {
      void handleSaveTrackCover(request, response, getMusicDirectory())
      return
    }

    if (request.method === 'GET' && requestUrl.pathname === LYRICS_ENDPOINT) {
      const musicDirectory = getMusicDirectory()
      const relativePath = requestUrl.searchParams.get('path')

      if (!musicDirectory || !relativePath) {
        sendJson(response, 404, { message: 'Letra no encontrada.' })
        return
      }

      const lyricsPath = resolveSafeLyricsPath(musicDirectory, relativePath)

      if (!lyricsPath) {
        sendJson(response, 404, { message: 'Letra no encontrada.' })
        return
      }

      try {
        const lyricsContent = fs.readFileSync(lyricsPath, 'utf8')
        response.statusCode = 200
        response.setHeader('Content-Type', 'text/plain; charset=utf-8')
        response.setHeader('Cache-Control', 'no-store')
        response.end(lyricsContent)
      } catch {
        sendJson(response, 500, { message: 'No se pudo leer la letra en disco.' })
      }

      return
    }

    if (request.method === 'PUT' && requestUrl.pathname === LYRICS_ENDPOINT) {
      void handleSaveTrackLyrics(request, response, getMusicDirectory())
      return
    }

    if (request.method === 'PUT' && requestUrl.pathname === TRACK_ENDPOINT) {
      void handleRenameTrack(request, response, getMusicDirectory())
      return
    }

    if (request.method === 'DELETE' && requestUrl.pathname === TRACK_ENDPOINT) {
      void handleDeleteTrack(request, response, getMusicDirectory())
      return
    }

    if (request.method === 'GET' && requestUrl.pathname === AUDIO_ENDPOINT_PREFIX) {
      const musicDirectory = getMusicDirectory()
      const relativePath = requestUrl.searchParams.get('path')

      if (!musicDirectory || !relativePath) {
        sendJson(response, 404, { message: 'Archivo no encontrado.' })
        return
      }

      const audioPath = resolveSafeAudioPath(musicDirectory, relativePath)

      if (!audioPath) {
        sendJson(response, 404, { message: 'Archivo no encontrado.' })
        return
      }

      response.statusCode = 200
      response.setHeader('Content-Type', 'audio/mpeg')
      fs.createReadStream(audioPath).pipe(response)
      return
    }

    next()
  }
}

const projectRoot = resolveProjectRootFromModule(import.meta.url)

/**
 * Registra endpoints locales para listar y reproducir MP3 de la carpeta mi-musica.
 */
export function musicLibraryPlugin(): Plugin {
  const getMusicDirectory = (): string => ensureProjectMusicDirectory(projectRoot)

  const registerMiddleware = (middlewares: Connect.Server): void => {
    middlewares.use(createMusicLibraryMiddleware(getMusicDirectory))
  }

  return {
    name: 'music-library',
    configureServer(server) {
      registerMiddleware(server.middlewares)
    },
    configurePreviewServer(server) {
      registerMiddleware(server.middlewares)
    },
  }
}
