/** Hook que inicializa preferencias persistidas al arrancar la aplicación. */

import { useAudioQualityBootstrap } from '@features/audioQuality'
import { useLyricsFontBootstrap } from '@features/customization'
import { useDesktopAppDocumentClass } from './useDesktopAppDocumentClass'

/**
 * Restaura personalización, ecualizador y normalización de volumen guardados por el usuario.
 */
export function useAppBootstrap(): void {
  useDesktopAppDocumentClass()
  useLyricsFontBootstrap()
  useAudioQualityBootstrap()
}
