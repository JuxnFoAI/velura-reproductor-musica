/** Store global de Zustand para el estado y acciones del reproductor. */
import { create, type StoreApi } from 'zustand'
import type {
  PlayerState,
  RepeatMode,
  Track,
} from '../types'
import {
  AUDIO_CONTEXT_BLOCKED_ERROR,
  audioEngine,
} from '../services/audioEngine'
import { revokeCoverUrl, revokeTrackResources } from '../services/fileService'
import {
  clearPersistedSession,
  loadPersistedSession,
  loadPersistedSettings,
  savePersistedSession,
  savePersistedSettings,
  type PersistedPlaybackStatus,
} from '../services/persistenceService'
import {
  deleteTrackFromLibrary,
  renameTrackInLibrary,
  saveTrackCoverToLibrary,
  saveTrackLyricsToLibrary,
} from '../services/localMusicLibraryService'
import {
  isValidLyricsFile,
  readLyricsFile,
  resolveLyricsExtension,
  resolveLyricsExtensionFromRelativePath,
} from '../services/lyricsFileService'
import { toastStore } from './toastStore'
import { resolveVisibleLibraryTracks } from '../lib/resolveVisibleLibraryTracks'
import {
  consumePreviousTrack,
  getNavigationState,
  getNextTrack,
  getNextTrackAfterFailure,
  isEngineSyncedWithTrack,
  pushTrackHistory,
  resetTrackHistory,
  resolveFavoriteTracks,
  resolveLibraryPlaybackQueue,
  syncActiveQueueWithLibrary,
} from './playerQueueLogic'

const DEFAULT_VOLUME = 0.8
const DEFAULT_REPEAT_MODE: RepeatMode = 'none'
const RESTART_THRESHOLD_SECONDS = 3
const TRACK_FADE_MS = 200
const TRACK_END_TOLERANCE_SECONDS = 0.25
const SESSION_PERSIST_INTERVAL_MS = 5000

let isRepeatingCurrentTrack = false
let lastSessionPersistAt = 0
let playbackRequestId = 0
let shouldAutoPlayAfterTrackChange = false

function beginPlaybackRequest(): number {
  playbackRequestId += 1
  return playbackRequestId
}

function isStalePlaybackRequest(requestId: number): boolean {
  return requestId !== playbackRequestId
}

/**
 * Conserva la intención de reproducir o pausar al saltar de pista.
 * Si la cola estaba sonando, el salto sigue en play; si estaba en pausa, permanece en pausa.
 */
function resolveAutoPlayAfterTrackChange(state: PlayerState): boolean {
  if (state.status === 'playing' || audioEngine.isPlayingActive()) {
    shouldAutoPlayAfterTrackChange = true
    return true
  }

  if (state.status === 'paused' || state.status === 'idle') {
    shouldAutoPlayAfterTrackChange = false
    return false
  }

  return shouldAutoPlayAfterTrackChange
}

