/** Toast de notificación con entrada spring, barra de progreso y cierre manual. */
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { Check, Minus, X } from 'lucide-react'
import type { ToastType } from '../../store/toastStore'
import './Toast.css'

const DEFAULT_MESSAGE = 'Se han guardado correctamente los cambios'
const DEFAULT_DURATION_MS = 5000
const ENTER_DURATION_MS = 450
const EXIT_DURATION_MS = 400

export interface ToastProps {
  /** Texto visible del toast. */
  message?: string
  /** Tiempo visible tras completar la entrada, en milisegundos. */
  duration?: number
  /** Se invoca cuando termina la animación de salida. */
  onClose?: () => void
  /** Variante visual del toast. */
  variant?: ToastType
}

/**
 * Notificación efímera con animación de entrada/salida y barra de progreso.
 */
export function Toast({
  message = DEFAULT_MESSAGE,
  duration = DEFAULT_DURATION_MS,
  onClose,
  variant = 'success',
}: ToastProps) {
  const [isExiting, setIsExiting] = useState(false)
  const dismissRequestedRef = useRef(false)
  const dismissTimerRef = useRef<number | null>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  const dismiss = useCallback(() => {
    if (dismissRequestedRef.current) {
      return
    }

    if (dismissTimerRef.current !== null) {
      window.clearTimeout(dismissTimerRef.current)
      dismissTimerRef.current = null
    }

    dismissRequestedRef.current = true
    setIsExiting(true)
  }, [])

  useEffect(() => {
    dismissTimerRef.current = window.setTimeout(() => {
      dismiss()
    }, ENTER_DURATION_MS + duration)

    return () => {
      if (dismissTimerRef.current !== null) {
        window.clearTimeout(dismissTimerRef.current)
        dismissTimerRef.current = null
      }
    }
  }, [dismiss, duration])

  useEffect(() => {
    if (!isExiting) {
      return
    }

    const exitTimerId = window.setTimeout(() => {
      onCloseRef.current?.()
    }, EXIT_DURATION_MS)

    return () => {
      window.clearTimeout(exitTimerId)
    }
  }, [isExiting])

  const progressStyle = {
    '--toast-duration': `${duration}ms`,
  } as CSSProperties

  const isSuccess = variant === 'success'
  const isRemove = variant === 'remove'
  const showProgress = isSuccess || isRemove

  const iconClassName = [
    'toast__icon',
    isRemove ? 'toast__icon--remove' : '',
    !isSuccess && !isRemove ? 'toast__icon--error' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const progressClassName = [
    'toast__progress',
    isRemove ? 'toast__progress--remove' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const progressBarClassName = [
    'toast__progress-bar',
    isRemove ? 'toast__progress-bar--remove' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      role="status"
      className={`toast ${isRemove ? 'toast--remove' : ''} ${isExiting ? 'toast--exit' : 'toast--enter'}`}
      style={progressStyle}
    >
      <div className="toast__body">
        <span className={iconClassName} aria-hidden="true">
          {isSuccess ? (
            <Check size={14} strokeWidth={3} />
          ) : isRemove ? (
            <Minus size={14} strokeWidth={3} />
          ) : (
            <X size={14} strokeWidth={3} />
          )}
        </span>

        <p className="toast__message montserrat-regular">{message}</p>

        <button
          type="button"
          className="toast__close"
          aria-label="Cerrar notificación"
          onClick={(event) => {
            event.stopPropagation()
            dismiss()
          }}
        >
          ✕
        </button>
      </div>

      {showProgress ? (
        <div className={progressClassName} aria-hidden="true">
          <span className={progressBarClassName} />
        </div>
      ) : null}
    </div>
  )
}
