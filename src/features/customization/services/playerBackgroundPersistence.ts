/** Persistencia del modo de fondo y la imagen personalizada del reproductor. */

import { createPersistedJsonStorage, isJsonObject } from '@lib/createPersistedJsonStorage'

import {
  DEFAULT_PLAYER_BACKGROUND_ADJUSTMENTS,
  normalizePlayerBackgroundAdjustments,
  type PlayerBackgroundAdjustments,
} from '../types/playerBackgroundAdjustments'
import {
  DEFAULT_PLAYER_BACKGROUND_MODE,
  isPlayerBackgroundMode,
  type PlayerBackgroundMode,
} from '../types/playerBackground'

const PLAYER_BACKGROUND_STORAGE_KEY = 'music-player-background'

export interface PersistedPlayerBackground {
  mode: PlayerBackgroundMode
  customBackgroundDataUrl: string | null
  adjustments: PlayerBackgroundAdjustments
}

const DEFAULT_PLAYER_BACKGROUND: PersistedPlayerBackground = {
  mode: DEFAULT_PLAYER_BACKGROUND_MODE,
  customBackgroundDataUrl: null,
  adjustments: { ...DEFAULT_PLAYER_BACKGROUND_ADJUSTMENTS },
}

function readCustomBackgroundDataUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.length === 0) {
    return null
  }

  return value
}

function validatePlayerBackground(value: unknown): PersistedPlayerBackground | null {
  if (!isJsonObject(value)) {
    return null
  }

  return {
    mode: isPlayerBackgroundMode(value.mode) ? value.mode : DEFAULT_PLAYER_BACKGROUND_MODE,
    customBackgroundDataUrl: readCustomBackgroundDataUrl(value.customBackgroundDataUrl),
    adjustments: normalizePlayerBackgroundAdjustments(value.adjustments),
  }
}

const playerBackgroundStorage = createPersistedJsonStorage(
  PLAYER_BACKGROUND_STORAGE_KEY,
  DEFAULT_PLAYER_BACKGROUND,
  validatePlayerBackground,
)

export const loadPersistedPlayerBackground = playerBackgroundStorage.load
export const savePersistedPlayerBackground = playerBackgroundStorage.save
