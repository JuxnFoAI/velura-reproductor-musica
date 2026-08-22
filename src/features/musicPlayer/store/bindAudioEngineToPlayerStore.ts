/** Conecta el motor Web Audio con el store: tiempo, fin de pista y errores. */
import type { StoreApi } from 'zustand'
import { audioEngine } from '../services/audioEngine'
import {
  handleTrackEnd,
  shouldRecoverRepeatAfterPlaybackStop,
} from './playerPlaybackEngine'
import {
  isCurrentlyRepeatingTrack,
  persistCurrentSession,
  persistCurrentSessionThrottled,
  REPEAT_RECOVERY_DELAY_MS,
  showErrorToast,
  syncAudioSettings,
} from './playerStoreRuntime'
import type { PlayerStore } from './playerStoreTypes'

export function bindAudioEngineToPlayerStore(store: StoreApi<PlayerStore>): void {
  syncAudioSettings(store.getState())

  audioEngine.onTimeUpdate = (currentTime, duration) => {
    store.setState({ currentTime, duration })
    persistCurrentSessionThrottled(store.getState)

    if (isCurrentlyRepeatingTrack() || duration <= 0 || audioEngine.isPlayingActive()) {
      return
    }

    const state = store.getState()

    if (!shouldRecoverRepeatAfterPlaybackStop({ ...state, currentTime, duration })) {
      return
    }

    window.setTimeout(() => {
      if (isCurrentlyRepeatingTrack() || audioEngine.isPlayingActive()) {
        return
      }

      const latestState = store.getState()

      if (!shouldRecoverRepeatAfterPlaybackStop(latestState)) {
        return
      }

      handleTrackEnd(store.setState, store.getState)
    }, REPEAT_RECOVERY_DELAY_MS)
  }

  audioEngine.onTrackEnd = () => {
    handleTrackEnd(store.setState, store.getState)
  }

  audioEngine.onError = (message) => {
    showErrorToast(message)
  }

  window.addEventListener('pagehide', () => {
    persistCurrentSession(store.getState)
  })
}
