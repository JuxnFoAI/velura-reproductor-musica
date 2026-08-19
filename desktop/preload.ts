/** Preload de Electron: marca desktop y expone APIs IPC de la app. */
import { contextBridge, ipcRenderer } from 'electron'
import {
  DESKTOP_ISLAND_IPC_CHANNELS,
  DESKTOP_WINDOW_IPC_CHANNELS,
  type DesktopIslandCommand,
  type DesktopIslandStateSnapshot,
  type DesktopIslandWindowShapeRect,
} from '../shared/desktop'
import {
  buildVeluraMediaUrl,
  MUSIC_LIBRARY_IPC_CHANNELS,
  type DeleteTrackRequest,
  type DeleteTrackResponse,
  type MusicLibraryResponse,
  type RenameTrackRequest,
  type RenameTrackResponse,
  type SaveTrackCoverRequest,
  type SaveTrackCoverResponse,
  type SaveTrackLyricsRequest,
  type SaveTrackLyricsResponse,
} from '../shared/musicLibrary'

const veluraMusicLibrary = {
  getTracks(): Promise<MusicLibraryResponse> {
    return ipcRenderer.invoke(MUSIC_LIBRARY_IPC_CHANNELS.getTracks)
  },

  saveTrackCover(payload: SaveTrackCoverRequest): Promise<SaveTrackCoverResponse> {
    return ipcRenderer.invoke(MUSIC_LIBRARY_IPC_CHANNELS.saveCover, payload)
  },

  saveTrackLyrics(payload: SaveTrackLyricsRequest): Promise<SaveTrackLyricsResponse> {
    return ipcRenderer.invoke(MUSIC_LIBRARY_IPC_CHANNELS.saveLyrics, payload)
  },

  renameTrack(payload: RenameTrackRequest): Promise<RenameTrackResponse> {
    return ipcRenderer.invoke(MUSIC_LIBRARY_IPC_CHANNELS.renameTrack, payload)
  },

  deleteTrack(payload: DeleteTrackRequest): Promise<DeleteTrackResponse> {
    return ipcRenderer.invoke(MUSIC_LIBRARY_IPC_CHANNELS.deleteTrack, payload)
  },

  buildAudioUrl(relativePath: string): string {
    return buildVeluraMediaUrl('audio', relativePath)
  },

  buildCoverUrl(relativePath: string, cacheBust?: number): string {
    return buildVeluraMediaUrl('cover', relativePath, cacheBust)
  },

  buildLyricsUrl(relativePath: string, cacheBust?: number): string {
    return buildVeluraMediaUrl('lyrics', relativePath, cacheBust)
  },
}

const veluraDesktopWindow = {
  toggleFullscreen(): Promise<boolean> {
    return ipcRenderer.invoke(DESKTOP_WINDOW_IPC_CHANNELS.toggleFullscreen)
  },

  getFullscreen(): Promise<boolean> {
    return ipcRenderer.invoke(DESKTOP_WINDOW_IPC_CHANNELS.getFullscreen)
  },

  onFullscreenChange(listener: (isFullscreen: boolean) => void): () => void {
    const handler = (_event: Electron.IpcRendererEvent, isFullscreen: boolean): void => {
      listener(isFullscreen)
    }

    ipcRenderer.on(DESKTOP_WINDOW_IPC_CHANNELS.fullscreenChanged, handler)

    return () => {
      ipcRenderer.removeListener(DESKTOP_WINDOW_IPC_CHANNELS.fullscreenChanged, handler)
    }
  },
}

const veluraDesktopIsland = {
  publishState(snapshot: DesktopIslandStateSnapshot): void {
    ipcRenderer.send(DESKTOP_ISLAND_IPC_CHANNELS.publishState, snapshot)
  },

  requestState(): void {
    ipcRenderer.send(DESKTOP_ISLAND_IPC_CHANNELS.requestState)
  },

  sendCommand(command: DesktopIslandCommand): Promise<void> {
    return ipcRenderer.invoke(DESKTOP_ISLAND_IPC_CHANNELS.sendCommand, command)
  },

  setIgnoreMouseEvents(ignore: boolean): Promise<void> {
    return ipcRenderer.invoke(DESKTOP_ISLAND_IPC_CHANNELS.setIgnoreMouse, ignore)
  },

  setWindowShape(rects: DesktopIslandWindowShapeRect[]): void {
    ipcRenderer.send(DESKTOP_ISLAND_IPC_CHANNELS.setWindowShape, rects)
  },

  onState(listener: (snapshot: DesktopIslandStateSnapshot) => void): () => void {
    const handler = (
      _event: Electron.IpcRendererEvent,
      snapshot: DesktopIslandStateSnapshot,
    ): void => {
      listener(snapshot)
    }

    ipcRenderer.on(DESKTOP_ISLAND_IPC_CHANNELS.stateChanged, handler)

    return () => {
      ipcRenderer.removeListener(DESKTOP_ISLAND_IPC_CHANNELS.stateChanged, handler)
    }
  },

  onCommand(listener: (command: DesktopIslandCommand) => void): () => void {
    const handler = (
      _event: Electron.IpcRendererEvent,
      command: DesktopIslandCommand,
    ): void => {
      listener(command)
    }

    ipcRenderer.on(DESKTOP_ISLAND_IPC_CHANNELS.dispatchCommand, handler)

    return () => {
      ipcRenderer.removeListener(DESKTOP_ISLAND_IPC_CHANNELS.dispatchCommand, handler)
    }
  },
}

contextBridge.exposeInMainWorld('__REPRODUCTOR_DESKTOP__', true)
contextBridge.exposeInMainWorld('veluraMusicLibrary', veluraMusicLibrary)
contextBridge.exposeInMainWorld('veluraDesktopWindow', veluraDesktopWindow)
contextBridge.exposeInMainWorld('veluraDesktopIsland', veluraDesktopIsland)
