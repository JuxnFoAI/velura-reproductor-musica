/** Lógica de biblioteca musical en disco, compartida entre Vite y Electron. */

export { buildMusicLibrary } from './indexMusicLibrary'
export { saveTrackCover, resolveCoverContentType } from './saveTrackCover'
export { saveTrackLyrics, readTrackLyricsFromDisk } from './saveTrackLyrics'
export { deleteTrack } from './deleteTrack'
export { renameTrack } from './renameTrack'

export {
  resolveSafeAudioPath,
  resolveSafeCoverPath,
  resolveSafeLyricsPath,
} from './safePaths'

export type {
  DeleteTrackRequest,
  DeleteTrackResponse,
  MusicFileEntry,
  MusicLibraryResponse,
  RenameTrackRequest,
  RenameTrackResponse,
  SaveTrackCoverRequest,
  SaveTrackCoverResponse,
  SaveTrackLyricsRequest,
  SaveTrackLyricsResponse,
} from './types'

export {
  COVER_EXTENSIONS,
  LYRICS_EXTENSIONS,
  MP3_EXTENSION,
  MUSIC_LIBRARY_ENDPOINTS,
} from './constants'

export {
  COVER_OVERRIDES_EXAMPLE_FILENAME,
  COVERS_DIRECTORY,
  EXAMPLE_DIRECTORY_NAME,
  LYRICS_DIRECTORY,
  ensureMusicDirectoryStructure,
  ensureProjectMusicDirectory,
  PROJECT_MUSIC_DIRECTORY_NAME,
  resolveProjectRootFromModule,
  resolveVeluraUserMusicDirectory,
  VELURA_APP_FOLDER_NAME,
} from './musicDirectoryResolver'

export { loadCoverOverrides, COVER_OVERRIDES_FILENAME } from './loadCoverOverrides'

export type { MusicLibraryResult } from './result'
