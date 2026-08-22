/** Transporte HTTP (Vite) o IPC (Electron) para operaciones de biblioteca musical. */
import { isDesktopApp } from '@lib/runtimeEnvironment'
import {
  MUSIC_LIBRARY_ENDPOINTS,
  isMusicLibraryErrorPayload,
  isMusicLibraryResponse,
  isRenameTrackResponse,
  isSaveTrackCoverResponse,
  isSaveTrackLyricsResponse,
  type DeleteTrackRequest,
  type MusicLibraryResponse,
  type RenameTrackRequest,
  type RenameTrackResponse,
  type SaveTrackCoverRequest,
  type SaveTrackCoverResponse,
  type SaveTrackLyricsRequest,
  type SaveTrackLyricsResponse,
} from '@shared/musicLibrary'
import type { VeluraMusicLibraryBridge } from '../../../types/veluraDesktop'

const {
  tracks: LIBRARY_TRACKS_ENDPOINT,
  track: LIBRARY_TRACK_ENDPOINT,
  audio: LIBRARY_AUDIO_ENDPOINT,
  cover: LIBRARY_COVER_ENDPOINT,
  lyrics: LIBRARY_LYRICS_ENDPOINT,
} = MUSIC_LIBRARY_ENDPOINTS

interface MusicLibraryTransport {
  getTracks(): Promise<MusicLibraryResponse>
  saveTrackCover(payload: SaveTrackCoverRequest): Promise<SaveTrackCoverResponse>
  saveTrackLyrics(payload: SaveTrackLyricsRequest): Promise<SaveTrackLyricsResponse>
  renameTrack(payload: RenameTrackRequest): Promise<RenameTrackResponse>
  deleteTrack(payload: DeleteTrackRequest): Promise<void>
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

function assertDto<T>(
  value: unknown,
  guard: (value: unknown) => value is T,
  errorMessage: string,
): T {
  if (!guard(value)) {
    throw new Error(errorMessage)
  }

  return value
}

async function readHttpErrorMessage(response: Response, fallback: string): Promise<string> {
  const errorPayload: unknown = await response.json().catch(() => null)

  if (isMusicLibraryErrorPayload(errorPayload)) {
    return errorPayload.message
  }

  return fallback
}

async function readGuardedJson<T>(
  response: Response,
  guard: (value: unknown) => value is T,
  errorMessage: string,
): Promise<T> {
  const payload: unknown = await response.json()
  return assertDto(payload, guard, errorMessage)
}

function createHttpTransport(): MusicLibraryTransport {
  return {
    async getTracks() {
      const response = await fetch(LIBRARY_TRACKS_ENDPOINT)

      if (!response.ok) {
        throw new Error('No se pudo cargar la biblioteca local de música.')
      }

      return readGuardedJson(
        response,
        isMusicLibraryResponse,
        'No se pudo cargar la biblioteca local de música.',
      )
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

      return readGuardedJson(
        response,
        isSaveTrackCoverResponse,
        'No se pudo guardar la portada en la biblioteca local.',
      )
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

      return readGuardedJson(
        response,
        isSaveTrackLyricsResponse,
        'No se pudo guardar la letra en la biblioteca local.',
      )
    },

    async renameTrack(payload) {
      const response = await fetch(LIBRARY_TRACK_ENDPOINT, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(
          await readHttpErrorMessage(
            response,
            'No se pudo renombrar la canción en la biblioteca local.',
          ),
        )
      }

      return readGuardedJson(
        response,
        isRenameTrackResponse,
        'No se pudo renombrar la canción en la biblioteca local.',
      )
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
        throw new Error(
          await readHttpErrorMessage(response, 'No se pudo cargar la letra seleccionada.'),
        )
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
