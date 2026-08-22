/** Cliente de biblioteca MP3: IPC en Electron, HTTP en desarrollo web. */
import { parseAudioFilename } from '@shared/musicLibrary'
import type { Track } from '../types'
import { getMusicLibraryTransport } from './musicLibraryTransport'

interface LocalMusicLibrary {
  musicDirectory: string | null
  tracks: Track[]
}

interface SaveTrackCoverInput {
  relativePath: string
  coverRelativePath?: string | null
}

interface SaveTrackLyricsInput {
  relativePath: string
}

interface RenameTrackInput {
  relativePath: string
  title: string
  artist: string
  coverRelativePath?: string | null
}

interface DeleteTrackInput {
  relativePath: string
  coverRelativePath?: string | null
  lyricsRelativePath?: string | null
}

interface RenamedTrackResult {
  id: string
  relativePath: string
  title: string
  artist: string
  src: string
  coverRelativePath: string | null
  coverUrl?: string
  lyricsRelativePath: string | null
}

/**
 * Obtiene los MP3 disponibles en la carpeta mi-musica del proyecto.
 */
export async function fetchLocalMusicLibrary(): Promise<LocalMusicLibrary> {
  const transport = getMusicLibraryTransport()
  const payload = await transport.getTracks()

  return {
    musicDirectory: payload.musicDirectory,
    tracks: payload.tracks.map((track) => mapLibraryTrackToPlayerTrack(track, transport)),
  }
}

/**
 * Guarda la portada ajustada sobrescribiendo el archivo original en disco.
 */
export async function saveTrackCoverToLibrary(
  track: SaveTrackCoverInput,
  coverSource: string | Blob,
): Promise<{ coverRelativePath: string; coverUrl: string }> {
  const transport = getMusicLibraryTransport()
  const imageDataUrl =
    typeof coverSource === 'string'
      ? await ensureImageDataUrl(coverSource)
      : await blobToDataUrl(coverSource)

  const result = await transport.saveTrackCover({
    trackRelativePath: track.relativePath,
    coverRelativePath: track.coverRelativePath ?? null,
    imageDataUrl,
  })

  const coverUrl = transport.buildCoverUrl(result.coverRelativePath, Date.now())

  if (!coverUrl) {
    throw new Error('No se pudo construir la URL de la portada guardada.')
  }

  return {
    coverRelativePath: result.coverRelativePath,
    coverUrl,
  }
}

/**
 * Guarda la letra seleccionada junto al MP3 en la biblioteca local.
 */
export async function saveTrackLyricsToLibrary(
  track: SaveTrackLyricsInput,
  lyricsContent: string,
  lyricsExtension: '.txt' | '.lrc',
  existingLyricsRelativePath?: string | null,
  sourceLyricsFilename?: string | null,
): Promise<{ lyricsRelativePath: string }> {
  const transport = getMusicLibraryTransport()

  return transport.saveTrackLyrics({
    trackRelativePath: track.relativePath,
    lyricsContent,
    lyricsExtension,
    ...(existingLyricsRelativePath ? { existingLyricsRelativePath } : {}),
    ...(sourceLyricsFilename ? { sourceLyricsFilename } : {}),
  })
}

/**
 * Obtiene el contenido de un archivo de letra de la biblioteca local.
 */
export async function fetchTrackLyricsContent(
  relativePath: string,
  cacheBust?: number,
): Promise<string> {
  return getMusicLibraryTransport().fetchLyricsContent(relativePath, cacheBust)
}

/**
 * Renombra el MP3 en disco según el artista y título indicados.
 */
export async function renameTrackInLibrary(track: RenameTrackInput): Promise<RenamedTrackResult> {
  const transport = getMusicLibraryTransport()
  const result = await transport.renameTrack({
    trackRelativePath: track.relativePath,
    title: track.title,
    artist: track.artist,
    coverRelativePath: track.coverRelativePath ?? null,
  })

  return {
    id: result.id,
    relativePath: result.relativePath,
    title: result.title,
    artist: result.artist,
    src: transport.buildAudioUrl(result.relativePath),
    coverRelativePath: result.coverRelativePath,
    coverUrl: result.coverRelativePath
      ? transport.buildCoverUrl(result.coverRelativePath, Date.now())
      : undefined,
    lyricsRelativePath: result.lyricsRelativePath,
  }
}

/**
 * Elimina el MP3 y sus archivos asociados (portada y letra) de la biblioteca local.
 */
export async function deleteTrackFromLibrary(track: DeleteTrackInput): Promise<void> {
  await getMusicLibraryTransport().deleteTrack({
    trackRelativePath: track.relativePath,
    coverRelativePath: track.coverRelativePath ?? null,
    lyricsRelativePath: track.lyricsRelativePath ?? null,
  })
}

function mapLibraryTrackToPlayerTrack(
  track: {
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
  },
  transport: ReturnType<typeof getMusicLibraryTransport>,
): Track {
  const parsedFilename = parseAudioFilename(track.filename)

  return {
    id: track.id,
    title: track.title || parsedFilename.title,
    artist: track.artist || parsedFilename.artist,
    duration: track.duration,
    fileSizeBytes: track.fileSizeBytes,
    src: transport.buildAudioUrl(track.relativePath),
    relativePath: track.relativePath,
    coverRelativePath: track.coverRelativePath,
    coverUrl: transport.buildCoverUrl(track.coverRelativePath),
    lyricsRelativePath: track.lyricsRelativePath,
    replayGainTrackDb: track.replayGainTrackDb,
  }
}

async function ensureImageDataUrl(coverSource: string): Promise<string> {
  if (coverSource.startsWith('data:image/')) {
    return coverSource
  }

  if (!coverSource.startsWith('blob:')) {
    throw new Error('La portada seleccionada no se puede guardar en disco.')
  }

  const response = await fetch(coverSource)

  if (!response.ok) {
    throw new Error('No se pudo leer la portada para guardarla en disco.')
  }

  return blobToDataUrl(await response.blob())
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }

      reject(new Error('No se pudo preparar la portada para guardarla en disco.'))
    }

    reader.onerror = () => {
      reject(new Error('No se pudo preparar la portada para guardarla en disco.'))
    }

    reader.readAsDataURL(blob)
  })
}
