/** Hook de arranque para restaurar la normalización de volumen. */

import { useEffect } from 'react'

import { useVolumeNormalizationStore } from '../store/volumeNormalizationStore'

/**
 * Restaura la normalización de volumen persistida y la sincroniza con el motor de audio.
 */
export function useVolumeNormalizationBootstrap(): void {
  const initializeVolumeNormalization = useVolumeNormalizationStore(
    (state) => state.initializeVolumeNormalization,
  )

  useEffect(() => {
    initializeVolumeNormalization()
  }, [initializeVolumeNormalization])
}
