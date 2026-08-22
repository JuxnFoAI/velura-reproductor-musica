/** Persistencia del tamaño tipográfico seleccionado para el modo letra. */
import { createPersistedIdStorage } from '@lib/createPersistedIdStorage'

import {
  DEFAULT_LYRICS_FONT_SIZE_ID,
  isLyricsFontSizeId,
} from '../types/lyricsFontSizes'

const lyricsFontSizeStorage = createPersistedIdStorage({
  storageKey: 'music-player-lyrics-font-size',
  defaultId: DEFAULT_LYRICS_FONT_SIZE_ID,
  fieldName: 'sizeId',
  isValidId: isLyricsFontSizeId,
})

/** Carga el tamaño de letras guardado por el usuario. */
export const loadPersistedLyricsFontSizeId = lyricsFontSizeStorage.load

/** Guarda el tamaño seleccionado para el modo letra. */
export const savePersistedLyricsFontSizeId = lyricsFontSizeStorage.save
