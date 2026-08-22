/** Orquestación de carga, reproducción, restauración y fallos de pista. */
import { audioEngine } from '../services/audioEngine'
import { clearPersistedSession } from '../services/persistenceService'
import type { PlayerState, Track } from '../types'
import { getNextTrackAfterFailure, isEngineSyncedWithTrack, pushTrackHistory } from './playerQueueLogic'
import {
  beginPlaybackRequest,
  isAudioContextBlockedError,
  isCurrentlyRepeatingTrack,
  isStalePlaybackRequest,
  persistCurrentSession,
  setRepeatingCurrentTrack,
  showErrorToast,
  syncAudioSettings,
  TRACK_END_TOLERANCE_SECONDS,
  TRACK_FADE_MS,
} from './playerStoreRuntime'
import type { PlayerStoreGet, PlayerStoreSet } from './playerStoreTypes'

export function hasReachedTrackEnd(currentTime: number, duration: number): boolean {
  return duration > 0 && currentTime >= duration - TRACK_END_TOLERANCE_SECONDS
}

export function shouldRecoverRepeatAfterPlaybackStop(state: PlayerState): boolean {
  return (
    state.repeatMode === 'one' &&
    state.currentTrack !== null &&
    state.status === 'playing' &&
    hasReachedTrackEnd(state.currentTime, state.duration)
  )
}

export async function handlePlaybackFailure(
  error: unknown,
  failedTrack: Track,
  set: PlayerStoreSet,
  get: PlayerStoreGet,
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
export async function restartCurrentTrackFromStart(
  requestId: number,
  set: PlayerStoreSet,
): Promise<void> {
  set((currentState) => ({ ...currentState, currentTime: 0 }))
  await audioEngine.seek(0)

  if (isStalePlaybackRequest(requestId)) {
    return
  }

  set((currentState) => ({ ...currentState, currentTime: 0 }))
}

export async function repeatCurrentTrack(
  set: PlayerStoreSet,
  get: PlayerStoreGet,
): Promise<void> {
  if (isCurrentlyRepeatingTrack()) {
    return
  }

  const state = get()

  if (!state.currentTrack) {
    return
  }

  setRepeatingCurrentTrack(true)

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
    setRepeatingCurrentTrack(false)
  }
}

export function handleTrackEnd(set: PlayerStoreSet, get: PlayerStoreGet): void {
  const state = get()

  if (state.repeatMode === 'one' && state.currentTrack) {
    void repeatCurrentTrack(set, get)
    return
  }

  get().next()
}

export async function loadAndRestoreTrack(
  track: Track,
  savedTime: number,
  isLyricsVisible: boolean,
  set: PlayerStoreSet,
  get: PlayerStoreGet,
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

export async function loadAndPlayTrack(
  track: Track,
  set: PlayerStoreSet,
  get: PlayerStoreGet,
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
  set: PlayerStoreSet,
  get: PlayerStoreGet,
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
export async function resumeOrReloadCurrentTrack(
  track: Track,
  set: PlayerStoreSet,
  get: PlayerStoreGet,
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
  set: PlayerStoreSet,
  get: PlayerStoreGet,
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
