/** Registra handlers IPC equivalentes a los endpoints HTTP /api/music/*. */
import { ipcMain } from 'electron'
import {
  buildMusicLibrary,
  deleteTrack,
  MUSIC_LIBRARY_IPC_CHANNELS,
  renameTrack,
  saveTrackCover,
  saveTrackLyrics,
  validateCoverImageDataUrlSize,
  validateLyricsContentSize,
  type DeleteTrackRequest,
  type MusicLibraryResult,
  type RenameTrackRequest,
  type SaveTrackCoverRequest,
  type SaveTrackLyricsRequest,
} from '../../shared/musicLibrary/node'
import { getElectronMusicDirectory } from '../musicDirectory'
import { assertMainWindowSender } from '../security/ipcMainWindowGuard'

function unwrapMusicLibraryResult<T>(result: MusicLibraryResult<T>): T {
  if (!result.ok) {
    throw Object.assign(new Error(result.message), { status: result.status })
  }

  return result.data
}

/** Enlaza los canales IPC con las funciones del módulo compartido. */
export function registerMusicLibraryIpc(): void {
  ipcMain.handle(MUSIC_LIBRARY_IPC_CHANNELS.getTracks, async (event) => {
    assertMainWindowSender(event)
    return buildMusicLibrary(getElectronMusicDirectory())
  })

  ipcMain.handle(
    MUSIC_LIBRARY_IPC_CHANNELS.saveCover,
    async (event, payload: SaveTrackCoverRequest) => {
      assertMainWindowSender(event)

      const coverSizeError = validateCoverImageDataUrlSize(payload?.imageDataUrl ?? '')
      if (coverSizeError) {
        return unwrapMusicLibraryResult(coverSizeError)
      }

      return unwrapMusicLibraryResult(saveTrackCover(getElectronMusicDirectory(), payload))
    },
  )

  ipcMain.handle(
    MUSIC_LIBRARY_IPC_CHANNELS.saveLyrics,
    async (event, payload: SaveTrackLyricsRequest) => {
      assertMainWindowSender(event)

      const lyricsSizeError = validateLyricsContentSize(payload?.lyricsContent ?? '')
      if (lyricsSizeError) {
        return unwrapMusicLibraryResult(lyricsSizeError)
      }

      return unwrapMusicLibraryResult(saveTrackLyrics(getElectronMusicDirectory(), payload))
    },
  )

  ipcMain.handle(
    MUSIC_LIBRARY_IPC_CHANNELS.renameTrack,
    async (event, payload: RenameTrackRequest) => {
      assertMainWindowSender(event)
      return unwrapMusicLibraryResult(renameTrack(getElectronMusicDirectory(), payload))
    },
  )

  ipcMain.handle(
    MUSIC_LIBRARY_IPC_CHANNELS.deleteTrack,
    async (event, payload: DeleteTrackRequest) => {
      assertMainWindowSender(event)
      return unwrapMusicLibraryResult(deleteTrack(getElectronMusicDirectory(), payload))
    },
  )
}
