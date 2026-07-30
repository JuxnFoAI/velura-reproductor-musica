/** Persistencia en localStorage de las preferencias de la Isla dinámica. */

import {
  DEFAULT_DYNAMIC_ISLAND_COLOR_ID,
  isDynamicIslandColorId,
  type DynamicIslandColorId,
} from '../types/dynamicIslandColors'

const DYNAMIC_ISLAND_STORAGE_KEY = 'music-player-dynamic-island'

interface PersistedDynamicIslandSettings {
  isEnabled: boolean
  colorId: DynamicIslandColorId
}

/**
 * Carga las preferencias de la Isla dinámica desde localStorage.
 */
export function loadPersistedDynamicIslandSettings(): PersistedDynamicIslandSettings {
  try {
    const raw = localStorage.getItem(DYNAMIC_ISLAND_STORAGE_KEY)

    if (!raw) {
      return createDefaultDynamicIslandSettings()
    }

    const parsed: unknown = JSON.parse(raw)

    if (typeof parsed !== 'object' || parsed === null) {
      return createDefaultDynamicIslandSettings()
    }

    const data = parsed as Partial<PersistedDynamicIslandSettings>

    return {
      isEnabled: data.isEnabled !== false,
      colorId: isDynamicIslandColorId(data.colorId)
        ? data.colorId
        : DEFAULT_DYNAMIC_ISLAND_COLOR_ID,
    }
  } catch {
    return createDefaultDynamicIslandSettings()
  }
}

/**
 * Guarda las preferencias de la Isla dinámica en localStorage.
 */
export function savePersistedDynamicIslandSettings(
  settings: PersistedDynamicIslandSettings,
): void {
  try {
    localStorage.setItem(DYNAMIC_ISLAND_STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Ignorar errores de cuota o modo privado.
  }
}

function createDefaultDynamicIslandSettings(): PersistedDynamicIslandSettings {
  return {
    isEnabled: true,
    colorId: DEFAULT_DYNAMIC_ISLAND_COLOR_ID,
  }
}
