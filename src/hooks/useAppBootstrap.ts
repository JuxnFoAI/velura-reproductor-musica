/** Hook que inicializa preferencias persistidas al arrancar la aplicación. */

import { useAudioQualityBootstrap } from '@features/audioQuality'
import { useLyricsFontBootstrap } from '@features/customization'
import { useDesktopIslandSync } from '@features/musicPlayer'
import { useDesktopAppDocumentClass } from './useDesktopAppDocumentClass'

/**
 * Restaura personalización y calidad de audio, y sincroniza la isla de escritorio.
 */
export function useAppBootstrap(): void {
  useDesktopAppDocumentClass()
  useLyricsFontBootstrap()
  useAudioQualityBootstrap()
  useDesktopIslandSync()
}
