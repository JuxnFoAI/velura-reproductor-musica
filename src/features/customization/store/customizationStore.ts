/** Store de preferencias de personalización del reproductor. */

import { create } from 'zustand'

import { applyDynamicIslandColor } from '../lib/applyDynamicIslandColor'
import { applyLyricsFontFamily } from '../lib/applyLyricsFontFamily'
import { applyLyricsFontSize } from '../lib/applyLyricsFontSize'
import { applyPlayerButtonColor } from '../lib/applyPlayerButtonColor'
import { applyPlayerLetterColor } from '../lib/applyPlayerLetterColor'
import { loadLyricsFont } from '../services/lyricsFontLoader'
import {
  loadPersistedLyricsFontId,
  savePersistedLyricsFontId,
} from '../services/lyricsFontPersistence'
import {
  loadPersistedLyricsFontSizeId,
  savePersistedLyricsFontSizeId,
} from '../services/lyricsFontSizePersistence'
import {
  loadPersistedPlayerButtonColorId,
  loadPersistedPlayerLetterColorId,
  savePersistedPlayerButtonColorId,
  savePersistedPlayerLetterColorId,
} from '../services/playerColorPersistence'
import {
  loadPersistedDynamicIslandSettings,
  savePersistedDynamicIslandSettings,
} from '../services/dynamicIslandPersistence'
import {
  loadPersistedPlayerBackground,
  savePersistedPlayerBackground,
} from '../services/playerBackgroundPersistence'
import {
  DEFAULT_LYRICS_FONT_ID,
  getLyricsFontById,
  type LyricsFontId,
} from '../types/lyricsFonts'
import {
  DEFAULT_LYRICS_FONT_SIZE_ID,
  getLyricsFontSizeById,
  type LyricsFontSizeId,
} from '../types/lyricsFontSizes'
import {
  DEFAULT_PLAYER_BUTTON_COLOR_ID,
  DEFAULT_PLAYER_LETTER_COLOR_ID,
  getPlayerButtonColorById,
  getPlayerLetterColorById,
  type PlayerButtonColorId,
  type PlayerLetterColorId,
} from '../types/playerColors'
import {
  DEFAULT_DYNAMIC_ISLAND_COLOR_ID,
  getDynamicIslandColorById,
  type DynamicIslandColorId,
} from '../types/dynamicIslandColors'
import {
  DEFAULT_PLAYER_BACKGROUND_MODE,
  type PlayerBackgroundMode,
} from '../types/playerBackground'
import {
  DEFAULT_PLAYER_BACKGROUND_ADJUSTMENTS,
  normalizePlayerBackgroundAdjustments,
  type PlayerBackgroundAdjustments,
} from '../types/playerBackgroundAdjustments'

interface CustomizationState {
  appliedLyricsFontId: LyricsFontId
  appliedLyricsFontSizeId: LyricsFontSizeId
  appliedPlayerLetterColorId: PlayerLetterColorId
  appliedPlayerButtonColorId: PlayerButtonColorId
  appliedBackgroundMode: PlayerBackgroundMode
  customBackgroundUrl: string | null
  customBackgroundAdjustments: PlayerBackgroundAdjustments
  isDynamicIslandEnabled: boolean
  appliedDynamicIslandColorId: DynamicIslandColorId
  isLyricsFontReady: boolean
  initializeLyricsFont: () => Promise<void>
  setLyricsFont: (fontId: LyricsFontId) => Promise<void>
  resetLyricsFontToDefault: () => Promise<void>
  setLyricsFontSize: (sizeId: LyricsFontSizeId) => void
  setPlayerLetterColor: (colorId: PlayerLetterColorId) => void
  setPlayerButtonColor: (colorId: PlayerButtonColorId) => void
  setPlayerBackground: (
    mode: PlayerBackgroundMode,
    customBackgroundUrl?: string | null,
    adjustments?: PlayerBackgroundAdjustments,
  ) => void
  setDynamicIslandEnabled: (isEnabled: boolean) => void
  setDynamicIslandColor: (colorId: DynamicIslandColorId) => void
}

async function resolveLyricsFont(fontId: LyricsFontId) {
  const font = getLyricsFontById(fontId) ?? getLyricsFontById(DEFAULT_LYRICS_FONT_ID)

  if (!font) {
    throw new Error('No se encontró la fuente predeterminada para letras.')
  }

  await loadLyricsFont(font)
  applyLyricsFontFamily(font.fontFamily)

  return font.id
}

function resolveLyricsFontSize(sizeId: LyricsFontSizeId): LyricsFontSizeId {
  const size =
    getLyricsFontSizeById(sizeId) ?? getLyricsFontSizeById(DEFAULT_LYRICS_FONT_SIZE_ID)

  if (!size) {
    throw new Error('No se encontró el tamaño predeterminado para letras.')
  }

  applyLyricsFontSize(size)

  return size.id
}

function resolvePlayerLetterColor(colorId: PlayerLetterColorId): PlayerLetterColorId {
  const color =
    getPlayerLetterColorById(colorId) ??
    getPlayerLetterColorById(DEFAULT_PLAYER_LETTER_COLOR_ID)

  if (!color) {
    throw new Error('No se encontró el color de letra predeterminado.')
  }

  applyPlayerLetterColor(color)

  return color.id
}

function resolvePlayerButtonColor(colorId: PlayerButtonColorId): PlayerButtonColorId {
  const color =
    getPlayerButtonColorById(colorId) ??
    getPlayerButtonColorById(DEFAULT_PLAYER_BUTTON_COLOR_ID)

  if (!color) {
    throw new Error('No se encontró el color de botones predeterminado.')
  }

  applyPlayerButtonColor(color)

  return color.id
}

