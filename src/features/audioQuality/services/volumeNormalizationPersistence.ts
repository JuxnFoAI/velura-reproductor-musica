/** Persistencia en localStorage de la normalización de volumen. */

import { isVolumeNormalizationModeId } from '@lib/volumeNormalizationConstants'

import {
  DEFAULT_VOLUME_NORMALIZATION_MODE_ID,
  type VolumeNormalizationModeId,
} from '../types/volumeNormalization'

const VOLUME_NORMALIZATION_STORAGE_KEY = 'music-player-volume-normalization'

interface PersistedVolumeNormalizationSettings {
  isEnabled: boolean
  modeId: VolumeNormalizationModeId
}

/**
 * Carga la configuración de normalización de volumen desde localStorage.
 */
export function loadPersistedVolumeNormalizationSettings(): PersistedVolumeNormalizationSettings {
  try {
    const raw = localStorage.getItem(VOLUME_NORMALIZATION_STORAGE_KEY)

    if (!raw) {
      return createDefaultVolumeNormalizationSettings()
    }

    const parsed: unknown = JSON.parse(raw)

    if (typeof parsed !== 'object' || parsed === null) {
      return createDefaultVolumeNormalizationSettings()
    }

    const data = parsed as Partial<PersistedVolumeNormalizationSettings>

    return {
      isEnabled: data.isEnabled === true,
      modeId: isVolumeNormalizationModeId(data.modeId)
        ? data.modeId
        : DEFAULT_VOLUME_NORMALIZATION_MODE_ID,
    }
  } catch {
    return createDefaultVolumeNormalizationSettings()
  }
}

/**
 * Guarda la configuración de normalización de volumen en localStorage.
 */
export function savePersistedVolumeNormalizationSettings(
  settings: PersistedVolumeNormalizationSettings,
): void {
  try {
    localStorage.setItem(VOLUME_NORMALIZATION_STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Ignorar errores de cuota o modo privado.
  }
}

function createDefaultVolumeNormalizationSettings(): PersistedVolumeNormalizationSettings {
  return {
    isEnabled: false,
    modeId: DEFAULT_VOLUME_NORMALIZATION_MODE_ID,
  }
}
