/** Persistencia en localStorage de la configuración del ecualizador. */

import { createPersistedJsonStorage, isJsonObject } from '@lib/createPersistedJsonStorage'
import { normalizeEqualizerBandGains, type EqualizerBandGains } from '@lib/equalizerConstants'

import {
  DEFAULT_EQUALIZER_PRESET_ID,
  isEqualizerPresetId,
  type EqualizerPresetId,
} from '../types/equalizer'

const EQUALIZER_STORAGE_KEY = 'music-player-equalizer'

interface PersistedEqualizerSettings {
  isEnabled: boolean
  presetId: EqualizerPresetId
  bandGains: EqualizerBandGains
}

const DEFAULT_EQUALIZER_SETTINGS: PersistedEqualizerSettings = {
  isEnabled: false,
  presetId: DEFAULT_EQUALIZER_PRESET_ID,
  bandGains: normalizeEqualizerBandGains(null),
}

function validateEqualizerSettings(value: unknown): PersistedEqualizerSettings | null {
  if (!isJsonObject(value)) {
    return null
  }

  return {
    isEnabled: value.isEnabled === true,
    presetId: isEqualizerPresetId(value.presetId) ? value.presetId : DEFAULT_EQUALIZER_PRESET_ID,
    bandGains: normalizeEqualizerBandGains(
      isJsonObject(value.bandGains) ? (value.bandGains as Partial<EqualizerBandGains>) : null,
    ),
  }
}

const equalizerStorage = createPersistedJsonStorage(
  EQUALIZER_STORAGE_KEY,
  DEFAULT_EQUALIZER_SETTINGS,
  validateEqualizerSettings,
)

export const loadPersistedEqualizerSettings = equalizerStorage.load
export const savePersistedEqualizerSettings = equalizerStorage.save
