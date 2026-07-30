/** Hook de arranque para restaurar las preferencias de calidad de audio. */

import { useEqualizerBootstrap } from './useEqualizerBootstrap'
import { useVolumeNormalizationBootstrap } from './useVolumeNormalizationBootstrap'

/**
 * Inicializa ecualizador y normalización de volumen al arrancar la aplicación.
 */
export function useAudioQualityBootstrap(): void {
  useEqualizerBootstrap()
  useVolumeNormalizationBootstrap()
}
