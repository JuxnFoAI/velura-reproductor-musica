/** Punto de entrada público del módulo de personalización. */
export {
  CustomizationSettingsSection,
  LyricsFontsOptionsMenu,
} from './components'
export { useLyricsFontBootstrap } from './hooks/useLyricsFontBootstrap'
export { buildCustomBackgroundImageFilter } from './lib/buildCustomBackgroundImageFilter'
export { loadLyricsFont, preloadLyricsFonts } from './services/lyricsFontLoader'
export { useCustomizationStore } from './store'
export {
  DEFAULT_LYRICS_FONT_ID,
  LYRICS_FONT_CATEGORY_LABELS,
  LYRICS_FONT_CATEGORY_ORDER,
  LYRICS_FONT_PREVIEW_LINES,
  getLyricsFontById,
  getLyricsFontsByCategory,
  type LyricsFontCategory,
  type LyricsFontId,
  type LyricsFontOption,
} from './types/lyricsFonts'
export {
  DEFAULT_LYRICS_FONT_SIZE_ID,
  LYRICS_FONT_SIZE_OPTIONS,
  getLyricsFontSizeById,
  type LyricsFontSizeId,
  type LyricsFontSizeOption,
} from './types/lyricsFontSizes'
export {
  DEFAULT_PLAYER_BUTTON_COLOR_ID,
  DEFAULT_PLAYER_LETTER_COLOR_ID,
  PLAYER_BUTTON_COLOR_OPTIONS,
  PLAYER_COLOR_CATEGORY_LABELS,
  PLAYER_COLOR_CATEGORY_ORDER,
  PLAYER_LETTER_COLOR_OPTIONS,
  getPlayerButtonColorById,
  getPlayerLetterColorById,
  type PlayerButtonColorId,
  type PlayerButtonColorOption,
  type PlayerColorCategory,
  type PlayerLetterColorId,
  type PlayerLetterColorOption,
} from './types/playerColors'
export {
  DEFAULT_PLAYER_BACKGROUND_MODE,
  PLAYER_BACKGROUND_OPTIONS,
  type PlayerBackgroundMode,
  type PlayerBackgroundOption,
} from './types/playerBackground'
export {
  BACKGROUND_ADJUSTMENT_MAX,
  BACKGROUND_ADJUSTMENT_MIN,
  BACKGROUND_ADJUSTMENT_STEP,
  DEFAULT_PLAYER_BACKGROUND_ADJUSTMENTS,
  arePlayerBackgroundAdjustmentsEqual,
  clampBackgroundAdjustment,
  formatBackgroundAdjustmentValue,
  normalizePlayerBackgroundAdjustments,
  type PlayerBackgroundAdjustments,
} from './types/playerBackgroundAdjustments'
export {
  CUSTOMIZATION_SUBSECTION_TITLES,
  type CustomizationDestination,
  type CustomizationSubSection,
} from './types/customizationMenu'