function resolveDynamicIslandColor(colorId: DynamicIslandColorId): DynamicIslandColorId {
  const color =
    getDynamicIslandColorById(colorId) ??
    getDynamicIslandColorById(DEFAULT_DYNAMIC_ISLAND_COLOR_ID)

  if (!color) {
    throw new Error('No se encontró el color predeterminado de la Isla dinámica.')
  }

  applyDynamicIslandColor(color)

  return color.id
}

export const useCustomizationStore = create<CustomizationState>((set) => ({
  appliedLyricsFontId: DEFAULT_LYRICS_FONT_ID,
  appliedLyricsFontSizeId: DEFAULT_LYRICS_FONT_SIZE_ID,
  appliedPlayerLetterColorId: DEFAULT_PLAYER_LETTER_COLOR_ID,
  appliedPlayerButtonColorId: DEFAULT_PLAYER_BUTTON_COLOR_ID,
  appliedBackgroundMode: DEFAULT_PLAYER_BACKGROUND_MODE,
  customBackgroundUrl: null,
  customBackgroundAdjustments: { ...DEFAULT_PLAYER_BACKGROUND_ADJUSTMENTS },
  isDynamicIslandEnabled: true,
  appliedDynamicIslandColorId: DEFAULT_DYNAMIC_ISLAND_COLOR_ID,
  isLyricsFontReady: false,

  initializeLyricsFont: async () => {
    const persistedFontId = loadPersistedLyricsFontId()
    const persistedFontSizeId = loadPersistedLyricsFontSizeId()
    const persistedLetterColorId = loadPersistedPlayerLetterColorId()
    const persistedButtonColorId = loadPersistedPlayerButtonColorId()
    const persistedBackground = loadPersistedPlayerBackground()
    const persistedDynamicIsland = loadPersistedDynamicIslandSettings()
    const resolvedFontId = await resolveLyricsFont(persistedFontId)
    const resolvedFontSizeId = resolveLyricsFontSize(persistedFontSizeId)
    const resolvedLetterColorId = resolvePlayerLetterColor(persistedLetterColorId)
    const resolvedButtonColorId = resolvePlayerButtonColor(persistedButtonColorId)
    const resolvedDynamicIslandColorId = resolveDynamicIslandColor(
      persistedDynamicIsland.colorId,
    )

    set({
      appliedLyricsFontId: resolvedFontId,
      appliedLyricsFontSizeId: resolvedFontSizeId,
      appliedPlayerLetterColorId: resolvedLetterColorId,
      appliedPlayerButtonColorId: resolvedButtonColorId,
      appliedBackgroundMode: persistedBackground.mode,
      customBackgroundUrl: persistedBackground.customBackgroundDataUrl,
      customBackgroundAdjustments: persistedBackground.adjustments,
      isDynamicIslandEnabled: persistedDynamicIsland.isEnabled,
      appliedDynamicIslandColorId: resolvedDynamicIslandColorId,
      isLyricsFontReady: true,
    })
  },

  setLyricsFont: async (fontId) => {
    const resolvedFontId = await resolveLyricsFont(fontId)

    savePersistedLyricsFontId(resolvedFontId)
    set({ appliedLyricsFontId: resolvedFontId })
  },

  resetLyricsFontToDefault: async () => {
    const resolvedFontId = await resolveLyricsFont(DEFAULT_LYRICS_FONT_ID)

    savePersistedLyricsFontId(resolvedFontId)
    set({ appliedLyricsFontId: resolvedFontId })
  },

  setLyricsFontSize: (sizeId) => {
    const resolvedFontSizeId = resolveLyricsFontSize(sizeId)

    savePersistedLyricsFontSizeId(resolvedFontSizeId)
    set({ appliedLyricsFontSizeId: resolvedFontSizeId })
  },

  setPlayerLetterColor: (colorId) => {
    const resolvedColorId = resolvePlayerLetterColor(colorId)

    savePersistedPlayerLetterColorId(resolvedColorId)
    set({ appliedPlayerLetterColorId: resolvedColorId })
  },

  setPlayerButtonColor: (colorId) => {
    const resolvedColorId = resolvePlayerButtonColor(colorId)

    savePersistedPlayerButtonColorId(resolvedColorId)
    set({ appliedPlayerButtonColorId: resolvedColorId })
  },

  setPlayerBackground: (mode, customBackgroundUrl = null, adjustments) => {
    set((state) => {
      const resolvedCustomBackgroundUrl =
        mode === 'custom' ? customBackgroundUrl : null
      const resolvedAdjustments = adjustments
        ? normalizePlayerBackgroundAdjustments(adjustments)
        : state.customBackgroundAdjustments

      savePersistedPlayerBackground({
        mode,
        customBackgroundDataUrl: resolvedCustomBackgroundUrl,
        adjustments: resolvedAdjustments,
      })

      return {
        appliedBackgroundMode: mode,
        customBackgroundUrl: resolvedCustomBackgroundUrl,
        customBackgroundAdjustments: resolvedAdjustments,
      }
    })
  },

  setDynamicIslandEnabled: (isEnabled) => {
    set((state) => {
      savePersistedDynamicIslandSettings({
        isEnabled,
        colorId: state.appliedDynamicIslandColorId,
      })

      return { isDynamicIslandEnabled: isEnabled }
    })
  },

  setDynamicIslandColor: (colorId) => {
    const resolvedColorId = resolveDynamicIslandColor(colorId)

    set((state) => {
      savePersistedDynamicIslandSettings({
        isEnabled: state.isDynamicIslandEnabled,
        colorId: resolvedColorId,
      })

      return { appliedDynamicIslandColorId: resolvedColorId }
    })
  },
}))
