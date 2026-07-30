/** Hook de arranque para restaurar la configuración del ecualizador. */

import { useEffect } from 'react'

import { useEqualizerStore } from '../store'

/**
 * Restaura el ecualizador persistido y lo sincroniza con el motor de audio.
 */
export function useEqualizerBootstrap(): void {
  const initializeEqualizer = useEqualizerStore((state) => state.initializeEqualizer)

  useEffect(() => {
    initializeEqualizer()
  }, [initializeEqualizer])
}
