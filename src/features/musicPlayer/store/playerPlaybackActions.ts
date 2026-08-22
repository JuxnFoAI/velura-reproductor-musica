/** Acciones de transporte, volumen, sesión y repetición del reproductor. */
import { audioEngine } from '../services/audioEngine'
import {
  clearPersistedSession,
  loadPersistedSession,
} from '../services/persistenceService'
import {
  consumePreviousTrack,
  getNavigationState,
  getNextTrack,
  resetTrackHistory,
  resolveFavoriteTracks,
  resolveLibraryPlaybackQueue,
} from './playerQueueLogic'
import {
  handlePlaybackFailure,
  loadAndPlayTrack,
  loadAndRestoreTrack,
  repeatCurrentTrack,
  restartCurrentTrackFromStart,
  resumeOrReloadCurrentTrack,
} from './playerPlaybackEngine'
import {
  beginPlaybackRequest,
  clampVolume,
  persistCurrentSession,
  persistSettings,
  RESTART_THRESHOLD_SECONDS,
  resolveAutoPlayAfterTrackChange,
  showErrorToast,
} from './playerStoreRuntime'
import { toastStore } from './toastStore'
import type { PlayerActions, PlayerStoreGet, PlayerStoreSet } from './playerStoreTypes'

type PlaybackActions = Pick<
  PlayerActions,
  | 'restoreSession'
  | 'play'
  | 'playFavoritesList'
  | 'pause'
  | 'stop'
  | 'next'
  | 'previous'
  | 'seek'
  | 'setVolume'
  | 'toggleMute'
  | 'toggleShuffle'
  | 'toggleLyrics'
  | 'setRepeatMode'
  | 'resumeAudio'
>

export function createPlaybackActions(
  set: PlayerStoreSet,
  get: PlayerStoreGet,
): PlaybackActions {
  return {
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

      await loadAndRestoreTrack(track, session.currentTime, session.isLyricsVisible, set, get)
    },

    play: (track) => {
      void (async () => {
        if (get().queue.length === 0 && !track) {
          return
        }

        if (track) {
          const state = get()
          const isTrackInActiveQueue = state.queue.some(
            (queueTrack) => queueTrack.id === track.id,
          )

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

    setRepeatMode: (mode) => {
      if (!get().currentTrack) {
        return
      }

      set((state) => ({ ...state, repeatMode: mode }))
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
  }
}
