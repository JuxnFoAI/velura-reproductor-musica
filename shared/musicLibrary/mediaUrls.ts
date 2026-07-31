/** Construye URLs del protocolo velura-media para audio, portadas y letras. */
import { VELURA_MEDIA_SCHEME, type MusicLibraryMediaKind } from './ipcChannels'

/**
 * Genera una URL consumible por `<audio>`, `<img>` o `fetch` en la app de escritorio.
 */
export function buildVeluraMediaUrl(
  kind: MusicLibraryMediaKind,
  relativePath: string,
  cacheBust?: number,
): string {
  const url = new URL(`${VELURA_MEDIA_SCHEME}://${kind}/`)
  url.searchParams.set('path', relativePath)

  if (cacheBust !== undefined) {
    url.searchParams.set('v', String(cacheBust))
  }

  return url.toString()
}
