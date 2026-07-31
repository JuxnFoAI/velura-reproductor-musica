/** Límites de tamaño para payloads HTTP/IPC de biblioteca musical. */
import type { IncomingMessage } from 'node:http'
import { musicLibraryFailure, type MusicLibraryFailure } from './result'

export const MUSIC_LIBRARY_PAYLOAD_LIMITS = {
  /** Tope del cuerpo HTTP JSON antes de parsear (cubre el payload de portada más overhead). */
  jsonRequestBodyMaxBytes: 2 * 1024 * 1024,
  /** Tope para imageDataUrl en saveCover (incluye prefijo data: y base64). */
  coverImageDataUrlMaxBytes: 1 * 1024 * 1024,
  /** Tope para imagen decodificada escrita a disco. */
  coverImageDecodedMaxBytes: 512 * 1024,
  /** Tope para lyricsContent en saveLyrics. */
  lyricsContentMaxBytes: 512 * 1024,
} as const

/** Error lanzado al superar el tope de bytes del cuerpo HTTP. */
export class RequestBodyTooLargeError extends Error {
  readonly status = 413

  constructor(message = 'Cuerpo de solicitud demasiado grande.') {
    super(message)
    this.name = 'RequestBodyTooLargeError'
  }
}

/** Lee el cuerpo HTTP con tope de bytes; destruye la conexión si se excede. */
export function readBoundedRequestBody(
  request: IncomingMessage,
  maxBytes: number = MUSIC_LIBRARY_PAYLOAD_LIMITS.jsonRequestBodyMaxBytes,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let totalBytes = 0

    request.on('data', (chunk: Buffer) => {
      totalBytes += chunk.length

      if (totalBytes > maxBytes) {
        request.destroy()
        reject(new RequestBodyTooLargeError())
        return
      }

      chunks.push(chunk)
    })

    request.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'))
    })

    request.on('error', reject)
  })
}

/** Valida el tamaño de una portada codificada como data URL. */
export function validateCoverImageDataUrlSize(
  imageDataUrl: string,
): MusicLibraryFailure | null {
  const byteLength = Buffer.byteLength(imageDataUrl, 'utf8')

  if (byteLength > MUSIC_LIBRARY_PAYLOAD_LIMITS.coverImageDataUrlMaxBytes) {
    return musicLibraryFailure(413, 'La imagen de portada supera el tamaño máximo permitido.')
  }

  return null
}

/** Valida el tamaño de una imagen de portada ya decodificada. */
export function validateCoverImageBufferSize(imageBuffer: Buffer): MusicLibraryFailure | null {
  if (imageBuffer.length > MUSIC_LIBRARY_PAYLOAD_LIMITS.coverImageDecodedMaxBytes) {
    return musicLibraryFailure(413, 'La imagen de portada supera el tamaño máximo permitido.')
  }

  return null
}

/** Valida el tamaño del contenido de letra enviado por IPC/HTTP. */
export function validateLyricsContentSize(lyricsContent: string): MusicLibraryFailure | null {
  const byteLength = Buffer.byteLength(lyricsContent, 'utf8')

  if (byteLength > MUSIC_LIBRARY_PAYLOAD_LIMITS.lyricsContentMaxBytes) {
    return musicLibraryFailure(413, 'La letra supera el tamaño máximo permitido.')
  }

  return null
}
