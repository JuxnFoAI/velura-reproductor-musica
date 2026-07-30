/** Exportaciones públicas de tipos del reproductor de música. */

/**
 * Representa una pista de audio con metadatos y recursos asociados.
 */
export interface Track {
  id: string
  title: string
  artist: string
  album?: string
  /** Duración total de la pista en segundos. */
  duration: number
  /** Tamaño del archivo de audio en bytes. */
  fileSizeBytes?: number
  /** URL del objeto (object URL) del archivo de audio. */
  src: string
  /** URL de la portada del álbum o imagen placeholder. */
  coverUrl?: string
  /** Ruta relativa del MP3 dentro de la carpeta mi-musica. */
  relativePath?: string
  /** Ruta relativa de la portada asociada en disco, si existe. */
  coverRelativePath?: string | null
  /** Ruta relativa del archivo de letra (.txt / .lrc) asociado en disco. */
  lyricsRelativePath?: string | null
  /** Ganancia ReplayGain de pista en dB, si el archivo la incluye. */
  replayGainTrackDb?: number | null
}

/**
 * Estados posibles del motor de reproducción.
 */
export type PlayerStatus = 'idle' | 'playing' | 'paused' | 'loading' | 'error'

/**
 * Modo de repetición de la cola de reproducción.
 */
export type RepeatMode = 'none' | 'one' | 'all'

/**
 * Origen de la cola activa de reproducción en el reproductor.
 */
export type QueueContext = 'library' | 'favorites'

/**
 * Estado completo del reproductor de música y su cola de reproducción.
 */
export interface PlayerState {
  currentTrack: Track | null
  /** Cola activa de reproducción (puede ser un subconjunto, p. ej. favoritos). */
  queue: Track[]
  /** Catálogo completo cargado desde la biblioteca local. */
  libraryQueue: Track[]
  /** Contexto visual y de navegación de la cola activa. */
  queueContext: QueueContext
  status: PlayerStatus
  /** Nivel de volumen normalizado entre 0 y 1. */
  volume: number
  isMuted: boolean
  /** Posición actual de reproducción en segundos. */
  currentTime: number
  /** Duración total de la pista activa en segundos. */
  duration: number
  repeatMode: RepeatMode
  isShuffle: boolean
  /** Indica si el navegador bloqueó el AudioContext. */
  isAudioBlocked: boolean
  /** Indica si el panel de letras sincronizadas está visible. */
  isLyricsVisible: boolean
  /** Identificadores de pistas marcadas como favoritas. */
  favoriteTrackIds: string[]
  /** Identificadores de pistas ocultas en Todas las canciones. */
  hiddenTrackIds: string[]
}

export type { LyricsLine, ParsedLyrics } from './lyrics'
export type { Playlist } from './playlist'
