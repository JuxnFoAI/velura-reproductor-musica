/** Hook que inicializa preferencias persistidas al arrancar la aplicación. */

import { useAudioQualityBootstrap } from '@features/audioQuality'
import { useLyricsFontBootstrap } from '@features/customization'
import { useDesktopAppDocumentClass } from './useDesktopAppDocumentClass'

/**
 * Restaura personalización y calidad de audio al iniciar.
 */
export function useAppBootstrap(): void {
  useDesktopAppDocumentClass()
  useLyricsFontBootstrap()
  useAudioQualityBootstrap()
}
