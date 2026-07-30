/** Constantes compartidas para la normalización de volumen por pista. */

export const NORMALIZATION_MAX_BOOST_DB = 12
export const NORMALIZATION_MAX_CUT_DB = 24
export const NORMALIZATION_PEAK_CEILING_DB = -1
export const NORMALIZATION_RMS_BALANCED_TARGET_DB = -18
export const NORMALIZATION_RMS_SOFT_TARGET_DB = -23
export const NORMALIZATION_SILENCE_THRESHOLD_DB = -60

export type VolumeNormalizationModeId = 'balanced' | 'soft' | 'replaygain'

export interface VolumeNormalizationModeOption {
  id: VolumeNormalizationModeId
  label: string
  description: string
}

export const DEFAULT_VOLUME_NORMALIZATION_MODE_ID: VolumeNormalizationModeId = 'balanced'

export const VOLUME_NORMALIZATION_MODE_OPTIONS: readonly VolumeNormalizationModeOption[] = [
  {
    id: 'balanced',
    label: 'Equilibrado',
    description: 'Nivela el volumen perceptual entre canciones',
  },
  {
    id: 'soft',
    label: 'Suave',
    description: 'Ajuste más conservador con menos contraste',
  },
  {
    id: 'replaygain',
    label: 'ReplayGain',
    description: 'Usa etiquetas del archivo o equilibra como respaldo',
  },
] as const

/**
 * Formatea la ganancia aplicada para mostrarla en la UI.
 */
export function formatAppliedNormalizationGainDb(gainDb: number): string {
  if (Math.abs(gainDb) < 0.05) {
    return '0 dB'
  }

  if (gainDb > 0) {
    return `+${gainDb.toFixed(1)} dB`
  }

  return `${gainDb.toFixed(1)} dB`
}

/**
 * Valida si un valor corresponde a un modo de normalización conocido.
 */
export function isVolumeNormalizationModeId(value: unknown): value is VolumeNormalizationModeId {
  return (
    value === 'balanced' ||
    value === 'soft' ||
    value === 'replaygain'
  )
}

/**
 * Devuelve la opción de modo por identificador.
 */
export function getVolumeNormalizationModeById(
  modeId: VolumeNormalizationModeId,
): VolumeNormalizationModeOption | undefined {
  return VOLUME_NORMALIZATION_MODE_OPTIONS.find((mode) => mode.id === modeId)
}
