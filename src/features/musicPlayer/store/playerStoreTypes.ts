/** Tipos del store Zustand del reproductor (estado + acciones). */
import type { StoreApi } from 'zustand'
import type { PlayerState, RepeatMode, Track } from '../types'

export interface PlayerActions {
  loadLibraryTracks: (tracks: Track[]) => void
  updateTrackDurations: (tracks: Track[]) => void
  restoreSession: () => Promise<void>
  play: (track?: Track) => void
  playFavoritesList: () => void
  pause: () => void
  stop: () => void
  next: (options?: { wrapQueue?: boolean }) => void
  previous: () => void
  seek: (time: number) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  toggleShuffle: () => void
  toggleLyrics: () => void
  toggleFavorite: () => void
  hideTrack: (trackId: string) => void
  showTrack: (trackId: string) => void
  deleteTrack: (trackId: string) => void
  setRepeatMode: (mode: RepeatMode) => void
  updateTrackCover: (trackId: string, coverUrl: string) => void
  updateTrackMetadata: (
    trackId: string,
    metadata: { title?: string; artist?: string },
  ) => void
  attachTrackLyrics: (trackId: string, lyricsFile: File) => void
  saveTrackLyricsContent: (trackId: string, lyricsContent: string) => Promise<void>
  resumeAudio: () => Promise<void>
}

export interface LyricsRevisionState {
  /** Contador por pista para invalidar la caché de letras tras editar el archivo. */
  lyricsContentRevisions: Record<string, number>
}

export type PlayerStore = PlayerState & PlayerActions & LyricsRevisionState

export type PlayerStoreSet = StoreApi<PlayerStore>['setState']
export type PlayerStoreGet = StoreApi<PlayerStore>['getState']
