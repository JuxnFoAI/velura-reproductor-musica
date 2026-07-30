/** Persistencia de los colores personalizados del reproductor. */
import {
  DEFAULT_PLAYER_BUTTON_COLOR_ID,
  DEFAULT_PLAYER_LETTER_COLOR_ID,
  isPlayerButtonColorId,
  isPlayerLetterColorId,
} from '../types/playerColors'
import { createPersistedIdStorage } from './createPersistedIdStorage'

const playerLetterColorStorage = createPersistedIdStorage({
  storageKey: 'music-player-letter-color',
  defaultId: DEFAULT_PLAYER_LETTER_COLOR_ID,
  fieldName: 'colorId',
  isValidId: isPlayerLetterColorId,
})

const playerButtonColorStorage = createPersistedIdStorage({
  storageKey: 'music-player-button-color',
  defaultId: DEFAULT_PLAYER_BUTTON_COLOR_ID,
  fieldName: 'colorId',
  isValidId: isPlayerButtonColorId,
})

/** Carga el color de letra guardado por el usuario. */
export const loadPersistedPlayerLetterColorId = playerLetterColorStorage.load

/** Guarda el color de letra seleccionado. */
export const savePersistedPlayerLetterColorId = playerLetterColorStorage.save

/** Carga el color de botones guardado por el usuario. */
export const loadPersistedPlayerButtonColorId = playerButtonColorStorage.load

/** Guarda el color de botones seleccionado. */
export const savePersistedPlayerButtonColorId = playerButtonColorStorage.save
