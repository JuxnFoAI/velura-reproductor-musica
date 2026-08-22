/** Persistencia en localStorage de la normalización de volumen. */

import { createPersistedJsonStorage, isJsonObject } from '@lib/createPersistedJsonStorage'
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

const DEFAULT_VOLUME_NORMALIZATION_SETTINGS: PersistedVolumeNormalizationSettings = {
  isEnabled: false,
  modeId: DEFAULT_VOLUME_NORMALIZATION_MODE_ID,
}

function validateVolumeNormalizationSettings(
  value: unknown,
): PersistedVolumeNormalizationSettings | null {
  if (!isJsonObject(value)) {
    return null
  }

  return {
    isEnabled: value.isEnabled === true,
    modeId: isVolumeNormalizationModeId(value.modeId)
      ? value.modeId
      : DEFAULT_VOLUME_NORMALIZATION_MODE_ID,
  }
}

const volumeNormalizationStorage = createPersistedJsonStorage(
  VOLUME_NORMALIZATION_STORAGE_KEY,
  DEFAULT_VOLUME_NORMALIZATION_SETTINGS,
  validateVolumeNormalizationSettings,
)

export const loadPersistedVolumeNormalizationSettings = volumeNormalizationStorage.load
export const savePersistedVolumeNormalizationSettings = volumeNormalizationStorage.save
