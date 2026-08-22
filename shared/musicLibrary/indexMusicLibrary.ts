/** Indexación de la biblioteca: escaneo MP3, metadatos y poda de assets. */

import fs from 'node:fs'
import path from 'node:path'
import { parseFile } from 'music-metadata'
import { createTrackId } from './createTrackId'
import { MP3_EXTENSION } from './constants'
import { parseAudioFilename } from './parseAudioFilename'
import { pruneDuplicateCoverAssets, resolveTrackCoverPath } from './trackCoverAssets'
import { pruneDuplicateLyricsAssets, resolveTrackLyricsPath } from './trackLyricsAssets'
import { resolveSafeAudioPath } from './safePaths'
import type { MusicLibraryResponse } from './types'

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

function pruneDuplicateTrackAssets(
  musicDirectory: string,
  trackRelativePath: string,
  filename: string,
): void {
  pruneDuplicateCoverAssets(musicDirectory, trackRelativePath, filename)
  pruneDuplicateLyricsAssets(musicDirectory, trackRelativePath, filename)
}
