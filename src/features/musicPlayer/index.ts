/** Punto de entrada público del módulo del reproductor de música. */
export { MusicLibrary } from './components/MusicLibrary'
export { MusicPlayer } from './components/MusicPlayer'
export { TrackArtBackground } from './components/TrackArtBackground'
export { useLocalMusicLibrary } from './hooks'
export {
  filterTracksBySearchQuery,
  resolveHiddenLibraryTracks,
  resolveTracksByIds,
  resolveVisibleLibraryTracks,
} from './lib'
export {
  audioEngine,
  fetchTrackLyricsContent,
  formatFileSize,
  getLyricsFilename,
  LYRICS_FILE_ACCEPT,
  LYRICS_FORMAT_HINT,
  revokeCoverUrl,
} from './services'
export {
  playerStore,
  toastStore,
  usePlayerStore,
  usePlaylistsStore,
  useToastStore,
} from './store'
export type { Playlist, RepeatMode, Track } from './types'
