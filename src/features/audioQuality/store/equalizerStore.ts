/** Store de preferencias del ecualizador y sincronización con el motor de audio. */

import { create } from 'zustand'

import { equalizerBandGainsToArray, clampEqualizerGainDb, type EqualizerBandGains } from '@lib/equalizerConstants'
import { audioEngine } from '@features/musicPlayer'

import {
  loadPersistedEqualizerSettings,
  savePersistedEqualizerSettings,
} from '../services/equalizerPersistence'
import {
  DEFAULT_EQUALIZER_PRESET_ID,
  getEqualizerPresetById,
  resolveMatchingEqualizerPresetId,
  type EqualizerPresetId,
} from '../types/equalizer'

interface EqualizerState {
  isEnabled: boolean
  presetId: EqualizerPresetId
  bandGains: EqualizerBandGains
  initializeEqualizer: () => void
  setEnabled: (isEnabled: boolean) => void
  setPreset: (presetId: EqualizerPresetId) => void
  setBandGain: (bandId: keyof EqualizerBandGains, gainDb: number) => void
  resetToFlat: () => void
  resetToDefaults: () => void
}

function applyEqualizerToEngine(isEnabled: boolean, bandGains: EqualizerBandGains): void {
  audioEngine.setEqualizerEnabled(isEnabled)
  audioEngine.setEqualizerGains(equalizerBandGainsToArray(bandGains))
}

function persistEqualizerState(state: Pick<EqualizerState, 'isEnabled' | 'presetId' | 'bandGains'>): void {
  savePersistedEqualizerSettings({
    isEnabled: state.isEnabled,
    presetId: state.presetId,
    bandGains: state.bandGains,
  })
}

export const useEqualizerStore = create<EqualizerState>((set, get) => ({
  isEnabled: false,
  presetId: DEFAULT_EQUALIZER_PRESET_ID,
  bandGains: getEqualizerPresetById(DEFAULT_EQUALIZER_PRESET_ID)?.gains ?? {
    low: 0,
    lowMid: 0,
    mid: 0,
    highMid: 0,
    high: 0,
  },

  initializeEqualizer: () => {
    const persisted = loadPersistedEqualizerSettings()

    applyEqualizerToEngine(persisted.isEnabled, persisted.bandGains)

    set({
      isEnabled: persisted.isEnabled,
      presetId: persisted.presetId,
      bandGains: persisted.bandGains,
    })
  },

  setEnabled: (isEnabled) => {
    const { bandGains } = get()

    applyEqualizerToEngine(isEnabled, bandGains)

    set({ isEnabled })
    persistEqualizerState({ ...get(), isEnabled })
  },

  setPreset: (presetId) => {
    const preset = getEqualizerPresetById(presetId)

    if (!preset || presetId === 'custom') {
      return
    }

    const nextState = {
      presetId,
      bandGains: { ...preset.gains },
    }

    applyEqualizerToEngine(get().isEnabled, nextState.bandGains)

    set(nextState)
    persistEqualizerState({ ...get(), ...nextState })
  },

  setBandGain: (bandId, gainDb) => {
    const nextBandGains = {
      ...get().bandGains,
      [bandId]: clampEqualizerGainDb(gainDb),
    }
    const nextPresetId = resolveMatchingEqualizerPresetId(nextBandGains)

    applyEqualizerToEngine(get().isEnabled, nextBandGains)

    set({
      bandGains: nextBandGains,
      presetId: nextPresetId,
    })
    persistEqualizerState({
      ...get(),
      bandGains: nextBandGains,
      presetId: nextPresetId,
    })
  },

  resetToFlat: () => {
    get().setPreset(DEFAULT_EQUALIZER_PRESET_ID)
  },

  resetToDefaults: () => {
    const defaultPreset = getEqualizerPresetById(DEFAULT_EQUALIZER_PRESET_ID)
    const bandGains = defaultPreset?.gains ?? get().bandGains
    const nextState = {
      isEnabled: false,
      presetId: DEFAULT_EQUALIZER_PRESET_ID,
      bandGains: { ...bandGains },
    }

    applyEqualizerToEngine(nextState.isEnabled, nextState.bandGains)

    set(nextState)
    persistEqualizerState({ ...get(), ...nextState })
  },
}))
