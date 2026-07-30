/** Hook que sincroniza la cola con la biblioteca mi-musica del proyecto. */
import { useEffect, useState } from 'react'
import { enrichTracksWithDuration } from '../services/fileService'
import { fetchLocalMusicLibrary } from '../services/localMusicLibraryService'
import { playerStore, usePlayerStore } from '../store/playerStore'

type LibraryStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error'

interface UseLocalMusicLibraryResult {
  status: LibraryStatus
  errorMessage: string | null
}

interface LibraryLoadSnapshot {
  status: LibraryStatus
  errorMessage: string | null
}

const libraryLoadSnapshot: LibraryLoadSnapshot = {
  status: 'idle',
  errorMessage: null,
}

let libraryLoadPromise: Promise<void> | null = null

/**
 * Completa duraciones faltantes en segundo plano sin bloquear la restauración de sesión.
 */
async function enrichMissingTrackDurationsInBackground(): Promise<void> {
  const { libraryQueue, updateTrackDurations } = playerStore.getState()

  if (libraryQueue.every((track) => track.duration > 0)) {
    return
  }

  const enrichedTracks = await enrichTracksWithDuration(libraryQueue)
  updateTrackDurations(enrichedTracks)
}

async function loadLocalMusicLibraryOnce(
  loadLibraryTracks: ReturnType<typeof usePlayerStore.getState>['loadLibraryTracks'],
): Promise<void> {
  if (libraryLoadPromise) {
    return libraryLoadPromise
  }

  libraryLoadSnapshot.status = 'loading'
  libraryLoadSnapshot.errorMessage = null

  libraryLoadPromise = (async () => {
    try {
      const library = await fetchLocalMusicLibrary()

      loadLibraryTracks(library.tracks)
      await playerStore.getState().restoreSession()
      libraryLoadSnapshot.status = library.tracks.length > 0 ? 'ready' : 'empty'
      libraryLoadSnapshot.errorMessage = null

      void enrichMissingTrackDurationsInBackground()
    } catch {
      libraryLoadSnapshot.status = 'error'
      libraryLoadSnapshot.errorMessage = 'No se pudo acceder a la biblioteca mi-musica.'
    }
  })()

  return libraryLoadPromise
}

/**
 * Carga los MP3 de la carpeta mi-musica una sola vez y comparte el estado entre consumidores.
 */
export function useLocalMusicLibrary(): UseLocalMusicLibraryResult {
  const loadLibraryTracks = usePlayerStore((state) => state.loadLibraryTracks)
  const [status, setStatus] = useState<LibraryStatus>(libraryLoadSnapshot.status)
  const [errorMessage, setErrorMessage] = useState<string | null>(libraryLoadSnapshot.errorMessage)

  useEffect(() => {
    let isCancelled = false

    const syncSnapshot = (): void => {
      if (isCancelled) {
        return
      }

      setStatus(libraryLoadSnapshot.status)
      setErrorMessage(libraryLoadSnapshot.errorMessage)
    }

    syncSnapshot()

    void loadLocalMusicLibraryOnce(loadLibraryTracks).then(() => {
      syncSnapshot()
    })

    return () => {
      isCancelled = true
    }
  }, [loadLibraryTracks])

  return {
    status,
    errorMessage,
  }
}

export type { LibraryStatus }
