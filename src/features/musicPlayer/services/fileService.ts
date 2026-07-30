/** Utilidades para metadatos y duración de pistas de audio. */
import type { Track } from '../types'

const METADATA_DURATION_RETRY_MS = 400

/**
 * Libera el object URL de una portada personalizada para evitar fugas de memoria.
 * @param coverUrl - URL de la portada que debe revocarse si es un blob.
 */
export function revokeCoverUrl(coverUrl?: string): void {
  if (!coverUrl?.startsWith('blob:')) {
    return
  }

  URL.revokeObjectURL(coverUrl)
}

/**
 * Libera los object URLs blob asociados a una pista.
 */
function revokeTrackUrl(track: Track): void {
  if (!track.src.startsWith('blob:')) {
    return
  }

  URL.revokeObjectURL(track.src)
}

/**
 * Libera los recursos blob asociados a una pista.
 * @param track - Pista cuyos object URLs deben revocarse.
 */
export function revokeTrackResources(track: Track): void {
  revokeTrackUrl(track)
  revokeCoverUrl(track.coverUrl)
}

/**
 * Formatea un tamaño en bytes a una cadena legible (B, KB, MB, GB).
 * @param bytes - Tamaño del archivo en bytes.
 * @returns Cadena formateada, por ejemplo `4521984` → `"4.3 MB"`.
 */
export function formatFileSize(bytes?: number): string {
  if (bytes === undefined || bytes <= 0) {
    return 'No disponible'
  }

  const sizeUnits = ['B', 'KB', 'MB', 'GB'] as const
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    sizeUnits.length - 1,
  )
  const normalizedSize = bytes / 1024 ** unitIndex
  const decimalPlaces = unitIndex === 0 ? 0 : 1

  return `${normalizedSize.toFixed(decimalPlaces)} ${sizeUnits[unitIndex]}`
}

/**
 * @param seconds - Duración total en segundos.
 * @returns Cadena formateada, por ejemplo `187` → `"3:07"`.
 */
export function formatDuration(seconds: number): string {
  const totalSeconds = Math.floor(Math.max(0, seconds))
  const minutes = Math.floor(totalSeconds / 60)
  const remainingSeconds = totalSeconds % 60

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

/**
 * Lee la duración de un archivo de audio a partir de su URL.
 */
export async function readAudioDurationFromUrl(src: string): Promise<number> {
  try {
    const metadataDuration = await readDurationFromMetadata(src)

    if (metadataDuration > 0) {
      return metadataDuration
    }
  } catch {
    // Algunos MP3 no exponen duración fiable en metadatos HTML5.
  }

  return readDurationFromDecodedBuffer(src)
}

function readDurationFromMetadata(src: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio()
    let isSettled = false
    let retryTimeoutId = 0

    const cleanup = (): void => {
      window.clearTimeout(retryTimeoutId)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('durationchange', handleDurationChange)
      audio.removeEventListener('error', handleError)
      audio.src = ''
    }

    const settleWithDuration = (): void => {
      if (isSettled) {
        return
      }

      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        isSettled = true
        cleanup()
        resolve(audio.duration)
      }
    }

    const rejectMetadata = (): void => {
      if (isSettled) {
        return
      }

      isSettled = true
      cleanup()
      reject(new Error('Metadatos sin duración válida'))
    }

    const handleLoadedMetadata = (): void => {
      settleWithDuration()

      if (!isSettled) {
        retryTimeoutId = window.setTimeout(rejectMetadata, METADATA_DURATION_RETRY_MS)
      }
    }

    const handleDurationChange = (): void => {
      settleWithDuration()
    }

    const handleError = (): void => {
      rejectMetadata()
    }

    audio.preload = 'metadata'
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('durationchange', handleDurationChange)
    audio.addEventListener('error', handleError)
    audio.src = src
  })
}

async function readDurationFromDecodedBuffer(src: string): Promise<number> {
  const response = await fetch(src)

  if (!response.ok) {
    throw new Error(`No se pudo obtener el audio (${response.status})`)
  }

  const encodedAudio = await response.arrayBuffer()
  const audioContext = new AudioContext()

  try {
    const decodedBuffer = await audioContext.decodeAudioData(encodedAudio.slice(0))
    return decodedBuffer.duration
  } finally {
    await audioContext.close()
  }
}

/**
 * Completa la duración de pistas que aún no la tienen cargada.
 */
export async function enrichTracksWithDuration(tracks: Track[]): Promise<Track[]> {
  return Promise.all(
    tracks.map(async (track) => {
      if (track.duration > 0) {
        return track
      }

      try {
        const duration = await readAudioDurationFromUrl(track.src)
        return { ...track, duration }
      } catch {
        return track
      }
    }),
  )
}
