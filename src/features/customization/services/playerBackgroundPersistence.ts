/** Persistencia del modo de fondo y la imagen personalizada del reproductor. */

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

/**
 * Carga las preferencias de fondo guardadas por el usuario.
 */
export function loadPersistedPlayerBackground(): PersistedPlayerBackground {
  try {
    const raw = localStorage.getItem(PLAYER_BACKGROUND_STORAGE_KEY)

    if (!raw) {
      return {
        mode: DEFAULT_PLAYER_BACKGROUND_MODE,
        customBackgroundDataUrl: null,
        adjustments: { ...DEFAULT_PLAYER_BACKGROUND_ADJUSTMENTS },
      }
    }

    const parsed: unknown = JSON.parse(raw)

    if (typeof parsed !== 'object' || parsed === null) {
      return {
        mode: DEFAULT_PLAYER_BACKGROUND_MODE,
        customBackgroundDataUrl: null,
        adjustments: { ...DEFAULT_PLAYER_BACKGROUND_ADJUSTMENTS },
      }
    }

    const record = parsed as {
      mode?: unknown
      customBackgroundDataUrl?: unknown
      adjustments?: unknown
    }

    const mode = isPlayerBackgroundMode(record.mode)
      ? record.mode
      : DEFAULT_PLAYER_BACKGROUND_MODE

    const customBackgroundDataUrl =
      typeof record.customBackgroundDataUrl === 'string' &&
      record.customBackgroundDataUrl.length > 0
        ? record.customBackgroundDataUrl
        : null

    return {
      mode,
      customBackgroundDataUrl,
      adjustments: normalizePlayerBackgroundAdjustments(record.adjustments),
    }
  } catch {
    return {
      mode: DEFAULT_PLAYER_BACKGROUND_MODE,
      customBackgroundDataUrl: null,
      adjustments: { ...DEFAULT_PLAYER_BACKGROUND_ADJUSTMENTS },
    }
  }
}

/**
 * Guarda el modo de fondo y la imagen personalizada seleccionada.
 */
export function savePersistedPlayerBackground({
  mode,
  customBackgroundDataUrl,
  adjustments,
}: PersistedPlayerBackground): void {
  try {
    localStorage.setItem(
      PLAYER_BACKGROUND_STORAGE_KEY,
      JSON.stringify({ mode, customBackgroundDataUrl, adjustments }),
    )
  } catch {
    // Ignorar errores de cuota o modo privado.
  }
}
