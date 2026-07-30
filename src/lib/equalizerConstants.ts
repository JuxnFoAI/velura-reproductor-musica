/** Constantes compartidas del ecualizador de 5 bandas del reproductor. */

export const EQ_GAIN_MIN_DB = -12
export const EQ_GAIN_MAX_DB = 12
export const EQ_GAIN_STEP_DB = 1
export const EQ_FILTER_Q = 1.4

export const EQ_BAND_DEFINITIONS = [
  { id: 'low', label: 'Graves', frequencyHz: 60 },
  { id: 'lowMid', label: 'Medios bajos', frequencyHz: 250 },
  { id: 'mid', label: 'Medios', frequencyHz: 1000 },
  { id: 'highMid', label: 'Medios altos', frequencyHz: 4000 },
  { id: 'high', label: 'Agudos', frequencyHz: 12000 },
] as const

export type EqualizerBandId = (typeof EQ_BAND_DEFINITIONS)[number]['id']

export type EqualizerBandGains = Record<EqualizerBandId, number>

export const DEFAULT_EQUALIZER_BAND_GAINS: EqualizerBandGains = {
  low: 0,
  lowMid: 0,
  mid: 0,
  highMid: 0,
  high: 0,
}

/**
 * Convierte las ganancias por banda al orden del grafo de audio.
 */
export function equalizerBandGainsToArray(gains: EqualizerBandGains): number[] {
  return EQ_BAND_DEFINITIONS.map((band) => gains[band.id])
}

/**
 * Restringe una ganancia al rango permitido del ecualizador.
 */
export function clampEqualizerGainDb(gainDb: number): number {
  return Math.max(EQ_GAIN_MIN_DB, Math.min(gainDb, EQ_GAIN_MAX_DB))
}

/**
 * Normaliza un objeto de ganancias asegurando valores válidos por banda.
 */
export function normalizeEqualizerBandGains(
  gains: Partial<EqualizerBandGains> | null | undefined,
): EqualizerBandGains {
  const normalized: EqualizerBandGains = { ...DEFAULT_EQUALIZER_BAND_GAINS }

  for (const band of EQ_BAND_DEFINITIONS) {
    const value = gains?.[band.id]

    if (typeof value === 'number' && Number.isFinite(value)) {
      normalized[band.id] = clampEqualizerGainDb(value)
    }
  }

  return normalized
}

/**
 * Formatea una ganancia en dB para mostrarla en la UI.
 */
export function formatEqualizerGainDb(gainDb: number): string {
  if (gainDb > 0) {
    return `+${gainDb} dB`
  }

  return `${gainDb} dB`
}
