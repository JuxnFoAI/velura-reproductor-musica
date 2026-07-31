/** Tipos compartidos de la biblioteca musical local (Vite y Electron). */

export interface MusicFileEntry {
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

export interface MusicLibraryResponse {
  musicDirectory: string | null
  tracks: MusicFileEntry[]
}

export interface SaveTrackCoverRequest {
  trackRelativePath: string
  coverRelativePath: string | null
  imageDataUrl: string
}

export interface SaveTrackCoverResponse {
  coverRelativePath: string
}

export interface RenameTrackRequest {
  trackRelativePath: string
  title: string
  artist: string
  coverRelativePath: string | null
}

export interface RenameTrackResponse {
  id: string
  relativePath: string
  filename: string
  title: string
  artist: string
  coverRelativePath: string | null
  lyricsRelativePath: string | null
}

export interface DeleteTrackRequest {
  trackRelativePath: string
  coverRelativePath: string | null
  lyricsRelativePath: string | null
}

export interface DeleteTrackResponse {
  deletedTrackRelativePath: string
  deletedCoverCount: number
  deletedLyricsCount: number
}

export type LyricsExtension = '.txt' | '.lrc'

export interface SaveTrackLyricsRequest {
  trackRelativePath: string
  lyricsContent: string
  lyricsExtension: LyricsExtension
  existingLyricsRelativePath?: string | null
  sourceLyricsFilename?: string | null
}

export interface SaveTrackLyricsResponse {
  lyricsRelativePath: string
}
