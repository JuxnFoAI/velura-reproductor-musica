/** Punto de entrada público del módulo de calidad de audio. */
export {
  AudioQualityOptionsMenu,
  AudioQualitySettingsSection,
} from './components'
export { useAudioQualityBootstrap } from './hooks/useAudioQualityBootstrap'
export { useEqualizerStore, useVolumeNormalizationStore } from './store'
export {
  AUDIO_QUALITY_SUBSECTION_TITLES,
  type AudioQualityDestination,
  type AudioQualitySubSection,
} from './types/audioQualityMenu'
export {
  DEFAULT_EQUALIZER_PRESET_ID,
  EQUALIZER_PRESET_OPTIONS,
  EQ_BAND_DEFINITIONS,
  EQ_GAIN_MAX_DB,
  EQ_GAIN_MIN_DB,
  EQ_GAIN_STEP_DB,
  formatEqualizerGainDb,
  type EqualizerBandId,
  type EqualizerPresetId,
  type EqualizerPresetOption,
} from './types/equalizer'
export {
  DEFAULT_VOLUME_NORMALIZATION_MODE_ID,
  VOLUME_NORMALIZATION_MODE_OPTIONS,
  formatAppliedNormalizationGainDb,
  type VolumeNormalizationModeId,
  type VolumeNormalizationModeOption,
} from './types/volumeNormalization'
