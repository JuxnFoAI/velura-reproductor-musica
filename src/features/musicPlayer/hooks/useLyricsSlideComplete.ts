/** Hook que indica cuándo termina la animación de desplazamiento del modo letra. */

import { useEffect, useState } from 'react'

import { LYRICS_COVER_SLIDE_MS } from '../lib/lyricsConstants'



/**

 * Retorna true cuando la animación de portada (800 ms) ha finalizado tras activar el modo letra.

 */

export function useLyricsSlideComplete(isLyricsVisible: boolean): boolean {

  const [isSlideComplete, setIsSlideComplete] = useState(false)



  if (!isLyricsVisible && isSlideComplete) {

    setIsSlideComplete(false)

  }



  useEffect(() => {

    if (!isLyricsVisible) {

      return undefined

    }



    const timerId = window.setTimeout(() => {

      setIsSlideComplete(true)

    }, LYRICS_COVER_SLIDE_MS)



    return () => {

      window.clearTimeout(timerId)

      setIsSlideComplete(false)

    }

  }, [isLyricsVisible])



  return isLyricsVisible && isSlideComplete

}