interface PlayerActions {
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

interface LyricsRevisionState {
  /** Contador por pista para invalidar la caché de letras tras editar el archivo. */
  lyricsContentRevisions: Record<string, number>
}

type PlayerStore = PlayerState & PlayerActions & LyricsRevisionState

function createInitialState(): PlayerState {
  const persisted = loadPersistedSettings()

  return {
    currentTrack: null,
    queue: [],
    libraryQueue: [],
    queueContext: 'library',
    status: 'idle',
    volume: persisted.volume ?? DEFAULT_VOLUME,
    isMuted: false,
    currentTime: 0,
    duration: 0,
    repeatMode: DEFAULT_REPEAT_MODE,
    isShuffle: false,
    isAudioBlocked: false,
    isLyricsVisible: false,
    favoriteTrackIds: persisted.favoriteTrackIds ?? [],
    hiddenTrackIds: persisted.hiddenTrackIds ?? [],
  }
}

function clampVolume(volume: number): number {
  return Math.max(0, Math.min(volume, 1))
}

function revokeQueueUrls(queue: Track[]): void {
  queue.forEach((track) => revokeTrackResources(track))
}

function isSameTrackLibrary(currentQueue: Track[], nextQueue: Track[]): boolean {
  if (currentQueue.length !== nextQueue.length) {
    return false
  }

  if (currentQueue.length === 0) {
    return true
  }

  return currentQueue.every((track, index) => track.id === nextQueue[index]?.id)
}

function updateTrackCoverInList(
  tracks: Track[],
  trackId: string,
  coverUrl: string,
  coverRelativePath?: string | null,
): Track[] {
  return tracks.map((track) => {
    if (track.id !== trackId) {
      return track
    }

    return {
      ...track,
      coverUrl,
      ...(coverRelativePath !== undefined ? { coverRelativePath } : {}),
    }
  })
}

function updateTrackCoverInState(
  set: StoreApi<PlayerStore>['setState'],
  trackId: string,
  coverUrl: string,
  coverRelativePath?: string | null,
): void {
  set((currentState) => ({
    ...currentState,
    queue: updateTrackCoverInList(currentState.queue, trackId, coverUrl, coverRelativePath),
    libraryQueue: updateTrackCoverInList(
      currentState.libraryQueue,
      trackId,
      coverUrl,
      coverRelativePath,
    ),
    currentTrack:
      currentState.currentTrack?.id === trackId
        ? {
            ...currentState.currentTrack,
            coverUrl,
            ...(coverRelativePath !== undefined
              ? { coverRelativePath }
              : {}),
          }
        : currentState.currentTrack,
  }))
}

function updateTrackLyricsInList(
  tracks: Track[],
  trackId: string,
  lyricsRelativePath: string,
): Track[] {
  return tracks.map((track) => {
    if (track.id !== trackId) {
      return track
    }

    return {
      ...track,
      lyricsRelativePath,
    }
  })
}

function updateTrackLyricsInState(
  set: StoreApi<PlayerStore>['setState'],
  trackId: string,
  lyricsRelativePath: string,
): void {
  set((currentState) => ({
    ...currentState,
    queue: updateTrackLyricsInList(currentState.queue, trackId, lyricsRelativePath),
    libraryQueue: updateTrackLyricsInList(
      currentState.libraryQueue,
      trackId,
      lyricsRelativePath,
    ),
    currentTrack:
      currentState.currentTrack?.id === trackId
        ? {
            ...currentState.currentTrack,
            lyricsRelativePath,
          }
        : currentState.currentTrack,
  }))
}

function bumpLyricsContentRevision(
  set: StoreApi<PlayerStore>['setState'],
  trackId: string,
): void {
  set((currentState) => ({
    ...currentState,
    lyricsContentRevisions: {
      ...currentState.lyricsContentRevisions,
      [trackId]: (currentState.lyricsContentRevisions[trackId] ?? 0) + 1,
    },
  }))
}

function replaceTrackInState(
  set: StoreApi<PlayerStore>['setState'],
  previousTrackId: string,
  nextTrack: Track,
): void {
  set((currentState) => ({
    ...currentState,
    queue: currentState.queue.map((track) =>
      track.id === previousTrackId ? nextTrack : track,
    ),
    libraryQueue: currentState.libraryQueue.map((track) =>
      track.id === previousTrackId ? nextTrack : track,
    ),
    currentTrack:
      currentState.currentTrack?.id === previousTrackId
        ? nextTrack
        : currentState.currentTrack,
  }))
}

function removeTrackFromState(
  set: StoreApi<PlayerStore>['setState'],
  get: StoreApi<PlayerStore>['getState'],
  trackId: string,
  deletedTrack: Track,
): void {
  const state = get()
  const isCurrentTrack = state.currentTrack?.id === trackId

  if (isCurrentTrack) {
    audioEngine.stop()
    clearPersistedSession()
  }

  revokeTrackResources(deletedTrack)

  const nextLibraryQueue = state.libraryQueue.filter((track) => track.id !== trackId)
  const nextFavoriteTrackIds = state.favoriteTrackIds.filter((id) => id !== trackId)
  const nextHiddenTrackIds = state.hiddenTrackIds.filter((id) => id !== trackId)
  const nextQueue =
    state.queueContext === 'favorites'
      ? resolveFavoriteTracks({
          ...state,
          libraryQueue: nextLibraryQueue,
          favoriteTrackIds: nextFavoriteTrackIds,
        })
      : nextLibraryQueue

  const nextLyricsRevisions = { ...state.lyricsContentRevisions }
  delete nextLyricsRevisions[trackId]

  set({
    libraryQueue: nextLibraryQueue,
    queue: nextQueue,
    favoriteTrackIds: nextFavoriteTrackIds,
    hiddenTrackIds: nextHiddenTrackIds,
    lyricsContentRevisions: nextLyricsRevisions,
    ...(isCurrentTrack
      ? {
          currentTrack: null,
          status: 'idle',
          currentTime: 0,
          duration: 0,
          isLyricsVisible: false,
        }
      : {}),
  })

  persistSettings({
    ...get(),
    favoriteTrackIds: nextFavoriteTrackIds,
    hiddenTrackIds: nextHiddenTrackIds,
  })
}

async function syncAudioAfterTrackRename(
  get: StoreApi<PlayerStore>['getState'],
  set: StoreApi<PlayerStore>['setState'],
  renamedTrack: Track,
): Promise<void> {
  const state = get()

  if (state.currentTrack?.id !== renamedTrack.id) {
    return
  }

  const wasPlaying = state.status === 'playing'
  const preservedTime = state.currentTime

  try {
    const loaded = await audioEngine.loadTrack(renamedTrack)

    if (!loaded) {
      return
    }

    await audioEngine.seek(preservedTime)

    if (wasPlaying) {
      await audioEngine.playWithFadeIn(TRACK_FADE_MS)
    }

    set((currentState) => ({
      ...currentState,
      status: wasPlaying ? 'playing' : currentState.status,
    }))
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'No se pudo recargar la pista renombrada.'

    showErrorToast(message)
  }
}

function syncAudioSettings(state: PlayerState): void {
  audioEngine.setVolume(state.volume)
  audioEngine.setMuted(state.isMuted)
}

function isAudioContextBlockedError(message: string): boolean {
  return message.includes(AUDIO_CONTEXT_BLOCKED_ERROR)
}

function showErrorToast(message: string): void {
  toastStore.getState().addToast({ type: 'error', message })
}

function resolveMetadataUpdateSuccessMessage(
  metadata: { title?: string; artist?: string },
): string {
  if (metadata.title !== undefined && metadata.artist !== undefined) {
    return 'Información de la canción actualizada correctamente.'
  }

  if (metadata.title !== undefined) {
    return 'Nombre de la canción actualizado correctamente.'
  }

  return 'Nombre del artista actualizado correctamente.'
}

function persistSettings(state: PlayerState): void {
  savePersistedSettings({
    volume: state.volume,
    favoriteTrackIds: state.favoriteTrackIds,
    hiddenTrackIds: state.hiddenTrackIds,
  })
}

function resolvePersistedPlaybackStatus(status: PlayerState['status']): PersistedPlaybackStatus {
  return status === 'playing' ? 'playing' : 'paused'
}

function persistCurrentSession(get: StoreApi<PlayerStore>['getState']): void {
  const state = get()
  const relativePath = state.currentTrack?.relativePath

  if (!relativePath || state.status === 'loading' || !state.currentTrack) {
    return
  }

  savePersistedSession({
    trackRelativePath: relativePath,
    currentTime: state.currentTime,
    status: resolvePersistedPlaybackStatus(state.status),
    isLyricsVisible: state.isLyricsVisible,
  })
}

function persistCurrentSessionThrottled(get: StoreApi<PlayerStore>['getState']): void {
  const now = Date.now()

  if (now - lastSessionPersistAt < SESSION_PERSIST_INTERVAL_MS) {
    return
  }

  lastSessionPersistAt = now
  persistCurrentSession(get)
}

async function handlePlaybackFailure(
  error: unknown,
  failedTrack: Track,
  set: StoreApi<PlayerStore>['setState'],
  get: StoreApi<PlayerStore>['getState'],
): Promise<void> {
  const message = error instanceof Error ? error.message : 'Error de reproducción desconocido'

  if (isAudioContextBlockedError(message)) {
    showErrorToast(
      'El navegador bloqueó el audio. Haz clic en "Activar audio" para continuar.',
    )
    set((state) => ({
      ...state,
      status: 'paused',
      isAudioBlocked: true,
    }))
    return
  }

  showErrorToast(`No se pudo reproducir "${failedTrack.title}". Pasando a la siguiente.`)

  const state = get()
  const nextTrack = getNextTrackAfterFailure(state, failedTrack.id)

  if (nextTrack && nextTrack.id !== failedTrack.id) {
    await loadAndPlayTrack(nextTrack, set, get, { skipFadeOut: true })
    return
  }

  audioEngine.stop()
  set((currentState) => ({
    ...currentState,
    status: 'idle',
    currentTrack: null,
    currentTime: 0,
    duration: 0,
  }))
  clearPersistedSession()
}

/** Reinicia la pista actual al inicio, ignorando el seek si ya hubo otro salto. */
async function restartCurrentTrackFromStart(
  requestId: number,
  set: StoreApi<PlayerStore>['setState'],
): Promise<void> {
  set((currentState) => ({ ...currentState, currentTime: 0 }))
  await audioEngine.seek(0)

  if (isStalePlaybackRequest(requestId)) {
    return
  }

  set((currentState) => ({ ...currentState, currentTime: 0 }))
}

async function repeatCurrentTrack(
  set: StoreApi<PlayerStore>['setState'],
  get: StoreApi<PlayerStore>['getState'],
): Promise<void> {
  if (isRepeatingCurrentTrack) {
    return
  }

  const state = get()

  if (!state.currentTrack) {
    return
  }

  isRepeatingCurrentTrack = true

  try {
    syncAudioSettings(state)
    await audioEngine.replayFromStart()
    set((currentState) => ({
      ...currentState,
      status: 'playing',
      currentTime: 0,
      isAudioBlocked: false,
    }))
  } catch (error) {
    await handlePlaybackFailure(error, state.currentTrack, set, get)
  } finally {
    isRepeatingCurrentTrack = false
  }
}

function hasReachedTrackEnd(currentTime: number, duration: number): boolean {
  return duration > 0 && currentTime >= duration - TRACK_END_TOLERANCE_SECONDS
}

function shouldRecoverRepeatAfterPlaybackStop(state: PlayerState): boolean {
  return (
    state.repeatMode === 'one' &&
    state.currentTrack !== null &&
    state.status === 'playing' &&
    hasReachedTrackEnd(state.currentTime, state.duration)
  )
}

function handleTrackEnd(
  set: StoreApi<PlayerStore>['setState'],
  get: StoreApi<PlayerStore>['getState'],
): void {
  const state = get()

  if (state.repeatMode === 'one' && state.currentTrack) {
    void repeatCurrentTrack(set, get)
    return
  }

  get().next()
}

async function loadAndRestoreTrack(
  track: Track,
  savedTime: number,
  isLyricsVisible: boolean,
  set: StoreApi<PlayerStore>['setState'],
  get: StoreApi<PlayerStore>['getState'],
): Promise<void> {
  const requestId = beginPlaybackRequest()
  let restoredTime = Math.max(0, savedTime)

  set((state) => ({
    ...state,
    status: 'loading',
    currentTrack: track,
    duration: track.duration,
    currentTime: 0,
    isLyricsVisible,
  }))
  pushTrackHistory(track.id)

  try {
    const loaded = await audioEngine.loadTrack(track)

    if (!loaded || isStalePlaybackRequest(requestId)) {
      return
    }

    if (!audioEngine.hasLoadedBuffer()) {
      throw new Error('El archivo de audio no pudo decodificarse')
    }

    const decodedDuration = audioEngine.getLoadedDuration()
    const effectiveDuration = track.duration > 0 ? track.duration : decodedDuration
    const clampedTime =
      effectiveDuration > 0
        ? Math.max(0, Math.min(savedTime, effectiveDuration))
        : Math.max(0, savedTime)
    restoredTime = clampedTime
    const restoredTrack =
      effectiveDuration > 0 && track.duration !== effectiveDuration
        ? { ...track, duration: effectiveDuration }
        : track

    syncAudioSettings(get())

    if (isStalePlaybackRequest(requestId)) {
      return
    }

    await audioEngine.seek(clampedTime)

    if (isStalePlaybackRequest(requestId)) {
      return
    }

    set((state) => ({
      ...state,
      status: 'paused',
      currentTrack: restoredTrack,
      duration: effectiveDuration,
      currentTime: clampedTime,
      queue: state.queue.map((queueTrack) =>
        queueTrack.id === restoredTrack.id ? restoredTrack : queueTrack,
      ),
      libraryQueue: state.libraryQueue.map((queueTrack) =>
        queueTrack.id === restoredTrack.id ? restoredTrack : queueTrack,
      ),
    }))

    persistCurrentSession(get)
  } catch (error) {
    clearPersistedSession()
    audioEngine.stop()
    set((state) => ({
      ...state,
      status: 'idle',
      currentTrack: null,
      currentTime: 0,
      duration: 0,
      isLyricsVisible: false,
    }))

    const message =
      error instanceof Error ? error.message : 'No se pudo restaurar la sesión anterior.'

    if (isAudioContextBlockedError(message)) {
      showErrorToast(
        'El navegador bloqueó el audio. Haz clic en "Activar audio" para continuar.',
      )
      set((state) => ({
        ...state,
        currentTrack: track,
        duration: track.duration,
        currentTime: restoredTime,
        status: 'paused',
        isLyricsVisible,
        isAudioBlocked: true,
      }))
      persistCurrentSession(get)
      return
    }

    showErrorToast(message)
  }
}

async function loadAndPlayTrack(
  track: Track,
  set: StoreApi<PlayerStore>['setState'],
  get: StoreApi<PlayerStore>['getState'],
  options: { skipFadeOut?: boolean; requestId?: number; autoPlay?: boolean } = {},
): Promise<void> {
  const requestId = options.requestId ?? beginPlaybackRequest()
  const shouldAutoPlay = options.autoPlay !== false
  const previousStatus = get().status
  const shouldFadeOut =
    !options.skipFadeOut &&
    (previousStatus === 'playing' || previousStatus === 'paused') &&
    get().currentTrack !== null

  set((state) => ({
    ...state,
    status: 'loading',
    currentTrack: track,
    duration: track.duration,
    currentTime: 0,
  }))
  pushTrackHistory(track.id)

  try {
    if (shouldFadeOut) {
      await audioEngine.fadeOutAndPause(TRACK_FADE_MS)

      if (isStalePlaybackRequest(requestId)) {
        return
      }
    }

    const loaded = await audioEngine.loadTrack(track)

    if (!loaded || isStalePlaybackRequest(requestId)) {
      return
    }

    if (!audioEngine.hasLoadedBuffer()) {
      throw new Error('El archivo de audio no pudo decodificarse')
    }

    await commitLoadedTrack(requestId, shouldAutoPlay, set, get)
  } catch (error) {
    if (isStalePlaybackRequest(requestId)) {
      return
    }

    await handlePlaybackFailure(error, track, set, get)
  }
}

/** Aplica la pista ya decodificada: la reproduce o la deja en pausa según el salto. */
async function commitLoadedTrack(
  requestId: number,
  shouldAutoPlay: boolean,
  set: StoreApi<PlayerStore>['setState'],
  get: StoreApi<PlayerStore>['getState'],
): Promise<void> {
  syncAudioSettings(get())

  if (isStalePlaybackRequest(requestId)) {
    return
  }

  if (!shouldAutoPlay) {
    set((state) => ({ ...state, status: 'paused', isAudioBlocked: false }))
    persistCurrentSession(get)
    return
  }

  await audioEngine.playWithFadeIn(TRACK_FADE_MS)

  if (isStalePlaybackRequest(requestId)) {
    audioEngine.stop()
    return
  }

  set((state) => ({ ...state, status: 'playing', isAudioBlocked: false }))
  persistCurrentSession(get)
}

/**
 * Reanuda la pista visible. Si el motor aún tiene otra, la recarga antes de dar play.
 */
async function resumeOrReloadCurrentTrack(
  track: Track,
  set: StoreApi<PlayerStore>['setState'],
  get: StoreApi<PlayerStore>['getState'],
): Promise<void> {
  const state = get()
  const isSyncedAndPlaying =
    state.status === 'playing' &&
    audioEngine.isPlayingActive() &&
    isEngineSyncedWithTrack(track)

  if (isSyncedAndPlaying) {
    return
  }

  if (state.status === 'loading' || !isEngineSyncedWithTrack(track)) {
    await loadAndPlayTrack(track, set, get, { requestId: beginPlaybackRequest() })
    return
  }

  await resumeSyncedTrack(track, state, set, get)
}

/** Reanuda una pista que ya coincide con el buffer del motor. */
async function resumeSyncedTrack(
  track: Track,
  state: PlayerState,
  set: StoreApi<PlayerStore>['setState'],
  get: StoreApi<PlayerStore>['getState'],
): Promise<void> {
  try {
    syncAudioSettings(get())

    if (state.status === 'playing' && !audioEngine.isPlayingActive()) {
      if (state.repeatMode === 'one' && hasReachedTrackEnd(state.currentTime, state.duration)) {
        await repeatCurrentTrack(set, get)
        return
      }

      await audioEngine.play()
    } else {
      await audioEngine.playWithFadeIn(TRACK_FADE_MS)
    }

    set((currentState) => ({ ...currentState, status: 'playing', isAudioBlocked: false }))
    persistCurrentSession(get)
  } catch (error) {
    await handlePlaybackFailure(error, track, set, get)
  }
}

function initializeAudioEngine(state: PlayerState): void {
  syncAudioSettings(state)
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  ...createInitialState(),
  lyricsContentRevisions: {},

  loadLibraryTracks: (tracks) => {
    const state = get()

    if (isSameTrackLibrary(state.libraryQueue, tracks)) {
      set((currentState) => {
        const visibleLibraryQueue = resolveVisibleLibraryTracks(
          tracks,
          currentState.hiddenTrackIds,
        )

        return {
          ...currentState,
          libraryQueue: tracks,
          queue:
            currentState.queueContext === 'library'
              ? syncActiveQueueWithLibrary(visibleLibraryQueue, currentState.queue)
              : currentState.queue,
        }
      })
      return
    }

    audioEngine.stop()
    revokeQueueUrls(state.libraryQueue)
    resetTrackHistory()

    const visibleLibraryQueue = resolveVisibleLibraryTracks(tracks, state.hiddenTrackIds)

    set((currentState) => ({
      ...currentState,
      libraryQueue: tracks,
      queue: visibleLibraryQueue,
      queueContext: 'library',
      currentTrack: null,
      status: 'idle',
      currentTime: 0,
      duration: 0,
    }))
  },

  updateTrackDurations: (tracks) => {
    const durationById = new Map(tracks.map((track) => [track.id, track.duration]))

    set((state) => {
      const mapTrackDuration = (track: Track): Track => {
        const duration = durationById.get(track.id)

        if (duration === undefined || duration <= 0 || duration === track.duration) {
          return track
        }

        return { ...track, duration }
      }

      const queue = state.queue.map(mapTrackDuration)
      const libraryQueue = state.libraryQueue.map(mapTrackDuration)

      const currentTrack = state.currentTrack
      const nextCurrentDuration =
        currentTrack !== null ? durationById.get(currentTrack.id) : undefined
      const nextCurrentTrack =
        currentTrack !== null &&
        nextCurrentDuration !== undefined &&
        nextCurrentDuration > 0 &&
        nextCurrentDuration !== currentTrack.duration
          ? { ...currentTrack, duration: nextCurrentDuration }
          : currentTrack

      return {
        ...state,
        queue,
        libraryQueue,
        currentTrack: nextCurrentTrack,
        duration:
          nextCurrentTrack !== null &&
          state.currentTrack?.id === nextCurrentTrack.id &&
          nextCurrentDuration !== undefined &&
          nextCurrentDuration > 0
            ? nextCurrentDuration
            : state.duration,
      }
    })
  },

  restoreSession: async () => {
    if (get().currentTrack !== null) {
      return
    }

    const session = loadPersistedSession()

    if (!session) {
      return
    }

    const track = get().libraryQueue.find(
      (queueTrack) => queueTrack.relativePath === session.trackRelativePath,
    )

    if (!track) {
      clearPersistedSession()
      return
    }

    await loadAndRestoreTrack(
      track,
      session.currentTime,
      session.isLyricsVisible,
      set,
      get,
    )
  },

  play: (track) => {
    void (async () => {
      if (get().queue.length === 0 && !track) {
        return
      }

      if (track) {
        const state = get()
        const isTrackInActiveQueue = state.queue.some((queueTrack) => queueTrack.id === track.id)

        if (!isTrackInActiveQueue) {
          resetTrackHistory()
          set({ queue: resolveLibraryPlaybackQueue(state), queueContext: 'library' })
        }

        const requestId = beginPlaybackRequest()
        await loadAndPlayTrack(track, set, get, { requestId })
        return
      }

      const state = get()

      if (!state.currentTrack) {
        const firstTrack = state.queue[0]

        if (firstTrack) {
          await loadAndPlayTrack(firstTrack, set, get)
        }

        return
      }

      await resumeOrReloadCurrentTrack(state.currentTrack, set, get)
    })()
  },

  playFavoritesList: () => {
    void (async () => {
      const favoriteTracks = resolveFavoriteTracks(get())

      if (favoriteTracks.length === 0) {
        return
      }

      resetTrackHistory()
      set({ queue: favoriteTracks, queueContext: 'favorites' })
      await loadAndPlayTrack(favoriteTracks[0], set, get)
    })()
  },

  pause: () => {
    if (!get().currentTrack) {
      return
    }

    audioEngine.pause()
    set((state) => ({ ...state, status: 'paused' }))
    persistCurrentSession(get)
  },

  stop: () => {
    audioEngine.stop()
    clearPersistedSession()
    set((state) => ({
      ...state,
      status: 'idle',
      currentTime: 0,
    }))
  },

  next: (options) => {
    void (async () => {
      const requestId = beginPlaybackRequest()
      const state = get()

      if (!state.currentTrack || state.queue.length === 0) {
        return
      }

      const navigationState = getNavigationState(state)
      const nextTrack = getNextTrack(navigationState, { wrapQueue: options?.wrapQueue })

      if (!nextTrack) {
        audioEngine.stop()
        set((currentState) => ({
          ...currentState,
          status: 'idle',
          currentTime: 0,
        }))
        return
      }

      if (state.repeatMode === 'one' && navigationState.currentTrack?.id === nextTrack.id) {
        await repeatCurrentTrack(set, get)
        return
      }

      await loadAndPlayTrack(nextTrack, set, get, {
        requestId,
        autoPlay: resolveAutoPlayAfterTrackChange(state),
      })
    })()
  },

  previous: () => {
    void (async () => {
      const requestId = beginPlaybackRequest()
      const state = get()

      if (!state.currentTrack || state.queue.length === 0) {
        return
      }

      if (state.currentTime > RESTART_THRESHOLD_SECONDS) {
        await restartCurrentTrackFromStart(requestId, set)
        return
      }

      const previousTrack = consumePreviousTrack(getNavigationState(state))

      if (!previousTrack) {
        await restartCurrentTrackFromStart(requestId, set)
        return
      }

      await loadAndPlayTrack(previousTrack, set, get, {
        requestId,
        autoPlay: resolveAutoPlayAfterTrackChange(state),
      })
    })()
  },

  seek: (time) => {
    void (async () => {
      if (get().queue.length === 0 || !get().currentTrack) {
        return
      }

      try {
        await audioEngine.seek(time)
        set((state) => ({ ...state, currentTime: time }))
        persistCurrentSession(get)
      } catch (error) {
        const currentTrack = get().currentTrack

        if (currentTrack) {
          await handlePlaybackFailure(error, currentTrack, set, get)
        }
      }
    })()
  },

  setVolume: (volume) => {
    if (!get().currentTrack) {
      return
    }

    const normalizedVolume = clampVolume(volume)
    const shouldUnmute = normalizedVolume > 0 && get().isMuted

    audioEngine.setVolume(normalizedVolume)

    if (shouldUnmute) {
      audioEngine.setMuted(false)
    }

    set((state) => {
      const nextState = {
        ...state,
        volume: normalizedVolume,
        ...(shouldUnmute ? { isMuted: false } : {}),
      }
      persistSettings(nextState)
      return nextState
    })
  },

  toggleMute: () => {
    if (!get().currentTrack) {
      return
    }

    set((state) => {
      const isMuted = !state.isMuted
      audioEngine.setMuted(isMuted)
      return { ...state, isMuted }
    })
  },

  toggleShuffle: () => {
    if (!get().currentTrack) {
      return
    }

    set((state) => ({ ...state, isShuffle: !state.isShuffle }))
  },

  toggleLyrics: () => {
    if (!get().currentTrack) {
      return
    }

    set((state) => ({ ...state, isLyricsVisible: !state.isLyricsVisible }))
    persistCurrentSession(get)
  },

  toggleFavorite: () => {
    const { currentTrack, favoriteTrackIds } = get()

    if (!currentTrack) {
      return
    }

    const isFavorite = favoriteTrackIds.includes(currentTrack.id)
    const nextFavoriteTrackIds = isFavorite
      ? favoriteTrackIds.filter((trackId) => trackId !== currentTrack.id)
      : [...favoriteTrackIds, currentTrack.id]

    set({ favoriteTrackIds: nextFavoriteTrackIds })
    persistSettings({ ...get(), favoriteTrackIds: nextFavoriteTrackIds })

    toastStore.getState().addToast({
      type: isFavorite ? 'remove' : 'success',
      message: isFavorite
        ? `"${currentTrack.title}" se quitó de favoritos.`
        : `"${currentTrack.title}" se añadió a favoritos.`,
    })
  },

  hideTrack: (trackId) => {
    const state = get()
    const targetTrack = state.libraryQueue.find((track) => track.id === trackId)

    if (!targetTrack || state.hiddenTrackIds.includes(trackId)) {
      return
    }

    const nextHiddenTrackIds = [...state.hiddenTrackIds, trackId]
    const nextFavoriteTrackIds = state.favoriteTrackIds.filter((id) => id !== trackId)
    const nextQueue =
      state.queueContext === 'library'
        ? resolveVisibleLibraryTracks(state.libraryQueue, nextHiddenTrackIds)
        : state.queue

    set({
      hiddenTrackIds: nextHiddenTrackIds,
      favoriteTrackIds: nextFavoriteTrackIds,
      queue: nextQueue,
    })
    persistSettings({
      ...get(),
      hiddenTrackIds: nextHiddenTrackIds,
      favoriteTrackIds: nextFavoriteTrackIds,
    })

    toastStore.getState().addToast({
      type: 'remove',
      message: `"${targetTrack.title}" se ocultó de la biblioteca.`,
    })
  },

  showTrack: (trackId) => {
    const state = get()
    const targetTrack = state.libraryQueue.find((track) => track.id === trackId)

    if (!targetTrack || !state.hiddenTrackIds.includes(trackId)) {
      return
    }

    const nextHiddenTrackIds = state.hiddenTrackIds.filter((id) => id !== trackId)
    const nextQueue =
      state.queueContext === 'library'
        ? resolveVisibleLibraryTracks(state.libraryQueue, nextHiddenTrackIds)
        : state.queue

    set({ hiddenTrackIds: nextHiddenTrackIds, queue: nextQueue })
    persistSettings({ ...get(), hiddenTrackIds: nextHiddenTrackIds })

    toastStore.getState().addToast({
      type: 'success',
      message: `"${targetTrack.title}" volvió a la biblioteca.`,
    })
  },

  deleteTrack: (trackId) => {
    const state = get()
    const targetTrack = state.libraryQueue.find((track) => track.id === trackId)

    if (!targetTrack) {
      return
    }

    if (!targetTrack.relativePath) {
      showErrorToast('Esta pista no pertenece a la biblioteca local.')
      return
    }

    void deleteTrackFromLibrary({
      relativePath: targetTrack.relativePath,
      coverRelativePath: targetTrack.coverRelativePath,
      lyricsRelativePath: targetTrack.lyricsRelativePath,
    })
      .then(() => {
        removeTrackFromState(set, get, trackId, targetTrack)

        toastStore.getState().addToast({
          type: 'remove',
          message: `"${targetTrack.title}" se eliminó de la biblioteca.`,
        })
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error
            ? error.message
            : 'No se pudo eliminar la canción de la biblioteca.'

        showErrorToast(message)
      })
  },

  setRepeatMode: (mode) => {
    if (!get().currentTrack) {
      return
    }

    set((state) => ({ ...state, repeatMode: mode }))
  },

  updateTrackCover: (trackId, coverUrl) => {
    const state = get()
    const targetTrack = state.libraryQueue.find((track) => track.id === trackId)

    if (!targetTrack) {
      return
    }

    if (!targetTrack.relativePath) {
      showErrorToast('Esta pista no pertenece a la biblioteca local.')
      return
    }

    revokeCoverUrl(targetTrack.coverUrl)
    updateTrackCoverInState(set, trackId, coverUrl)

    void saveTrackCoverToLibrary(
      {
        relativePath: targetTrack.relativePath,
        coverRelativePath: targetTrack.coverRelativePath,
      },
      coverUrl,
    )
      .then(({ coverRelativePath, coverUrl: libraryCoverUrl }) => {
        if (coverUrl.startsWith('blob:')) {
          revokeCoverUrl(coverUrl)
        }

        updateTrackCoverInState(set, trackId, libraryCoverUrl, coverRelativePath)
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error
            ? error.message
            : 'No se pudo guardar la portada permanentemente.'

        showErrorToast(message)
      })
  },

  updateTrackMetadata: (trackId, metadata) => {
    const state = get()
    const targetTrack = state.libraryQueue.find((track) => track.id === trackId)

    if (!targetTrack) {
      return
    }

    if (!targetTrack.relativePath) {
      showErrorToast('Esta pista no pertenece a la biblioteca local.')
      return
    }

    const nextTitle = metadata.title?.trim()
    const nextArtist = metadata.artist?.trim()

    if (nextTitle !== undefined && !nextTitle) {
      showErrorToast('El nombre de la canción no puede estar vacío.')
      return
    }

    if (nextArtist !== undefined && !nextArtist) {
      showErrorToast('El nombre del artista no puede estar vacío.')
      return
    }

    const mergedTitle = nextTitle ?? targetTrack.title
    const mergedArtist = nextArtist ?? targetTrack.artist

    if (mergedTitle === targetTrack.title && mergedArtist === targetTrack.artist) {
      return
    }

    const previousTrackSnapshot = { ...targetTrack }
    const optimisticTrack: Track = {
      ...targetTrack,
      title: mergedTitle,
      artist: mergedArtist,
    }

    replaceTrackInState(set, trackId, optimisticTrack)

    void renameTrackInLibrary({
      relativePath: targetTrack.relativePath,
      title: mergedTitle,
      artist: mergedArtist,
      coverRelativePath: targetTrack.coverRelativePath,
    })
      .then(async (result) => {
        const renamedTrack: Track = {
          ...targetTrack,
          id: result.id,
          title: result.title,
          artist: result.artist,
          relativePath: result.relativePath,
          src: result.src,
          coverRelativePath: result.coverRelativePath,
          coverUrl: result.coverUrl,
          lyricsRelativePath: result.lyricsRelativePath,
        }

        replaceTrackInState(set, trackId, renamedTrack)
        await syncAudioAfterTrackRename(get, set, renamedTrack)

        toastStore.getState().addToast({
          type: 'success',
          message: resolveMetadataUpdateSuccessMessage(metadata),
        })
      })
      .catch((error: unknown) => {
        replaceTrackInState(set, trackId, previousTrackSnapshot)

        const message =
          error instanceof Error
            ? error.message
            : 'No se pudo renombrar el archivo de la canción.'

        showErrorToast(message)
      })
  },

  attachTrackLyrics: (trackId, lyricsFile) => {
    const state = get()
    const targetTrack = state.libraryQueue.find((track) => track.id === trackId)

    if (!targetTrack) {
      return
    }

    if (!targetTrack.relativePath) {
      showErrorToast('Esta pista no pertenece a la biblioteca local.')
      return
    }

    if (!isValidLyricsFile(lyricsFile)) {
      showErrorToast('Selecciona un archivo de letra .txt o .lrc válido.')
      return
    }

    const lyricsExtension = resolveLyricsExtension(lyricsFile.name)

    if (!lyricsExtension) {
      showErrorToast('Selecciona un archivo de letra .txt o .lrc válido.')
      return
    }

    void readLyricsFile(lyricsFile)
      .then((lyricsContent) => {
        if (!lyricsContent.trim()) {
          throw new Error('El archivo de letra está vacío.')
        }

        return saveTrackLyricsToLibrary(
          { relativePath: targetTrack.relativePath! },
          lyricsContent,
          lyricsExtension,
          targetTrack.lyricsRelativePath,
          lyricsFile.name,
        )
      })
      .then(({ lyricsRelativePath }) => {
        updateTrackLyricsInState(set, trackId, lyricsRelativePath)
        bumpLyricsContentRevision(set, trackId)
        toastStore.getState().addToast({
          type: 'success',
          message: 'Letra agregada correctamente.',
        })
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error
            ? error.message
            : 'No se pudo guardar la letra seleccionada.'

        showErrorToast(message)
      })
  },

  saveTrackLyricsContent: async (trackId, lyricsContent) => {
    const state = get()
    const targetTrack = state.libraryQueue.find((track) => track.id === trackId)

    if (!targetTrack) {
      throw new Error('No se encontró la pista seleccionada.')
    }

    if (!targetTrack.relativePath) {
      throw new Error('Esta pista no pertenece a la biblioteca local.')
    }

    if (!targetTrack.lyricsRelativePath) {
      throw new Error('Esta pista no tiene un archivo de letra asociado.')
    }

    const lyricsExtension = resolveLyricsExtensionFromRelativePath(targetTrack.lyricsRelativePath)

    if (!lyricsExtension) {
      throw new Error('El archivo de letra asociado no es válido.')
    }

    const result = await saveTrackLyricsToLibrary(
      { relativePath: targetTrack.relativePath },
      lyricsContent,
      lyricsExtension,
      targetTrack.lyricsRelativePath,
    )

    updateTrackLyricsInState(set, trackId, result.lyricsRelativePath)
    bumpLyricsContentRevision(set, trackId)
  },

  resumeAudio: async () => {
    try {
      await audioEngine.resumeContext()
      set((state) => ({ ...state, isAudioBlocked: false }))
      toastStore.getState().addToast({
        type: 'success',
        message: 'Audio activado correctamente',
      })

      const { currentTrack, status } = get()

      if (currentTrack && status !== 'playing') {
        await get().play()
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo activar el audio'
      showErrorToast(message)
    }
  },
}))

/** Acceso al store fuera de componentes React. */
export const playerStore = usePlayerStore

const initialState = createInitialState()
initializeAudioEngine(initialState)

audioEngine.onTimeUpdate = (currentTime, duration) => {
  playerStore.setState({ currentTime, duration })
  persistCurrentSessionThrottled(playerStore.getState)

  if (isRepeatingCurrentTrack || duration <= 0 || audioEngine.isPlayingActive()) {
    return
  }

  const state = playerStore.getState()

  if (!shouldRecoverRepeatAfterPlaybackStop({ ...state, currentTime, duration })) {
    return
  }

  window.setTimeout(() => {
    if (isRepeatingCurrentTrack || audioEngine.isPlayingActive()) {
      return
    }

    const latestState = playerStore.getState()

    if (!shouldRecoverRepeatAfterPlaybackStop(latestState)) {
      return
    }

    handleTrackEnd(playerStore.setState, playerStore.getState)
  }, 50)
}

audioEngine.onTrackEnd = () => {
  handleTrackEnd(playerStore.setState, playerStore.getState)
}

audioEngine.onError = (message) => {
  showErrorToast(message)
}

window.addEventListener('pagehide', () => {
  persistCurrentSession(playerStore.getState)
})
