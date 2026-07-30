/** Pantalla de intro con logo, nombre de la app, tagline y loading dots antes del reproductor. */
import { useEffect, useRef, useState } from 'react'
import { logoUrl } from '@assets'
import styles from './IntroOverlay.module.css'

const INTRO_TOTAL_MS = 7500
const FADE_OUT_START_MS = 6900
const FADE_OUT_DURATION_MS = 600

interface IntroOverlayProps {
  /** Se ejecuta al terminar el fade out (7.5 s desde el montaje). */
  onFinish?: () => void
}

/**
 * Overlay de bienvenida de 7.5 s con animaciones CSS nativas.
 * La carga de datos puede ejecutarse en paralelo mientras este componente está montado.
 */
export function IntroOverlay({ onFinish }: IntroOverlayProps) {
  const [isExiting, setIsExiting] = useState(false)
  const onFinishRef = useRef(onFinish)

  useEffect(() => {
    onFinishRef.current = onFinish
  }, [onFinish])

  useEffect(() => {
    const fadeOutTimerId = window.setTimeout(() => {
      setIsExiting(true)
    }, FADE_OUT_START_MS)

    const finishTimerId = window.setTimeout(() => {
      onFinishRef.current?.()
    }, INTRO_TOTAL_MS)

    return () => {
      window.clearTimeout(fadeOutTimerId)
      window.clearTimeout(finishTimerId)
    }
  }, [])

  return (
    <div
      className={`${styles.overlay} ${isExiting ? styles.overlayExiting : ''}`}
      style={
        isExiting
          ? { animationDuration: `${FADE_OUT_DURATION_MS}ms` }
          : undefined
      }
      role="presentation"
      aria-hidden="true"
    >
      <div className={styles.content}>
        <div className={styles.brand}>
          <img
            className={styles.logo}
            src={logoUrl}
            alt=""
            width={168}
            height={168}
            draggable={false}
          />

          <h1 className={`${styles.appName} bebas-neue-regular`}>Velura</h1>
        </div>

        <div className={styles.dots} aria-hidden="true">
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </div>

        <p className={`${styles.tagline} montserrat-regular`}>
          Tú música es tú esencia
        </p>
      </div>
    </div>
  )
}
