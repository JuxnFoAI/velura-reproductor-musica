/** Cálculo de ganancia de normalización a partir de un buffer de audio decodificado. */

import {
  NORMALIZATION_MAX_BOOST_DB,
  NORMALIZATION_MAX_CUT_DB,
  NORMALIZATION_PEAK_CEILING_DB,
  NORMALIZATION_RMS_BALANCED_TARGET_DB,
  NORMALIZATION_RMS_SOFT_TARGET_DB,
  NORMALIZATION_SILENCE_THRESHOLD_DB,
  type VolumeNormalizationModeId,
} from './volumeNormalizationConstants'

/**
 * Mide el pico absoluto del buffer en decibelios respecto a escala completa.
 */
export function measureAudioBufferPeakDb(buffer: AudioBuffer): number {
  let peak = 0

  for (let channelIndex = 0; channelIndex < buffer.numberOfChannels; channelIndex += 1) {
    const channelData = buffer.getChannelData(channelIndex)

    for (let sampleIndex = 0; sampleIndex < channelData.length; sampleIndex += 1) {
      peak = Math.max(peak, Math.abs(channelData[sampleIndex] ?? 0))
    }
  }

  if (peak <= 0) {
    return NORMALIZATION_SILENCE_THRESHOLD_DB
  }

  return 20 * Math.log10(peak)
}

/**
 * Mide el nivel RMS del buffer en decibelios respecto a escala completa.
 */
export function measureAudioBufferRmsDb(buffer: AudioBuffer): number {
  let sumSquares = 0
  let sampleCount = 0

  for (let channelIndex = 0; channelIndex < buffer.numberOfChannels; channelIndex += 1) {
    const channelData = buffer.getChannelData(channelIndex)

    for (let sampleIndex = 0; sampleIndex < channelData.length; sampleIndex += 1) {
      const sample = channelData[sampleIndex] ?? 0
      sumSquares += sample * sample
      sampleCount += 1
    }
  }

  if (sampleCount === 0) {
    return NORMALIZATION_SILENCE_THRESHOLD_DB
  }

  const rms = Math.sqrt(sumSquares / sampleCount)

  if (rms <= 0) {
    return NORMALIZATION_SILENCE_THRESHOLD_DB
  }

  return 20 * Math.log10(rms)
}

function clampNormalizationGainDb(gainDb: number): number {
  return Math.max(NORMALIZATION_MAX_CUT_DB, Math.min(gainDb, NORMALIZATION_MAX_BOOST_DB))
}

function applyPeakLimiter(gainDb: number, peakDb: number): number {
  const projectedPeakDb = peakDb + gainDb

  if (projectedPeakDb <= NORMALIZATION_PEAK_CEILING_DB) {
    return gainDb
  }

  return gainDb - (projectedPeakDb - NORMALIZATION_PEAK_CEILING_DB)
}

function resolveRmsTargetDb(mode: VolumeNormalizationModeId): number {
  return mode === 'soft'
    ? NORMALIZATION_RMS_SOFT_TARGET_DB
    : NORMALIZATION_RMS_BALANCED_TARGET_DB
}

function computeRmsNormalizationGainDb(
  buffer: AudioBuffer,
  mode: VolumeNormalizationModeId,
): number {
  const rmsDb = measureAudioBufferRmsDb(buffer)
  const peakDb = measureAudioBufferPeakDb(buffer)
  const targetDb = resolveRmsTargetDb(mode)
  const rawGainDb = targetDb - rmsDb
  const limitedGainDb = applyPeakLimiter(rawGainDb, peakDb)

  return clampNormalizationGainDb(limitedGainDb)
}

/**
 * Calcula la ganancia de normalización en dB según el modo seleccionado.
 */
export function computeVolumeNormalizationGainDb(
  buffer: AudioBuffer,
  mode: VolumeNormalizationModeId,
  replayGainTrackDb: number | null | undefined,
): number {
  if (mode === 'replaygain' && typeof replayGainTrackDb === 'number' && Number.isFinite(replayGainTrackDb)) {
    const peakDb = measureAudioBufferPeakDb(buffer)
    const limitedGainDb = applyPeakLimiter(replayGainTrackDb, peakDb)
    return clampNormalizationGainDb(limitedGainDb)
  }

  return computeRmsNormalizationGainDb(buffer, mode === 'soft' ? 'soft' : 'balanced')
}

/**
 * Convierte una ganancia en dB a valor lineal para GainNode.
 */
export function normalizationGainDbToLinear(gainDb: number): number {
  return Math.pow(10, gainDb / 20)
}
