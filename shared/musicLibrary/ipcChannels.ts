/** Canales IPC y esquema de medios para la biblioteca musical en Electron. */

export const VELURA_MEDIA_SCHEME = 'velura-media'

export const MUSIC_LIBRARY_IPC_CHANNELS = {
  getTracks: 'velura:music:get-tracks',
  saveCover: 'velura:music:save-cover',
  saveLyrics: 'velura:music:save-lyrics',
  renameTrack: 'velura:music:rename-track',
  deleteTrack: 'velura:music:delete-track',
} as const

export type MusicLibraryMediaKind = 'audio' | 'cover' | 'lyrics'
