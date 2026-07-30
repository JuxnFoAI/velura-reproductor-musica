/** Hook que inicializa la personalización del modo letra al arrancar la aplicación. */

import { useEffect } from 'react'

import { useCustomizationStore } from '../store'

/**
 * Restaura y aplica la fuente, el tamaño y los colores del reproductor guardados por el usuario.
 */
export function useLyricsFontBootstrap(): void {
  const initializeLyricsFont = useCustomizationStore((state) => state.initializeLyricsFont)
  const isLyricsFontReady = useCustomizationStore((state) => state.isLyricsFontReady)

  useEffect(() => {
    if (isLyricsFontReady) {
      return
    }

    void initializeLyricsFont()
  }, [initializeLyricsFont, isLyricsFontReady])
}
