/** Constantes compartidas de indexación y assets de la biblioteca musical. */

export const MP3_EXTENSION = '.mp3'

export const COVER_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const

export const LYRICS_EXTENSIONS = ['.txt', '.lrc'] as const

export type LyricsExtension = (typeof LYRICS_EXTENSIONS)[number]

export const MUSIC_LIBRARY_ENDPOINTS = {
  tracks: '/api/music/tracks',
  track: '/api/music/track',
  audio: '/api/music/audio',
  cover: '/api/music/cover',
  lyrics: '/api/music/lyrics',
} as const
