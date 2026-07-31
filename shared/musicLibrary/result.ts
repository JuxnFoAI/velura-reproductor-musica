/** Resultado tipado de operaciones de biblioteca para HTTP, IPC o tests. */

export interface MusicLibraryFailure {
  ok: false
  status: number
  message: string
}

export interface MusicLibrarySuccess<T> {
  ok: true
  data: T
}

export type MusicLibraryResult<T> = MusicLibrarySuccess<T> | MusicLibraryFailure

export function musicLibrarySuccess<T>(data: T): MusicLibrarySuccess<T> {
  return { ok: true, data }
}

export function musicLibraryFailure(status: number, message: string): MusicLibraryFailure {
  return { ok: false, status, message }
}
