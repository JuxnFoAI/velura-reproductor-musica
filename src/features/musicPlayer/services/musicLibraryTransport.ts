/** Transporte HTTP (Vite) o IPC (Electron) para operaciones de biblioteca musical. */
import { isDesktopApp } from '@lib/runtimeEnvironment'
import type { VeluraMusicLibraryBridge } from '../../../types/veluraDesktop'

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

interface MusicLibraryTransport {
  getTracks(): Promise<MusicLibraryResponseDto>
  saveTrackCover(payload: SaveTrackCoverPayload): Promise<SaveTrackCoverResponse>
  saveTrackLyrics(payload: SaveTrackLyricsPayload): Promise<SaveTrackLyricsResponse>
  renameTrack(payload: RenameTrackPayload): Promise<RenameTrackResponse>
  deleteTrack(payload: DeleteTrackPayload): Promise<void>
  buildAudioUrl(relativePath: string): string
  buildCoverUrl(coverRelativePath: string | null | undefined, cacheBust?: number): string | undefined
  buildLyricsUrl(relativePath: string, cacheBust?: number): string
  fetchLyricsContent(relativePath: string, cacheBust?: number): Promise<string>
}

function getDesktopBridge(): VeluraMusicLibraryBridge {
  const bridge = window.veluraMusicLibrary

  if (!bridge) {
    throw new Error('La API de biblioteca de Velura no está disponible en la app de escritorio.')
  }

  return bridge
}

async function readHttpErrorMessage(response: Response, fallback: string): Promise<string> {
  const errorPayload = (await response.json().catch(() => null)) as { message?: string } | null
  return errorPayload?.message ?? fallback
}

function createHttpTransport(): MusicLibraryTransport {
  return {
    async getTracks() {
      const response = await fetch(LIBRARY_TRACKS_ENDPOINT)

      if (!response.ok) {
        throw new Error('No se pudo cargar la biblioteca local de música.')
      }

      return (await response.json()) as MusicLibraryResponseDto
    },

    async saveTrackCover(payload) {
      const response = await fetch(LIBRARY_COVER_ENDPOINT, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('No se pudo guardar la portada en la biblioteca local.')
      }

      return (await response.json()) as SaveTrackCoverResponse
    },

    async saveTrackLyrics(payload) {
      const response = await fetch(LIBRARY_LYRICS_ENDPOINT, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(
          await readHttpErrorMessage(response, 'No se pudo guardar la letra en la biblioteca local.'),
        )
      }

      return (await response.json()) as SaveTrackLyricsResponse
    },

    async renameTrack(payload) {
      const response = await fetch(LIBRARY_TRACK_ENDPOINT, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(
          await readHttpErrorMessage(response, 'No se pudo renombrar la canción en la biblioteca local.'),
        )
      }

      return (await response.json()) as RenameTrackResponse
    },

    async deleteTrack(payload) {
      const response = await fetch(LIBRARY_TRACK_ENDPOINT, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(
          await readHttpErrorMessage(response, 'No se pudo eliminar la canción de la biblioteca local.'),
        )
      }
    },

    buildAudioUrl(relativePath) {
      const encodedPath = encodeURIComponent(relativePath)
      return `${LIBRARY_AUDIO_ENDPOINT}?path=${encodedPath}`
    },

    buildCoverUrl(coverRelativePath, cacheBust) {
      if (!coverRelativePath) {
        return undefined
      }

      const encodedPath = encodeURIComponent(coverRelativePath)
      const versionQuery = cacheBust !== undefined ? `&v=${cacheBust}` : ''

      return `${LIBRARY_COVER_ENDPOINT}?path=${encodedPath}${versionQuery}`
    },

    buildLyricsUrl(relativePath, cacheBust) {
      const encodedPath = encodeURIComponent(relativePath)
      const revisionQuery = cacheBust !== undefined ? `&v=${cacheBust}` : ''

      return `${LIBRARY_LYRICS_ENDPOINT}?path=${encodedPath}${revisionQuery}`
    },

    async fetchLyricsContent(relativePath, cacheBust) {
      const response = await fetch(this.buildLyricsUrl(relativePath, cacheBust))

      if (!response.ok) {
        throw new Error(
          await readHttpErrorMessage(response, 'No se pudo cargar la letra seleccionada.'),
        )
      }

      return response.text()
    },
  }
}

function createIpcTransport(bridge: VeluraMusicLibraryBridge): MusicLibraryTransport {
  return {
    getTracks() {
      return bridge.getTracks()
    },

    saveTrackCover(payload) {
      return bridge.saveTrackCover(payload)
    },

    saveTrackLyrics(payload) {
      return bridge.saveTrackLyrics(payload)
    },

    renameTrack(payload) {
      return bridge.renameTrack(payload)
    },

    async deleteTrack(payload) {
      await bridge.deleteTrack(payload)
    },

    buildAudioUrl(relativePath) {
      return bridge.buildAudioUrl(relativePath)
    },

    buildCoverUrl(coverRelativePath, cacheBust) {
      if (!coverRelativePath) {
        return undefined
      }

      return bridge.buildCoverUrl(coverRelativePath, cacheBust)
    },

    buildLyricsUrl(relativePath, cacheBust) {
      return bridge.buildLyricsUrl(relativePath, cacheBust)
    },

    async fetchLyricsContent(relativePath, cacheBust) {
      const response = await fetch(this.buildLyricsUrl(relativePath, cacheBust))

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as { message?: string } | null
        throw new Error(errorPayload?.message ?? 'No se pudo cargar la letra seleccionada.')
      }

      return response.text()
    },
  }
}

/** Resuelve el transporte activo según el entorno de ejecución. */
export function getMusicLibraryTransport(): MusicLibraryTransport {
  if (isDesktopApp()) {
    return createIpcTransport(getDesktopBridge())
  }

  return createHttpTransport()
}
