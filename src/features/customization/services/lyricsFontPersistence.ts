/** Persistencia de la fuente seleccionada para el modo letra. */
import {
  DEFAULT_LYRICS_FONT_ID,
  isLyricsFontId,
} from '../types/lyricsFonts'
import { createPersistedIdStorage } from './createPersistedIdStorage'

const lyricsFontStorage = createPersistedIdStorage({
  storageKey: 'music-player-lyrics-font',
  defaultId: DEFAULT_LYRICS_FONT_ID,
  fieldName: 'fontId',
  isValidId: isLyricsFontId,
})

/** Carga la fuente de letras guardada por el usuario. */
export const loadPersistedLyricsFontId = lyricsFontStorage.load

/** Guarda la fuente seleccionada para el modo letra. */
export const savePersistedLyricsFontId = lyricsFontStorage.save
