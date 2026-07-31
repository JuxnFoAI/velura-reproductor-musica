/** Tipos globales inyectados por el preload de Electron. */
import type {
  DeleteTrackRequest,
  DeleteTrackResponse,
  MusicLibraryResponse,
  RenameTrackRequest,
  RenameTrackResponse,
  SaveTrackCoverRequest,
  SaveTrackCoverResponse,
  SaveTrackLyricsRequest,
  SaveTrackLyricsResponse,
} from '../../shared/musicLibrary/types'

export interface VeluraMusicLibraryBridge {
  getTracks(): Promise<MusicLibraryResponse>
  saveTrackCover(payload: SaveTrackCoverRequest): Promise<SaveTrackCoverResponse>
  saveTrackLyrics(payload: SaveTrackLyricsRequest): Promise<SaveTrackLyricsResponse>
  renameTrack(payload: RenameTrackRequest): Promise<RenameTrackResponse>
  deleteTrack(payload: DeleteTrackRequest): Promise<DeleteTrackResponse>
  buildAudioUrl(relativePath: string): string
  buildCoverUrl(relativePath: string, cacheBust?: number): string
  buildLyricsUrl(relativePath: string, cacheBust?: number): string
}

export interface VeluraDesktopWindowBridge {
  toggleFullscreen(): Promise<boolean>
  getFullscreen(): Promise<boolean>
  onFullscreenChange(listener: (isFullscreen: boolean) => void): () => void
}

declare global {
  interface Window {
    /** Marcador inyectado por el preload de la app de escritorio. */
    __REPRODUCTOR_DESKTOP__?: boolean
    /** API IPC de biblioteca musical; solo disponible en Electron. */
    veluraMusicLibrary?: VeluraMusicLibraryBridge
    /** API IPC de ventana; solo disponible en Electron. */
    veluraDesktopWindow?: VeluraDesktopWindowBridge
  }
}

export {}
