/** Protocolo velura-media para servir audio, portadas y letras desde disco. */
import fs from 'node:fs'
import { pathToFileURL } from 'node:url'
import { net, protocol } from 'electron'
import {
  readTrackLyricsFromDisk,
  resolveCoverContentType,
  resolveSafeAudioPath,
  resolveSafeCoverPath,
  resolveSafeLyricsPath,
  VELURA_MEDIA_SCHEME,
  type MusicLibraryMediaKind,
} from '../../shared/musicLibrary/node'
import { getElectronMusicDirectory } from '../musicDirectory'

function parseMediaKind(hostname: string): MusicLibraryMediaKind | null {
  if (hostname === 'audio' || hostname === 'cover' || hostname === 'lyrics') {
    return hostname
  }

  return null
}

function resolveMediaAbsolutePath(kind: MusicLibraryMediaKind, relativePath: string): string | null {
  const musicDirectory = getElectronMusicDirectory()

  switch (kind) {
    case 'audio':
      return resolveSafeAudioPath(musicDirectory, relativePath)
    case 'cover':
      return resolveSafeCoverPath(musicDirectory, relativePath)
    case 'lyrics':
      return resolveSafeLyricsPath(musicDirectory, relativePath)
    default:
      return null
  }
}

function resolveMediaMimeType(kind: MusicLibraryMediaKind, relativePath: string): string {
  if (kind === 'cover') {
    return resolveCoverContentType(relativePath)
  }

  if (kind === 'audio') {
    return 'audio/mpeg'
  }

  return 'text/plain; charset=utf-8'
}

function createNotFoundResponse(message: string): Response {
  return new Response(JSON.stringify({ message }), {
    status: 404,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

async function createFileMediaResponse(
  absolutePath: string,
  mimeType: string,
  extraHeaders: Record<string, string> = {},
): Promise<Response> {
  const fileResponse = await net.fetch(pathToFileURL(absolutePath).href)
  const fileStats = fs.statSync(absolutePath)

  return new Response(fileResponse.body, {
    status: 200,
    headers: {
      'Content-Type': mimeType,
      'Content-Length': String(fileStats.size),
      ...extraHeaders,
    },
  })
}

/** Declara el esquema antes de `app.whenReady()`. */
export function registerMediaProtocolScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: VELURA_MEDIA_SCHEME,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        stream: true,
        corsEnabled: true,
      },
    },
  ])
}

/** Atiende velura-media://audio|cover|lyrics/?path=... */
export function registerMediaProtocolHandler(): void {
  protocol.handle(VELURA_MEDIA_SCHEME, async (request) => {
    const requestUrl = new URL(request.url)
    const mediaKind = parseMediaKind(requestUrl.hostname)

    if (!mediaKind) {
      return createNotFoundResponse('Tipo de recurso no soportado.')
    }

    const relativePath = requestUrl.searchParams.get('path')

    if (!relativePath) {
      return createNotFoundResponse('Ruta de archivo no especificada.')
    }

    if (mediaKind === 'lyrics') {
      const lyricsResult = readTrackLyricsFromDisk(getElectronMusicDirectory(), relativePath)

      if (!lyricsResult.ok) {
        return createNotFoundResponse(lyricsResult.message)
      }

      return new Response(lyricsResult.data, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      })
    }

    const absolutePath = resolveMediaAbsolutePath(mediaKind, relativePath)

    if (!absolutePath) {
      return createNotFoundResponse('Archivo no encontrado.')
    }

    const mimeType = resolveMediaMimeType(mediaKind, relativePath)
    const cacheControl: Record<string, string> =
      mediaKind === 'cover' ? {} : { 'Cache-Control': 'no-store' }

    return createFileMediaResponse(absolutePath, mimeType, cacheControl)
  })
}
