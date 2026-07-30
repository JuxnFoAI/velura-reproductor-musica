/** Persistencia en localStorage de la configuración del ecualizador. */

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

/**
 * Carga la configuración del ecualizador desde localStorage.
 */
export function loadPersistedEqualizerSettings(): PersistedEqualizerSettings {
  try {
    const raw = localStorage.getItem(EQUALIZER_STORAGE_KEY)

    if (!raw) {
      return createDefaultEqualizerSettings()
    }

    const parsed: unknown = JSON.parse(raw)

    if (typeof parsed !== 'object' || parsed === null) {
      return createDefaultEqualizerSettings()
    }

    const data = parsed as Partial<PersistedEqualizerSettings>

    return {
      isEnabled: data.isEnabled === true,
      presetId: isEqualizerPresetId(data.presetId) ? data.presetId : DEFAULT_EQUALIZER_PRESET_ID,
      bandGains: normalizeEqualizerBandGains(data.bandGains),
    }
  } catch {
    return createDefaultEqualizerSettings()
  }
}

/**
 * Guarda la configuración del ecualizador en localStorage.
 */
export function savePersistedEqualizerSettings(settings: PersistedEqualizerSettings): void {
  try {
    localStorage.setItem(EQUALIZER_STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Ignorar errores de cuota o modo privado.
  }
}

function createDefaultEqualizerSettings(): PersistedEqualizerSettings {
  return {
    isEnabled: false,
    presetId: DEFAULT_EQUALIZER_PRESET_ID,
    bandGains: normalizeEqualizerBandGains(null),
  }
}
