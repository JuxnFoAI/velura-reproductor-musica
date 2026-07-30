/** Hook para cargar y parsear la letra de la pista activa. */

import { useEffect, useState } from 'react'

import { resolveLyricsExtensionFromRelativePath } from '../services/lyricsFileService'

import { parseLyricsContent } from '../services/lrcParser'

import { fetchTrackLyricsContent } from '../services/localMusicLibraryService'

import { usePlayerStore } from '../store/playerStore'

import type { ParsedLyrics } from '../types/lyrics'



export type TrackLyricsStatus = 'idle' | 'loading' | 'ready' | 'error' | 'missing'



interface UseTrackLyricsResult {

  parsedLyrics: ParsedLyrics | null

  status: TrackLyricsStatus

}



interface LoadedLyricsState {

  fetchKey: string

  parsedLyrics: ParsedLyrics | null

  status: TrackLyricsStatus

}



function buildLyricsFetchKey(

  trackId: string,

  lyricsRelativePath: string,

  trackDuration: number,

  lyricsContentRevision: number,

): string {

  return `${trackId}:${lyricsRelativePath}:${trackDuration}:${lyricsContentRevision}`

}



/**

 * Obtiene y parsea el archivo de letra asociado a una pista.

 */

export function useTrackLyrics(

  trackId: string | undefined,

  lyricsRelativePath: string | null | undefined,

  trackDuration: number,

): UseTrackLyricsResult {

  const [loadedState, setLoadedState] = useState<LoadedLyricsState | null>(null)

  const lyricsContentRevision = usePlayerStore((state) =>

    trackId ? (state.lyricsContentRevisions[trackId] ?? 0) : 0,

  )



  const fetchKey =

    trackId && lyricsRelativePath

      ? buildLyricsFetchKey(trackId, lyricsRelativePath, trackDuration, lyricsContentRevision)

      : null



  useEffect(() => {

    if (!fetchKey || !trackId || !lyricsRelativePath) {

      return undefined

    }



    let isCancelled = false



    void fetchTrackLyricsContent(lyricsRelativePath, lyricsContentRevision)

      .then((content) => {

        if (isCancelled) {

          return

        }



        const extension = resolveLyricsExtensionFromRelativePath(lyricsRelativePath)

        const parsed = parseLyricsContent(content, extension, trackDuration)



        setLoadedState({

          fetchKey,

          parsedLyrics: parsed,

          status: parsed.lines.length > 0 ? 'ready' : 'missing',

        })

      })

      .catch(() => {

        if (isCancelled) {

          return

        }



        setLoadedState({

          fetchKey,

          parsedLyrics: null,

          status: 'error',

        })

      })



    return () => {

      isCancelled = true

    }

  }, [fetchKey, trackId, lyricsRelativePath, trackDuration, lyricsContentRevision])



  if (!fetchKey) {

    return { parsedLyrics: null, status: 'missing' }

  }



  if (loadedState?.fetchKey !== fetchKey) {

    return { parsedLyrics: null, status: 'loading' }

  }



  return {

    parsedLyrics: loadedState.parsedLyrics,

    status: loadedState.status,

  }

}

