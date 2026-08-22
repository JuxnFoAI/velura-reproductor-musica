/** Identificador estable de una pista a partir de su ruta relativa. */

import { createHash } from 'node:crypto'

export function createTrackId(relativePath: string): string {
  return createHash('sha256').update(relativePath).digest('hex').slice(0, 16)
}
