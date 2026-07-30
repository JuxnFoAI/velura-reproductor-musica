/** Tipos y presets del ecualizador de audio. */

import {
  DEFAULT_EQUALIZER_BAND_GAINS,
  EQ_BAND_DEFINITIONS,
  type EqualizerBandGains,
} from '@lib/equalizerConstants'

export {
  DEFAULT_EQUALIZER_BAND_GAINS,
  EQ_BAND_DEFINITIONS,
  EQ_GAIN_MAX_DB,
  EQ_GAIN_MIN_DB,
  EQ_GAIN_STEP_DB,
  clampEqualizerGainDb,
  formatEqualizerGainDb,
  normalizeEqualizerBandGains,
  type EqualizerBandGains,
  type EqualizerBandId,
} from '@lib/equalizerConstants'

export type EqualizerPresetId =
  | 'flat'
  | 'rock'
  | 'pop'
  | 'jazz'
  | 'vocal'
  | 'bass'
  | 'treble'
  | 'custom'

export interface EqualizerPresetOption {
  id: EqualizerPresetId
  label: string
  description: string
  gains: EqualizerBandGains
}

export const DEFAULT_EQUALIZER_PRESET_ID: EqualizerPresetId = 'flat'

const FLAT_GAINS: EqualizerBandGains = { ...DEFAULT_EQUALIZER_BAND_GAINS }

export const EQUALIZER_PRESET_OPTIONS: readonly EqualizerPresetOption[] = [
  {
    id: 'flat',
    label: 'Plano',
    description: 'Sin alteraciones en el balance',
    gains: FLAT_GAINS,
  },
  {
    id: 'rock',
    label: 'Rock',
    description: 'Graves y agudos realzados',
    gains: { low: 4, lowMid: 2, mid: -1, highMid: 2, high: 4 },
  },
  {
    id: 'pop',
    label: 'Pop',
    description: 'Voz y presencia en medios',
    gains: { low: -1, lowMid: 2, mid: 4, highMid: 2, high: -1 },
  },
  {
    id: 'jazz',
    label: 'Jazz',
    description: 'Calidez suave en extremos',
    gains: { low: 3, lowMid: 2, mid: 0, highMid: 2, high: 3 },
  },
  {
    id: 'vocal',
    label: 'Voz',
    description: 'Realza medios para voces',
    gains: { low: -2, lowMid: -1, mid: 3, highMid: 2, high: -1 },
  },
  {
    id: 'bass',
    label: 'Graves',
    description: 'Refuerzo de frecuencias bajas',
    gains: { low: 6, lowMid: 4, mid: 0, highMid: 0, high: 0 },
  },
  {
    id: 'treble',
    label: 'Agudos',
    description: 'Brillo en frecuencias altas',
    gains: { low: 0, lowMid: 0, mid: 0, highMid: 3, high: 6 },
  },
  {
    id: 'custom',
    label: 'Personalizado',
    description: 'Ajuste manual por banda',
    gains: FLAT_GAINS,
  },
] as const

const PRESET_BY_ID = new Map(EQUALIZER_PRESET_OPTIONS.map((preset) => [preset.id, preset]))

/**
 * Devuelve un preset del ecualizador por identificador.
 */
export function getEqualizerPresetById(presetId: EqualizerPresetId): EqualizerPresetOption | undefined {
  return PRESET_BY_ID.get(presetId)
}

/**
 * Valida si un valor corresponde a un preset conocido.
 */
export function isEqualizerPresetId(value: unknown): value is EqualizerPresetId {
  return typeof value === 'string' && PRESET_BY_ID.has(value as EqualizerPresetId)
}

/**
 * Resuelve el preset que coincide con las ganancias actuales, si aplica.
 */
export function resolveMatchingEqualizerPresetId(
  gains: EqualizerBandGains,
): EqualizerPresetId {
  for (const preset of EQUALIZER_PRESET_OPTIONS) {
    if (preset.id === 'custom') {
      continue
    }

    const matchesAllBands = EQ_BAND_DEFINITIONS.every(
      (band) => preset.gains[band.id] === gains[band.id],
    )

    if (matchesAllBands) {
      return preset.id
    }
  }

  return 'custom'
}
