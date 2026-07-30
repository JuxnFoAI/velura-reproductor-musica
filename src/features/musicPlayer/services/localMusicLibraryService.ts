/** Cliente HTTP para la biblioteca MP3 expuesta desde la carpeta mi-musica. */
import { parseAudioFilename } from '@lib/parseAudioFilename'
import type { Track } from '../types'

const LIBRARY_TRACKS_ENDPOINT = '/api/music/tracks'
const LIBRARY_TRACK_ENDPOINT = '/api/music/track'
const LIBRARY_AUDIO_ENDPOINT = '/api/music/audio'
const LIBRARY_COVER_ENDPOINT = '/api/music/cover'
const LIBRARY_LYRICS_ENDPOINT = '/api/music/lyrics'

interface MusicLibraryTrackDto {
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

interface MusicLibraryResponseDto {
  musicDirectory: string | null
  tracks: MusicLibraryTrackDto[]
}

interface LocalMusicLibrary {
  musicDirectory: string | null
  tracks: Track[]
}

interface SaveTrackCoverPayload {
  trackRelativePath: string
  coverRelativePath: string | null
  imageDataUrl: string
}

interface SaveTrackCoverResponse {
  coverRelativePath: string
}

interface SaveTrackLyricsPayload {
  trackRelativePath: string
  lyricsContent: string
  lyricsExtension: '.txt' | '.lrc'
  existingLyricsRelativePath?: string | null
  sourceLyricsFilename?: string | null
}

interface SaveTrackLyricsResponse {
  lyricsRelativePath: string
}

interface SaveTrackLyricsInput {
  relativePath: string
}

interface SaveTrackCoverInput {
  relativePath: string
  coverRelativePath?: string | null
}

interface RenameTrackInput {
  relativePath: string
  title: string
  artist: string
  coverRelativePath?: string | null
}

interface RenameTrackPayload {
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

interface DeleteTrackPayload {
  trackRelativePath: string
  coverRelativePath: string | null
  lyricsRelativePath: string | null
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
  const response = await fetch(LIBRARY_TRACKS_ENDPOINT)

  if (!response.ok) {
    throw new Error('No se pudo cargar la biblioteca local de música.')
  }

  const payload = (await response.json()) as MusicLibraryResponseDto

  return {
    musicDirectory: payload.musicDirectory,
    tracks: payload.tracks.map(mapLibraryTrackDtoToTrack),
  }
}

/**
 * Guarda la portada ajustada sobrescribiendo el archivo original en disco.
 */
export async function saveTrackCoverToLibrary(
  track: SaveTrackCoverInput,
  coverSource: string | Blob,
): Promise<{ coverRelativePath: string; coverUrl: string }> {
  const imageDataUrl =
    typeof coverSource === 'string'
      ? await ensureImageDataUrl(coverSource)
      : await blobToDataUrl(coverSource)

  const payload: SaveTrackCoverPayload = {
    trackRelativePath: track.relativePath,
    coverRelativePath: track.coverRelativePath ?? null,
    imageDataUrl,
  }

  const response = await fetch(LIBRARY_COVER_ENDPOINT, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error('No se pudo guardar la portada en la biblioteca local.')
  }

  const result = (await response.json()) as SaveTrackCoverResponse
  const coverUrl = buildLibraryCoverUrl(result.coverRelativePath, Date.now())

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
  const payload: SaveTrackLyricsPayload = {
    trackRelativePath: track.relativePath,
    lyricsContent,
    lyricsExtension,
    ...(existingLyricsRelativePath
      ? { existingLyricsRelativePath }
      : {}),
    ...(sourceLyricsFilename
      ? { sourceLyricsFilename }
      : {}),
  }

  const response = await fetch(LIBRARY_LYRICS_ENDPOINT, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(errorPayload?.message ?? 'No se pudo guardar la letra en la biblioteca local.')
  }

  return (await response.json()) as SaveTrackLyricsResponse
}

/**
 * Obtiene el contenido de un archivo de letra de la biblioteca local.
 */
export async function fetchTrackLyricsContent(
  relativePath: string,
  cacheBust?: number,
): Promise<string> {
  const encodedPath = encodeURIComponent(relativePath)
  const revisionQuery = cacheBust !== undefined ? `&v=${cacheBust}` : ''
  const response = await fetch(`${LIBRARY_LYRICS_ENDPOINT}?path=${encodedPath}${revisionQuery}`)

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(errorPayload?.message ?? 'No se pudo cargar la letra seleccionada.')
  }

  return response.text()
}

/**
 * Renombra el MP3 en disco según el artista y título indicados.
 */
export async function renameTrackInLibrary(
  track: RenameTrackInput,
): Promise<RenamedTrackResult> {
  const payload: RenameTrackPayload = {
    trackRelativePath: track.relativePath,
    title: track.title,
    artist: track.artist,
    coverRelativePath: track.coverRelativePath ?? null,
  }

  const response = await fetch(LIBRARY_TRACK_ENDPOINT, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(
      errorPayload?.message ?? 'No se pudo renombrar la canción en la biblioteca local.',
    )
  }

  const result = (await response.json()) as RenameTrackResponse
  const encodedPath = encodeURIComponent(result.relativePath)

  return {
    id: result.id,
    relativePath: result.relativePath,
    title: result.title,
    artist: result.artist,
    src: `${LIBRARY_AUDIO_ENDPOINT}?path=${encodedPath}`,
    coverRelativePath: result.coverRelativePath,
    coverUrl: buildLibraryCoverUrl(result.coverRelativePath, Date.now()),
    lyricsRelativePath: result.lyricsRelativePath,
  }
}

/**
 * Elimina el MP3 y sus archivos asociados (portada y letra) de la biblioteca local.
 */
export async function deleteTrackFromLibrary(track: DeleteTrackInput): Promise<void> {
  const payload: DeleteTrackPayload = {
    trackRelativePath: track.relativePath,
    coverRelativePath: track.coverRelativePath ?? null,
    lyricsRelativePath: track.lyricsRelativePath ?? null,
  }

  const response = await fetch(LIBRARY_TRACK_ENDPOINT, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(
      errorPayload?.message ?? 'No se pudo eliminar la canción de la biblioteca local.',
    )
  }
}

function mapLibraryTrackDtoToTrack(track: MusicLibraryTrackDto): Track {
  const parsedFilename = parseAudioFilename(track.filename)
  const encodedPath = encodeURIComponent(track.relativePath)

  return {
    id: track.id,
    title: track.title || parsedFilename.title,
    artist: track.artist || parsedFilename.artist,
    duration: track.duration,
    fileSizeBytes: track.fileSizeBytes,
    src: `${LIBRARY_AUDIO_ENDPOINT}?path=${encodedPath}`,
    relativePath: track.relativePath,
    coverRelativePath: track.coverRelativePath,
    coverUrl: buildLibraryCoverUrl(track.coverRelativePath),
    lyricsRelativePath: track.lyricsRelativePath,
    replayGainTrackDb: track.replayGainTrackDb,
  }
}

function buildLibraryCoverUrl(
  coverRelativePath: string | null | undefined,
  cacheBuster?: number,
): string | undefined {
  if (!coverRelativePath) {
    return undefined
  }

  const encodedPath = encodeURIComponent(coverRelativePath)
  const versionQuery = cacheBuster ? `&v=${cacheBuster}` : ''

  return `${LIBRARY_COVER_ENDPOINT}?path=${encodedPath}${versionQuery}`
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
