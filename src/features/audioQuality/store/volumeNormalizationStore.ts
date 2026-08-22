/** Store de normalización de volumen y sincronización con el motor de audio. */

import { create } from 'zustand'

import { audioEngine } from '@features/musicPlayer'

import {
  loadPersistedVolumeNormalizationSettings,
  savePersistedVolumeNormalizationSettings,
} from '../services/volumeNormalizationPersistence'
import {
  DEFAULT_VOLUME_NORMALIZATION_MODE_ID,
  type VolumeNormalizationModeId,
} from '../types/volumeNormalization'

interface VolumeNormalizationState {
  isEnabled: boolean
  modeId: VolumeNormalizationModeId
  appliedGainDb: number
  initializeVolumeNormalization: () => void
  setEnabled: (isEnabled: boolean) => void
  setMode: (modeId: VolumeNormalizationModeId) => void
  refreshAppliedGain: () => void
  resetToDefaults: () => void
}

function applyVolumeNormalizationToEngine(
  isEnabled: boolean,
  modeId: VolumeNormalizationModeId,
): number {
  audioEngine.setVolumeNormalizationEnabled(isEnabled)
  audioEngine.setVolumeNormalizationMode(modeId)
  audioEngine.refreshVolumeNormalization()
  return audioEngine.getAppliedVolumeNormalizationGainDb()
}

function persistVolumeNormalizationState(
  state: Pick<VolumeNormalizationState, 'isEnabled' | 'modeId'>,
): void {
  savePersistedVolumeNormalizationSettings({
    isEnabled: state.isEnabled,
    modeId: state.modeId,
  })
}

export const useVolumeNormalizationStore = create<VolumeNormalizationState>((set, get) => ({
  isEnabled: false,
  modeId: DEFAULT_VOLUME_NORMALIZATION_MODE_ID,
  appliedGainDb: 0,

  initializeVolumeNormalization: () => {
    const persisted = loadPersistedVolumeNormalizationSettings()
    const appliedGainDb = applyVolumeNormalizationToEngine(persisted.isEnabled, persisted.modeId)

    audioEngine.onVolumeNormalizationChange = (gainDb) => {
      useVolumeNormalizationStore.setState({ appliedGainDb: gainDb })
    }

    set({
      isEnabled: persisted.isEnabled,
      modeId: persisted.modeId,
      appliedGainDb,
    })
  },

  setEnabled: (isEnabled) => {
    const { modeId } = get()
    const appliedGainDb = applyVolumeNormalizationToEngine(isEnabled, modeId)

    set({ isEnabled, appliedGainDb })
    persistVolumeNormalizationState({ isEnabled, modeId })
  },

  setMode: (modeId) => {
    const { isEnabled } = get()
    const appliedGainDb = applyVolumeNormalizationToEngine(isEnabled, modeId)

    set({ modeId, appliedGainDb })
    persistVolumeNormalizationState({ isEnabled, modeId })
  },

  refreshAppliedGain: () => {
    set({ appliedGainDb: audioEngine.getAppliedVolumeNormalizationGainDb() })
  },

  resetToDefaults: () => {
    const appliedGainDb = applyVolumeNormalizationToEngine(
      false,
      DEFAULT_VOLUME_NORMALIZATION_MODE_ID,
    )
    const nextState = {
      isEnabled: false,
      modeId: DEFAULT_VOLUME_NORMALIZATION_MODE_ID,
      appliedGainDb,
    }

    set(nextState)
    persistVolumeNormalizationState(nextState)
  },
}))
