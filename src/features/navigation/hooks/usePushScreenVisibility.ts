/** Hook compartido para montar y animar la entrada de pantallas push. */

import { useEffect, useLayoutEffect, useState } from 'react'



const PUSH_TRANSITION_MS = 650



/**

 * Espera a que el navegador pinte el estado inicial antes de iniciar la transición.

 */

function scheduleEnterAnimation(onEnter: () => void): () => void {

  let enterFrameId = 0



  const prepareFrameId = requestAnimationFrame(() => {

    enterFrameId = requestAnimationFrame(onEnter)

  })



  return () => {

    cancelAnimationFrame(prepareFrameId)

    cancelAnimationFrame(enterFrameId)

  }

}



/**

 * Gestiona montaje y visibilidad para paneles push.

 * @param isOpen - Indica si la pantalla debe mostrarse.

 * @param lockScroll - Bloquea el scroll del body mientras está montada.

 */

export function usePushScreenVisibility(isOpen: boolean, lockScroll = true) {

  const [isMounted, setIsMounted] = useState(false)

  const [isVisible, setIsVisible] = useState(false)



  if (isOpen && !isMounted) {

    setIsMounted(true)

    setIsVisible(false)

  }



  if (!isOpen && isVisible) {

    setIsVisible(false)

  }



  useEffect(() => {

    if (isOpen) {

      return undefined

    }



    const timeoutId = window.setTimeout(() => setIsMounted(false), PUSH_TRANSITION_MS)

    return () => window.clearTimeout(timeoutId)

  }, [isOpen])



  useLayoutEffect(() => {

    if (!isMounted || !isOpen) {

      return undefined

    }



    return scheduleEnterAnimation(() => setIsVisible(true))

  }, [isMounted, isOpen])



  useEffect(() => {

    if (!isMounted || !lockScroll) {

      return undefined

    }



    document.body.style.overflow = 'hidden'



    return () => {

      document.body.style.overflow = ''

    }

  }, [isMounted, lockScroll])



  return { isMounted, isVisible }

}

